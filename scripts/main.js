// ==========================================
// INITIALIZE APPLICATION
// ==========================================

function initApp() {
    console.log('Initializing app...');
    
    // Initialize DOM elements
    window.app.initializeDOMElements();
    
    // Initialize event listeners
    window.app.connectWalletBtn.addEventListener('click', window.wallet.connectWallet);
    window.app.disconnectWalletBtn.addEventListener('click', window.wallet.disconnectWallet);
    window.app.betButton.addEventListener('click', window.game.placeBet);
    
    // Initialize game components
    window.game.setupInitialCarousel();
    
    // Initialize Privy
    window.wallet.initializePrivy();
}

// Initialize App ketika DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app');
    initApp();
});

// Cleanup ketika window di-close
window.addEventListener('beforeunload', () => {
    if (window.app.gameInterval) {
        clearInterval(window.app.gameInterval);
    }
});
