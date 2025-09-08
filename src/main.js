import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, 
    signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail,
    RecaptchaVerifier, signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { showPage, setupNav } from './modules/ui.js';
import { setupCalculators } from './modules/calculators.js';
import { setupNews } from './modules/news.js';
import { setupPortfolio } from './modules/portfolio.js';
import { setupWatchlist } from './modules/watchlist.js';
import { setupSwingTradeAnalysis } from './modules/aiInsights.js';
import { fetchMarketData } from './modules/marketData.js';

// Initialize Firebase App and Firestore
const firebaseConfig = {
    apiKey: "AIzaSyBKWVhnyjZq3vgiEmSMJ8XK3pJJduFjv50",
    authDomain: "trademetrics-185f5.firebaseapp.com",
    projectId: "trademetrics-185f5",
    storageBucket: "trademetrics-185f5.firebasestorage.app",
    messagingSenderId: "1040133585499",
    appId: "1:1040133585499:web:73fafa884e8afba4911d7e",
    measurementId: "G-TB7LV7M1E8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- NOTIFICATION SYSTEMS ---
function showToastNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    const iconSvg = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    notif.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 4000);
}

function showAuthMessage(message, type = 'success') {
    const authMessageEl = document.getElementById('authMessage');
    authMessageEl.textContent = message;
    authMessageEl.className = `auth-message ${type}`;
    authMessageEl.classList.remove('hidden');
}

function hideAuthMessage() {
    document.getElementById('authMessage').classList.add('hidden');
}


// --- Centralized Authentication UI Logic ---
const PROTECTED_PAGES = ['intraday', 'swing', 'investment', 'analyzer', 'portfolio', 'watchlist'];

const homeBtnActionLogin = () => { document.getElementById('authModal').style.display = 'flex'; };
const homeBtnActionAnalyze = () => { showPage('analyzer'); };

function updateUIForAuthState(user) {
    const authElements = document.querySelectorAll('.requires-auth');
    const homeActionButton = document.getElementById('home-action-btn');
    const isLoggedIn = user && (user.emailVerified || user.phoneNumber);

    authElements.forEach(el => {
        isLoggedIn ? el.classList.remove('hidden') : el.classList.add('hidden');
    });

    if (homeActionButton) {
        homeActionButton.removeEventListener('click', homeBtnActionLogin);
        homeActionButton.removeEventListener('click', homeBtnActionAnalyze);
        if (isLoggedIn) {
            homeActionButton.textContent = 'Start Analyzing';
            homeActionButton.addEventListener('click', homeBtnActionAnalyze);
        } else {
            homeActionButton.textContent = 'Login to Get Started';
            homeActionButton.addEventListener('click', homeBtnActionLogin);
        }
    }
}

function setupNavigation(auth) {
    const navLinks = document.querySelectorAll('a[data-page]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            const user = auth.currentUser;
            const isLoggedIn = user && (user.emailVerified || user.phoneNumber);
            
            if (PROTECTED_PAGES.includes(pageId) && !isLoggedIn) {
                document.getElementById('authModal').style.display = 'flex';
                showToastNotification('Please log in to access this feature.', 'error');
            } else {
                showPage(pageId);
                document.getElementById('mobile-menu')?.classList.add('hidden');
            }
        });
    });
}


// --- AUTHENTICATION MODAL LOGIC ---
function setupAuthModal() {
    const authModal = document.getElementById('authModal');
    const profileBtn = document.getElementById('profile-btn');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    const logoutBtn = document.getElementById('logout-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileContent = document.getElementById('profile-content');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const defaultProfileIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>`;

    let confirmationResult = null;

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signInFormEl = document.getElementById('signInForm');
    const signUpFormEl = document.getElementById('signUpForm');
    const phoneEntryForm = document.getElementById('phone-entry-form');
    const otpEntryForm = document.getElementById('otp-entry-form');
    const otpInputs = document.querySelectorAll('.otp-input');

    function resetAuthForms() {
        signInFormEl.reset();
        signUpFormEl.reset();
        document.getElementById('phone-number-input').value = '';
        otpInputs.forEach(input => input.value = '');
        hideAuthMessage();
    }

    onAuthStateChanged(auth, async (user) => {
        updateUIForAuthState(user);
        const isLoggedIn = user && (user.emailVerified || user.phoneNumber);

        if (isLoggedIn) {
            authModal.style.display = 'none';
            const name = user.displayName || 'User';
            profileContent.innerHTML = `<span class="font-semibold text-sm">${name}</span>`;
            dropdownUserName.textContent = `Welcome, ${name}`;
        } else {
            profileContent.innerHTML = defaultProfileIcon;
            profileDropdown.classList.add('hidden');
            const currentPage = document.querySelector('.page-content[style*="block"]');
            if (currentPage && PROTECTED_PAGES.includes(currentPage.id)) {
                showPage('home');
                showToastNotification('You have been logged out.', 'success');
            }
        }
    });

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (auth.currentUser && (auth.currentUser.emailVerified || auth.currentUser.phoneNumber)) {
                profileDropdown.classList.toggle('hidden');
            } else {
                authModal.style.display = 'flex';
                resetAuthForms();
            }
        });
    }
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', () => { authModal.style.display = 'none'; resetAuthForms(); });
    }
    window.addEventListener('click', (event) => {
        if (event.target === authModal) { authModal.style.display = 'none'; resetAuthForms(); }
        if (profileBtn && !profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    const showEmailTab = document.getElementById('show-email-login-tab');
    const showPhoneTab = document.getElementById('show-phone-login-tab');
    const emailContainer = document.getElementById('email-auth-container');
    const phoneContainer = document.getElementById('phone-auth-container');

    showEmailTab.addEventListener('click', () => {
        emailContainer.classList.remove('hidden');
        phoneContainer.classList.add('hidden');
        showEmailTab.classList.add('active');
        showPhoneTab.classList.remove('active');
        resetAuthForms();
    });

    showPhoneTab.addEventListener('click', () => {
        phoneContainer.classList.remove('hidden');
        emailContainer.classList.add('hidden');
        showPhoneTab.classList.add('active');
        showEmailTab.classList.remove('active');
        resetAuthForms();
        setupRecaptcha();
    });
    
    document.getElementById('show-signup-btn').addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); resetAuthForms(); });
    document.getElementById('show-login-btn').addEventListener('click', (e) => { e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); resetAuthForms(); });

    signUpFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        const dobString = document.getElementById('signup-dob').value;

        const parts = dobString.split('-');
        if (parts.length !== 3) { showAuthMessage('Please enter DOB as DD-MM-YYYY', 'error'); return; }
        const [day, month, year] = parts.map(p => parseInt(p, 10));
        const dob = new Date(year, month - 1, day);
        if (isNaN(dob.getTime())) { showAuthMessage('Invalid Date of Birth.', 'error'); return; }
        const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
        if (age < 16) { showAuthMessage('You must be at least 16 years old.', 'error'); return; }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });
            await setDoc(doc(db, "users", user.uid), { name, dob: dobString, email: user.email, createdAt: new Date() });
            await sendEmailVerification(user);
            showAuthMessage('Account created! Please check your email to verify.', 'success');
            await signOut(auth);
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } catch (error) {
            showAuthMessage(error.message, 'error');
        }
    });

    signInFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                showAuthMessage('Please verify your email address to log in.', 'error');
                await signOut(auth);
                return;
            }
        } catch (error) {
            showAuthMessage('Incorrect email or password.', 'error');
        }
    });

    document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        if (!email) { showAuthMessage('Please enter your email to reset password.', 'error'); return; }
        try {
            await sendPasswordResetEmail(auth, email);
            showAuthMessage('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            showAuthMessage(error.message, 'error');
        }
    });

    function setupRecaptcha() {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            window.recaptchaVerifier.render();
        }
    }

    document.getElementById('send-otp-btn').addEventListener('click', async () => {
        const phoneNumber = "+91" + document.getElementById('phone-number-input').value;
        const appVerifier = window.recaptchaVerifier;
        try {
            confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            phoneEntryForm.classList.add('hidden');
            otpEntryForm.classList.remove('hidden');
            showAuthMessage('OTP sent successfully!', 'success');
            document.querySelector('.otp-input').focus();
        } catch (error) {
            showAuthMessage(`Error sending OTP: ${error.message}`, 'error');
            window.recaptchaVerifier = null; 
            document.getElementById('recaptcha-container').innerHTML = '';
            setupRecaptcha();
        }
    });
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => { if (input.value.length === 1 && index < otpInputs.length - 1) { otpInputs[index + 1].focus(); } });
        input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && input.value.length === 0 && index > 0) { otpInputs[index - 1].focus(); } });
    });

    document.getElementById('verify-otp-btn').addEventListener('click', async () => {
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        if (otp.length !== 6) { showAuthMessage('Please enter a 6-digit OTP.', 'error'); return; }
        try {
            await confirmationResult.confirm(otp);
        } catch (error) {
            showAuthMessage('Invalid OTP. Please try again.', 'error');
        }
    });

    document.getElementById('change-number-link').addEventListener('click', (e) => { e.preventDefault(); otpEntryForm.classList.add('hidden'); phoneEntryForm.classList.remove('hidden'); resetAuthForms(); });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => { e.preventDefault(); signOut(auth); });
    }
}

// --- MAIN APPLICATION SETUP ---
function setupApplication() {
    setupNav();
    setupNavigation(auth);
    setupCalculators();
    // Pass the db and auth instances to the news module
    setupNews();
    // Pass the db and auth instances to the portfolio module
    setupPortfolio(db, auth);
    // Pass the db and auth instances to the watchlist module
    setupWatchlist(db, auth);
    setupSwingTradeAnalysis();
    setupAuthModal();

    showPage('home');
    fetchMarketData();

    setInterval(fetchMarketData, 60000);
}

document.addEventListener('DOMContentLoaded', setupApplication);