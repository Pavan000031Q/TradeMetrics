import { showCustomMessage } from './ui.js';
// NEW: Import Firestore and Auth functions
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Global variables to hold the watchlist state
let watchlist = [];
let db, auth; // NEW: To hold Firebase instances

// --- NEW: Firestore Data Functions ---

async function saveWatchlistToFirestore() {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid, 'watchlist', 'data');
    try {
        // We save the entire watchlist array in a single document
        await setDoc(userDocRef, { items: watchlist });
    } catch (error) {
        console.error("Error saving watchlist to Firestore:", error);
        showCustomMessage("Could not save watchlist to the cloud.", "error");
    }
}

async function loadWatchlistFromFirestore() {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid, 'watchlist', 'data');
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        watchlist = docSnap.data().items || [];
    } else {
        watchlist = []; // If no data, start with an empty list
    }
}

// CHANGED: The main setup function now accepts db and auth instances
export function setupWatchlist(database, authentication) {
    db = database;
    auth = authentication;

    const watchlistForm = document.getElementById('watchlistForm');
    const watchlistContainer = document.getElementById('watchlistContainer');

    // NEW: Listen for authentication changes to load/clear data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User logged in, load their watchlist
            await loadWatchlistFromFirestore();
            renderWatchlist();
        } else {
            // User logged out, clear the watchlist
            watchlist = [];
            renderWatchlist();
        }
    });

    if (watchlistForm) {
        watchlistForm.addEventListener('submit', async (e) => { // CHANGED: Made async
            e.preventDefault();
            const stockName = document.getElementById('watchlistStockName').value;
            const targetPrice = parseFloat(document.getElementById('watchlistTargetPrice').value);

            if (stockName && !isNaN(targetPrice) && targetPrice > 0) {
                watchlist.push({ id: Date.now(), name: stockName, target: targetPrice });
                await saveWatchlistToFirestore(); // CHANGED: Save to Firestore
                renderWatchlist();
                watchlistForm.reset();
            } else {
                showCustomMessage('Please enter a valid stock name and target price.', 'error');
            }
        });
    }

    function renderWatchlist() {
        if (!watchlistContainer) return;
        watchlistContainer.innerHTML = '';
        if (watchlist.length === 0) {
            watchlistContainer.innerHTML = '<div class="text-center text-gray-500 p-4">Your watchlist is empty.</div>';
        } else {
            watchlist.forEach(stock => {
                const itemEl = document.createElement('div');
                itemEl.className = 'p-3 flex justify-between items-center bg-gray-900 rounded-lg';
                itemEl.innerHTML = `
                    <div>
                        <p class="font-bold text-white">${stock.name}</p>
                        <p class="text-sm text-gray-400">Target: ₹${stock.target.toFixed(2)}</p>
                    </div>
                    <button class="delete-watchlist-btn p-1 text-red-500 hover:text-red-400" data-id="${stock.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                watchlistContainer.appendChild(itemEl);
            });
            document.querySelectorAll('.delete-watchlist-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => { // CHANGED: Made async
                    const id = Number(e.currentTarget.dataset.id);
                    watchlist = watchlist.filter(item => item.id !== id);
                    await saveWatchlistToFirestore(); // CHANGED: Save to Firestore
                    renderWatchlist();
                });
            });
        }
    }
}