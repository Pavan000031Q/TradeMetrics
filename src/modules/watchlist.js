import { showToastNotification } from '../main.js';
// Import Firestore and Auth functions
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Global variables to hold the watchlist state
let watchlist = [];
let db, auth; // To hold Firebase instances

// Firestore Data Functions
async function saveWatchlistToFirestore() {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid, 'watchlist', 'data');
    try {
        // We save the entire watchlist array in a single document
        await setDoc(userDocRef, { items: watchlist });
    } catch (error) {
        console.error("Error saving watchlist to Firestore:", error);
        showToastNotification("Could not save watchlist to the cloud.", "error");
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

// The main setup function now accepts db and auth instances
export function setupWatchlist(database, authentication) {
    db = database;
    auth = authentication;

    const watchlistForm = document.getElementById('watchlistForm');
    const watchlistContainer = document.getElementById('watchlistContainer');

    // Listen for authentication changes to load/clear data
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
        watchlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const stockName = document.getElementById('watchlistStockName').value;
            const targetPrice = parseFloat(document.getElementById('watchlistTargetPrice').value);

            if (stockName && !isNaN(targetPrice) && targetPrice > 0) {
                watchlist.push({
                    id: Date.now(),
                    name: stockName,
                    target: targetPrice
                });

                await saveWatchlistToFirestore(); // Save to Firestore
                renderWatchlist();
                watchlistForm.reset();
            } else {
                showToastNotification('Please enter a valid stock name and target price.', 'error');
            }
        });
    }

    function renderWatchlist() {
        if (!watchlistContainer) return;

        watchlistContainer.innerHTML = '';

        if (watchlist.length === 0) {
            watchlistContainer.innerHTML = '<div class="text-center text-gray-400 py-8">No stocks in your watchlist yet. Add one above!</div>';
            return;
        }

        watchlist.forEach(stock => {
            const stockEl = document.createElement('div');
            stockEl.className = 'bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 flex justify-between items-center';
            stockEl.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg">${stock.name}</h3>
                    <p class="text-gray-400">Target: ₹${stock.target.toFixed(2)}</p>
                </div>
                <button class="remove-watchlist-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" data-id="${stock.id}">Remove</button>
            `;

            watchlistContainer.appendChild(stockEl);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-watchlist-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number(e.target.dataset.id);
                watchlist = watchlist.filter(stock => stock.id !== id);
                await saveWatchlistToFirestore(); // Save to Firestore
                renderWatchlist();
            });
        });
    }
}
