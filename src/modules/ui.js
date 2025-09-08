export function showPage(pageId) {
    const pageContents = document.querySelectorAll('.page-content');
    const navLinks = document.querySelectorAll('.nav-link');

    pageContents.forEach(page => { page.style.display = 'none'; });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
    // The mobile menu is now hidden from the click handler in main.js
}

/**
 * Sets up UI event listeners. This function now only handles the mobile menu toggle.
 * Page navigation logic is handled in main.js to incorporate authentication checks.
 */
export function setupNav() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => { 
            mobileMenu.classList.toggle('hidden'); 
        });
    }
}

// Custom function to show a modal instead of alert()
export function showCustomMessage(message, type) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-900 p-6 rounded-lg shadow-xl max-w-sm mx-auto text-center border ${type === 'error' ? 'border-red-500' : 'border-yellow-500'}">
            <p class="text-lg font-semibold ${type === 'error' ? 'text-red-400' : 'text-yellow-400'}">${message}</p>
            <button class="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('button').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}