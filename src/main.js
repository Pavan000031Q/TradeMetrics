import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signInWithEmailAndPassword, 
    signOut, 
    sendEmailVerification, 
    sendPasswordResetEmail, 
    GoogleAuthProvider, 
    signInWithPopup, 
    RecaptchaVerifier, 
    signInWithPhoneNumber 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Your existing imports...
import { showPage, setupNav } from './modules/ui.js';
import { setupCalculators } from './modules/calculators.js';
import { setupNews } from './modules/news.js';
import { setupPortfolio } from './modules/portfolio.js';
import { setupWatchlist } from './modules/watchlist.js';
import { setupSwingTradeAnalysis } from './modules/aiInsights.js';
import { fetchMarketData } from './modules/marketData.js';

// Firebase Configuration
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

// --- CONSTANTS ---
const PROTECTED_PAGES = ['swing', 'analyzer', 'portfolio', 'watchlist'];

// --- VALIDATION FUNCTIONS ---
function validateEmailLogin(email, password) {
    const errors = [];
    
    if (!email || email.trim() === '') {
        errors.push('Email');
    }
    if (!password || password.trim() === '') {
        errors.push('Password');
    }
    
    if (errors.length > 0) {
        const message = errors.length === 1 
            ? `Please enter your ${errors[0]}` 
            : `Please fill in: ${errors.join(', ')}`;
        showAuthMessage(message, 'error');
        return false;
    }
    return true;
}

function validateEmailSignup(email, password, name, dob) {
    const errors = [];
    
    // Required fields for email signup (NO phone number)
    if (!email || email.trim() === '') errors.push('Email');
    if (!password || password.trim() === '') errors.push('Password');
    if (!name || name.trim() === '') errors.push('Full Name');
    if (!dob || dob.trim() === '') errors.push('Date of Birth');
    
    if (errors.length > 0) {
        const message = errors.length === 1 
            ? `Please enter your ${errors[0]}` 
            : `Please fill in: ${errors.join(', ')}`;
        showAuthMessage(message, 'error');
        return false;
    }
    return true;
}

function validateProfileCompletion(name, dob) {
    const errors = [];
    
    // Only name and DOB are required - email and phone are optional
    if (!name || name.trim() === '') errors.push('Full Name');
    if (!dob || dob.trim() === '') errors.push('Date of Birth');
    
    if (errors.length > 0) {
        const message = errors.length === 1 
            ? `Please enter your ${errors[0]}` 
            : `Please fill in: ${errors.join(', ')}`;
        showToastNotification(message, 'error');
        return false;
    }
    return true;
}

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
    setTimeout(() => notif.remove(), 4000);
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

// --- NAVIGATION SETUP (MOVED OUT OF MODAL) ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            const user = auth.currentUser;
            const isLoggedIn = !!user;
            
            // Check if page requires authentication
            if (PROTECTED_PAGES.includes(pageId) && !isLoggedIn) {
                document.getElementById('authModal').style.display = 'flex';
                showToastNotification('Please log in to access this feature.', 'error');
            } else {
                showPage(pageId);
                // Close mobile menu if it exists
                document.getElementById('mobile-menu')?.classList.add('hidden');
            }
        });
    });
}

// --- UI STATE MANAGEMENT ---
function updateUIForAuthState(user) {
    const authElements = document.querySelectorAll('.requires-auth');
    const homeActionButton = document.getElementById('home-action-btn');
    const isLoggedIn = !!user;
    
    // Show/hide auth-required elements
    authElements.forEach(el => {
        isLoggedIn ? el.classList.remove('hidden') : el.classList.add('hidden');
    });
    
    // Update home action button
    if (homeActionButton) {
        // Remove existing listeners
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

// Home button actions
const homeBtnActionLogin = () => {
    document.getElementById('authModal').style.display = 'flex';
};

const homeBtnActionAnalyze = () => {
    showPage('analyzer');
};

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
    
    // User Info Collection Modal elements
    const userInfoModal = document.getElementById('userInfoModal');
    const userInfoForm = document.getElementById('userInfoForm');
    const userInfoNameInput = document.getElementById('userInfoName');
    const userInfoDobInput = document.getElementById('userInfoDob');
    
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
        
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            isRecaptchaInitialized = false;
        }
    }

    // Initialize RecaptchaVerifier
    const initializeRecaptcha = () => {
        if (!isRecaptchaInitialized) {
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (recaptchaContainer) {
                recaptchaContainer.innerHTML = '';
                recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
                    'size': 'normal',
                    'callback': (response) => {
                        // reCAPTCHA solved
                    },
                    'expired-callback': () => {
                        showToastNotification('reCAPTCHA expired. Please try again.', 'error');
                        recaptchaVerifier.render();
                    }
                });
                recaptchaVerifier.render();
                isRecaptchaInitialized = true;
            } else {
                showToastNotification('Error: reCAPTCHA container not found. Please refresh the page.', 'error');
            }
        }
    };

    // Auth State Observer
    onAuthStateChanged(auth, async (user) => {
        updateUIForAuthState(user);
        const isLoggedIn = !!user;
        
        if (isLoggedIn) {
            authModal.style.display = 'none';
            const name = user.displayName || 'User';
            profileContent.innerHTML = name;
            dropdownUserName.textContent = `Welcome, ${name}`;
            
            // Check if user data exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            
            if (!docSnap.exists() || !docSnap.data()?.profileCompleted) {
                // NEW ACCOUNT or INCOMPLETE PROFILE
                userInfoModal.style.display = 'flex';
                
                // Pre-fill name if available from Google/existing auth
                if (user.displayName) {
                    userInfoNameInput.value = user.displayName;
                }
            } else {
                userInfoModal.style.display = 'none';
            }
        } else {
            profileContent.innerHTML = defaultProfileIcon;
            profileDropdown.classList.add('hidden');
            
            // Redirect to home if on protected page
            const currentPage = document.querySelector('.page-content[style*="block"]');
            if (currentPage && PROTECTED_PAGES.includes(currentPage.id)) {
                showPage('home');
                showToastNotification('You have been logged out.', 'success');
            }
        }
    });

    // Modal Controls
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
        closeAuthModalBtn.addEventListener('click', () => {
            authModal.style.display = 'none';
            resetAuthForms();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
            resetAuthForms();
        }
        
        // Close profile dropdown when clicking outside
        if (profileBtn && !profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.add('hidden');
        }
        
        // Handle user info modal
        if (event.target === userInfoModal) {
            // Don't allow closing by clicking outside - they need to complete profile
            showToastNotification('Please complete your profile to continue.', 'error');
        }
    });

    // Form Switching
    document.getElementById('show-signup-btn').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        resetAuthForms();
    });

    document.getElementById('show-login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        resetAuthForms();
    });

    // Email Signup with Validation
    signUpFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        const dobString = document.getElementById('signup-dob').value;
        
        // Validate email signup fields - NO phone number required
        if (!validateEmailSignup(email, password, name, dobString)) {
            return;
        }

        // Validate DOB format
        const parts = dobString.split('-');
        if (parts.length !== 3) {
            showAuthMessage('Please enter DOB as DD-MM-YYYY', 'error');
            return;
        }

        const [day, month, year] = parts.map(p => parseInt(p, 10));
        const dob = new Date(year, month - 1, day);
        if (isNaN(dob.getTime())) {
            showAuthMessage('Invalid Date of Birth.', 'error');
            return;
        }

        const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
        if (age < 16) {
            showAuthMessage('You must be at least 16 years old.', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: name });
            
            await setDoc(doc(db, 'users', user.uid), {
                name,
                dob: dobString,
                email: user.email,
                createdAt: new Date(),
                authMethod: 'email',
                profileCompleted: true // Set to true for email signup
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

    // Email Sign-in with Validation
    signInFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Validate ONLY email and password - skip phone number
        if (!validateEmailLogin(email, password)) {
            return;
        }

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

    // Forgot Password
    document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        
        if (!email) {
            showAuthMessage('Please enter your email to reset password.', 'error');
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            showAuthMessage('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            showAuthMessage(error.message, 'error');
        }
    });

    // Google Sign-in
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                
                if (!docSnap.exists()) {
                    // New user, show profile completion modal
                    userInfoModal.style.display = 'flex';
                    if (user.displayName) {
                        userInfoNameInput.value = user.displayName;
                    }
                }
            } catch (error) {
                showAuthMessage(`Google sign-in failed: ${error.message}`, 'error');
            }
        });
    }

    // Updated User Info Collection Logic
    if (userInfoForm) {
        userInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = userInfoNameInput.value.trim();
            const dobString = userInfoDobInput.value.trim();
            
            // Get optional email and phone values
            const emailInput = document.getElementById('userInfoEmail');
            const phoneInput = document.getElementById('userInfoPhone');
            const email = emailInput ? emailInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            
            // Only validate required fields (name and DOB)
            if (!validateProfileCompletion(name, dobString)) {
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
                
                // Determine authentication method
                let authMethod = 'email';
                if (user.providerData.some(p => p.providerId === 'google.com')) {
                    authMethod = 'google';
                } else if (user.providerData.some(p => p.providerId === 'phone')) {
                    authMethod = 'phone';
                }
                
                // Update user profile displayName
                await updateProfile(user, { displayName: name });
                
                // Save user data - email and phone can be empty
                const userData = {
                    name: name,
                    dob: dobString,
                    createdAt: new Date(),
                    authMethod: authMethod,
                    profileCompleted: true  // Always set to true regardless of empty optional fields
                };
                
                // Add email if provided or from Firebase auth
                if (email) {
                    userData.email = email;
                } else if (user.email) {
                    userData.email = user.email;
                }
                
                // Add phone if provided or from Firebase auth  
                if (phone) {
                    userData.phone = phone;
                } else if (user.phoneNumber) {
                    userData.phone = user.phoneNumber;
                }
                
                await setDoc(userDocRef, userData, { merge: true });
                
                // Close modal and show success
                userInfoModal.style.display = 'none';
                showToastNotification('Profile information saved successfully!', 'success');
                
                // Update UI with new name
                profileContent.innerHTML = name;
                dropdownUserName.textContent = `Welcome, ${name}`;
                
                // Clear form
                userInfoForm.reset();
                
            } catch (error) {
                console.error('Error saving profile:', error);
                showToastNotification('Failed to save profile information. Please try again.', 'error');
            }
        });
    }

    // Phone Authentication Logic
    if (showPhoneLoginTab) {
        showPhoneLoginTab.addEventListener('click', () => {
            emailAuthContainer.classList.add('hidden');
            phoneAuthContainer.classList.remove('hidden');
            showEmailLoginTab.classList.remove('active');
            showPhoneLoginTab.classList.add('active');
            resetAuthForms();
            initializeRecaptcha();
        });
    }

    if (showEmailLoginTab) {
        showEmailLoginTab.addEventListener('click', () => {
            phoneAuthContainer.classList.add('hidden');
            emailAuthContainer.classList.remove('hidden');
            showPhoneLoginTab.classList.remove('active');
            showEmailLoginTab.classList.add('active');
            resetAuthForms();
        });
    }

    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            phoneAuthContainer.classList.add('hidden');
            emailAuthContainer.classList.remove('hidden');
            showPhoneLoginTab.classList.remove('active');
            showEmailLoginTab.classList.add('active');
            resetAuthForms();
        });
    }

    // Phone Sign-in Form
    if (phoneSignInForm) {
        phoneSignInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneNumber = '+91' + phoneNumberInput.value;
            
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

    // OTP Verification
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = otpCodeInput.value;
            
            if (!confirmationResult) {
                showToastNotification('Something went wrong. Please try again.', 'error');
                return;
            }
            
            try {
                const result = await confirmationResult.confirm(code);
                const user = result.user;
                
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                
                if (!docSnap.exists()) {
                    // New user, show profile completion modal
                    userInfoModal.style.display = 'flex';
                } else {
                    showToastNotification('Signed in successfully!', 'success');
                    authModal.style.display = 'none';
                    resetAuthForms();
                }
            } catch (error) {
                showToastNotification('Invalid OTP. Please try again.', 'error');
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth);
        });
    }
}

// --- MAIN APPLICATION SETUP ---
function setupApplication() {
    setupNav();
    setupNavigation(); // Now properly called outside of modal
    setupCalculators();
    setupNews();
    setupPortfolio(db, auth);
    setupWatchlist(db, auth);
    setupSwingTradeAnalysis();
    setupAuthModal();
    showPage('home');
    fetchMarketData();
    setInterval(fetchMarketData, 60000);
}

document.addEventListener('DOMContentLoaded', setupApplication);
