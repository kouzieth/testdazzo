import { initializeDOMElements } from './app.js';
import { initializePrivy, initializeWalletEventListeners } from './wallet.js';
import { initializeGame } from './game.js';

// ==========================================
// INITIALIZE APPLICATION
// ==========================================
function initApp() {
    console.log('Initializing app...');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Initialize event listeners
    initializeWalletEventListeners();
    initializeGame();
    
    // Initialize Privy
    initializePrivy();
}

// Initialize App ketika DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app');
    initApp();
});

// Cleanup ketika window di-close
window.addEventListener('beforeunload', () => {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
});
