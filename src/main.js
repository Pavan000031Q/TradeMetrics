import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile,
    signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail,
    GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
export function showToastNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    const iconSvg = type === 'success'
        ? `<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`
        : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
    notif.innerHTML = `${iconSvg}${message}`;
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
const PROTECTED_PAGES = ['swing', 'analyzer', 'portfolio', 'watchlist'];

const homeBtnActionLogin = () => { document.getElementById('authModal').style.display = 'flex'; };
const homeBtnActionAnalyze = () => { showPage('analyzer'); };

function updateUIForAuthState(user) {
    const authElements = document.querySelectorAll('.requires-auth');
    const homeActionButton = document.getElementById('home-action-btn');
    const isLoggedIn = user;

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
            const isLoggedIn = user;

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
    const defaultProfileIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>`;

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signInFormEl = document.getElementById('signInForm');
    const signUpFormEl = document.getElementById('signUpForm');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    // DOB Modal elements
    const dobModal = document.getElementById('dobModal');
    const dobForm = document.getElementById('dobForm');
    const dobInput = document.getElementById('dobInput');

    // User Info Collection Modal elements
    const userInfoModal = document.getElementById('userInfoModal');
    const userInfoForm = document.getElementById('userInfoForm');
    const userInfoNameInput = document.getElementById('userInfoName');
    const userInfoDobInput = document.getElementById('userInfoDob');
    const userInfoEmailInput = document.getElementById('userInfoEmail');

    // Phone Auth elements
    const emailAuthContainer = document.getElementById('email-auth-container');
    const phoneAuthContainer = document.getElementById('phone-auth-container');
    const phoneSignInForm = document.getElementById('phoneSignInForm');
    const otpForm = document.getElementById('otpForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const otpCodeInput = document.getElementById('otpCode');
    const showPhoneLoginTab = document.getElementById('show-phone-login-tab');
    const showEmailLoginTab = document.getElementById('show-email-login-tab');
    const backToEmailBtn = document.getElementById('backToEmailBtn');

    let confirmationResult = null;
    let recaptchaVerifier = null;
    let isRecaptchaInitialized = false;

    function resetAuthForms() {
        signInFormEl.reset();
        signUpFormEl.reset();
        if (phoneSignInForm) phoneSignInForm.reset();
        if (otpForm) otpForm.classList.add('hidden');
        if (phoneSignInForm) phoneSignInForm.classList.remove('hidden');
        hideAuthMessage();

        // Reset reCAPTCHA if it exists
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            isRecaptchaInitialized = false;
        }
    }

    // Function to initialize RecaptchaVerifier
    const initializeRecaptcha = () => {
        if (!isRecaptchaInitialized) {
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (recaptchaContainer) {
                // Ensure the container is empty before rendering
                recaptchaContainer.innerHTML = '';
                recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
                    'size': 'normal',
                    'callback': (response) => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                    },
                    'expired-callback': () => {
                        showToastNotification('reCAPTCHA expired. Please try again.', 'error');
                        recaptchaVerifier.render(); // Force a new challenge on expiry
                    },
                    'appVerificationDisabledForTesting': true
                });
                recaptchaVerifier.render();
                isRecaptchaInitialized = true;
            } else {
                showToastNotification("Error: reCAPTCHA container not found. Please refresh the page.", 'error');
            }
        }
    };

    onAuthStateChanged(auth, async (user) => {
        updateUIForAuthState(user);
        const isLoggedIn = !!user;

        if (isLoggedIn) {
            authModal.style.display = 'none';
            const name = user.displayName || 'User';
            profileContent.innerHTML = `${name}`;
            dropdownUserName.textContent = `Welcome, ${name}`;

            // Check if user data exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);

            // Check if the user's profile is complete
            const isProfileCompleted = docSnap.exists() && docSnap.data().profileCompleted;
            
            // Check if email is verified for email/password and if profile is not completed for other methods
            const isEmailPasswordUser = user.providerData.some(p => p.providerId === 'password');
            if ((isEmailPasswordUser && !user.emailVerified) || !isProfileCompleted) {
                userInfoModal.style.display = 'flex';
                
                const emailInputContainer = document.getElementById('email-input-container');
                const emailInput = document.getElementById('userInfoEmail');
                
                const providerId = user.providerData[0]?.providerId;
                if (providerId === 'google.com' || providerId === 'password') {
                    emailInputContainer.style.display = 'none';
                    if (emailInput) {
                        emailInput.removeAttribute('required');
                    }
                } else {
                    emailInputContainer.style.display = 'block';
                    if (emailInput) {
                        emailInput.setAttribute('required', 'required');
                    }
                }
                
                // Pre-fill existing data if available from Firebase or Firestore
                if (user.displayName) {
                    userInfoNameInput.value = user.displayName;
                }
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData.name) {
                        userInfoNameInput.value = userData.name;
                    }
                    if (userData.dob) {
                        userInfoDobInput.value = userData.dob;
                    }
                }
            } else {
                userInfoModal.style.display = 'none';
            }
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
            if (auth.currentUser) {
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

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === authModal) { authModal.style.display = 'none'; resetAuthForms(); }
        if (profileBtn && !profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.add('hidden');
        }
        if (event.target === userInfoModal) {
            showToastNotification('Please complete your profile to continue.', 'error');
        }
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
            
            await setDoc(doc(db, "users", user.uid), { 
                name, 
                dob: dobString, 
                email: user.email, 
                createdAt: new Date(), 
                authMethod: 'email',
                profileCompleted: true
            });
            
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

    // Google Sign-in Logic
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                showAuthMessage(`Google sign-in failed: ${error.message}`, 'error');
            }
        });
    }

    // User Info Collection Logic
    if (userInfoForm) {
        userInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = userInfoNameInput.value.trim();
            const dobString = userInfoDobInput.value.trim();
            
            // Get email value only if the input is visible
            const email = userInfoEmailInput?.value?.trim() || auth.currentUser.email || '';
            
            // Validate name
            if (!name) {
                showToastNotification('Please enter your full name.', 'error');
                return;
            }
            
            // Validate email if the field is visible
            const emailInputContainer = document.getElementById('email-input-container');
            if (emailInputContainer && emailInputContainer.style.display !== 'none' && !email) {
                 showToastNotification('Please enter your email address.', 'error');
                return;
            }

            // Validate DOB format
            const parts = dobString.split('-');
            if (parts.length !== 3) {
                showToastNotification('Please enter a valid DOB in DD-MM-YYYY format.', 'error');
                return;
            }
            
            const [day, month, year] = parts.map(p => parseInt(p, 10));
            const dob = new Date(year, month - 1, day);
            
            if (isNaN(dob.getTime())) {
                showToastNotification('Invalid Date of Birth.', 'error');
                return;
            }
            
            const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
            if (age < 16) {
                showToastNotification('You must be at least 16 years old to use this service.', 'error');
                return;
            }
            
            try {
                const user = auth.currentUser;
                const userDocRef = doc(db, 'users', user.uid);
                
                let authMethod = 'email';
                if (user.providerData.some(p => p.providerId === 'google.com')) {
                    authMethod = 'google';
                } else if (user.providerData.some(p => p.providerId === 'phone')) {
                    authMethod = 'phone';
                }
                
                await updateProfile(user, { displayName: name });
                
                await setDoc(userDocRef, { 
                    name: name, 
                    dob: dobString,
                    email: email,
                    phone: user.phoneNumber || '',
                    createdAt: new Date(),
                    authMethod: authMethod,
                    profileCompleted: true
                }, { merge: true });
                
                userInfoModal.style.display = 'none';
                showToastNotification('Profile information saved successfully!', 'success');
                
                profileContent.innerHTML = `${name}`;
                dropdownUserName.textContent = `Welcome, ${name}`;
                
                userInfoForm.reset();
                
            } catch (error) {
                console.error('Error saving profile:', error);
                showToastNotification('Failed to save profile information. Please try again.', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => { e.preventDefault(); signOut(auth); });
    }

    // Phone Authentication Logic
    showPhoneLoginTab.addEventListener('click', () => {
        emailAuthContainer.classList.add('hidden');
        phoneAuthContainer.classList.remove('hidden');
        showEmailLoginTab.classList.remove('active');
        showPhoneLoginTab.classList.add('active');
        resetAuthForms();
        initializeRecaptcha();
    });

    showEmailLoginTab.addEventListener('click', () => {
        phoneAuthContainer.classList.add('hidden');
        emailAuthContainer.classList.remove('hidden');
        showPhoneLoginTab.classList.remove('active');
        showEmailLoginTab.classList.add('active');
        resetAuthForms();
    });

    backToEmailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        phoneAuthContainer.classList.add('hidden');
        emailAuthContainer.classList.remove('hidden');
        showPhoneLoginTab.classList.remove('active');
        showEmailLoginTab.classList.add('active');
        resetAuthForms();
    });

    if (phoneSignInForm) {
        phoneSignInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneNumber = `+91${phoneNumberInput.value}`;

            try {
                if (!recaptchaVerifier || !recaptchaVerifier.verify) {
                    throw new Error('reCAPTCHA not ready. Please wait a moment and try again.');
                }

                confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
                showToastNotification('OTP sent to your phone!', 'success');
                phoneSignInForm.classList.add('hidden');
                otpForm.classList.remove('hidden');
            } catch (error) {
                showToastNotification(error.message, 'error');
                if (error.code === 'auth/invalid-phone-number') {
                    showToastNotification('Invalid phone number format.', 'error');
                }
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = otpCodeInput.value;

            if (!confirmationResult) {
                showToastNotification('Something went wrong. Please try again.', 'error');
                return;
            }

            try {
                await confirmationResult.confirm(code);
                showToastNotification('Signed in successfully!', 'success');
                authModal.style.display = 'none';
                resetAuthForms();
            } catch (error) {
                showToastNotification('Invalid OTP. Please try again.', 'error');
            }
        });
    }
}

// --- MAIN APPLICATION SETUP ---
function setupApplication() {
    setupNav();
    setupNavigation(auth);
    setupCalculators();
    setupNews(db);
    setupPortfolio(db, auth);
    setupWatchlist(db, auth);
    setupSwingTradeAnalysis();
    setupAuthModal();
    showPage('home');
    fetchMarketData();
    setInterval(fetchMarketData, 60000);
}

document.addEventListener('DOMContentLoaded', setupApplication);
