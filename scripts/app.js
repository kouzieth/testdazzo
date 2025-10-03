// ==========================================
// KONFIGURASI APLIKASI
// ==========================================

// Buat object window.app terlebih dahulu
window.app = {
    // 🔑 GANTI DENGAN PRIVY APP ID ANDA
    PRIVY_APP_ID: 'cmgb2kkqc000kkv0d96pfrstl', // ⚠️ Ganti dengan App ID Anda!

    // Konfigurasi Contract
    CONTRACT_ADDRESS: "0xB4BA0d964CB4Ef4c2CEC675299e1058102435b1b",
    CONTRACT_ABI: [
        "function placeBet(uint256 _roundId) external payable",
        "function endRound(uint256 _roundId) external",
        "function currentRoundId() external view returns (uint256)",
        "function getRoundInfo(uint256 _roundId) external view returns (uint256 totalPrize, uint256 playerCount, uint256 timeLeft, bool ended, address winner)",
        "function getPlayerBet(uint256 _roundId, address _player) external view returns (uint256)",
        "function getRoundPlayers(uint256 _roundId) external view returns (address[] memory)",
        "function totalJackpot() external view returns (uint256)",
        "event BetPlaced(address indexed player, uint256 roundId, uint256 amount)",
        "event RoundEnded(uint256 roundId, address winner, uint256 amount)"
    ],

    // Konfigurasi Game
    PROFILE_IMAGE_URL: 'https://i.ibb.co/VMy4P36/P-icon-by-vexel.png',
    TOTAL_SLOTS: 20,

    // Variabel Global (akan diisi nanti)
    provider: null,
    signer: null,
    contract: null,
    userAddress: null,
    privyClient: null,
    currentRoundId: 1,
    gameInterval: null,
    isSpinning: false
};

// ==========================================
// INISIALISASI DOM ELEMENTS
// ==========================================
// Fungsi ini sekarang akan menyimpan elemen langsung ke dalam object window.app
function initializeDOMElements() {
    window.app.connectWalletBtn = document.getElementById('connect-wallet');
    window.app.disconnectWalletBtn = document.getElementById('disconnect-wallet');
    window.app.walletInfo = document.getElementById('wallet-info');
    window.app.walletAddress = document.getElementById('wallet-address');
    window.app.networkIndicator = document.getElementById('network-indicator');
    window.app.betButton = document.getElementById('bet-button');
    window.app.betButtonText = document.getElementById('bet-button-text');
    window.app.betButtonLoader = document.getElementById('bet-button-loader');
    window.app.betInput = document.getElementById('bet-input');
    window.app.jackpotAmount = document.getElementById('jackpot-amount');
    window.app.roundNumber = document.getElementById('round-number');
    window.app.timer = document.getElementById('timer');
    window.app.playerEntries = document.getElementById('player-entries');
    window.app.playerCount = document.getElementById('player-count');
    window.app.lastWinnerInfo = document.getElementById('last-winner-info');
    window.app.transactionStatus = document.getElementById('transaction-status');
    window.app.playerCarousel = document.getElementById('player-carousel');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function setButtonLoading(loading) {
    window.app.betButton.disabled = loading;
    if (loading) {
        window.app.betButtonText.style.display = 'none';
        window.app.betButtonLoader.classList.remove('hidden');
    } else {
        window.app.betButtonText.style.display = 'block';
        window.app.betButtonLoader.classList.add('hidden');
    }
}

function showTransactionStatus(message, type) {
    window.app.transactionStatus.textContent = message;
    window.app.transactionStatus.className = `transaction-status status-${type}`;
    window.app.transactionStatus.style.display = 'block';

    if (type !== 'pending') {
        setTimeout(() => {
            window.app.transactionStatus.style.display = 'none';
        }, 5000);
    }
}

// Menambahkan fungsi-fungsi ke object window.app
window.app.initializeDOMElements = initializeDOMElements;
window.app.setButtonLoading = setButtonLoading;
window.app.showTransactionStatus = showTransactionStatus;
