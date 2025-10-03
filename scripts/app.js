// ==========================================
// KONFIGURASI APLIKASI
// ==========================================

// 🔑 GANTI DENGAN PRIVY APP ID ANDA
const PRIVY_APP_ID = 'clpispdty00ycl80fpueukbhl'; // ⚠️ Ganti dengan App ID Anda!

// Konfigurasi Contract
const CONTRACT_ADDRESS = "0xB4BA0d964CB4Ef4c2CEC675299e1058102435b1b";
const CONTRACT_ABI = [
    "function placeBet(uint256 _roundId) external payable",
    "function endRound(uint256 _roundId) external",
    "function currentRoundId() external view returns (uint256)",
    "function getRoundInfo(uint256 _roundId) external view returns (uint256 totalPrize, uint256 playerCount, uint256 timeLeft, bool ended, address winner)",
    "function getPlayerBet(uint256 _roundId, address _player) external view returns (uint256)",
    "function getRoundPlayers(uint256 _roundId) external view returns (address[] memory)",
    "function totalJackpot() external view returns (uint256)",
    "event BetPlaced(address indexed player, uint256 roundId, uint256 amount)",
    "event RoundEnded(uint256 roundId, address winner, uint256 amount)"
];

// Konfigurasi Game
const PROFILE_IMAGE_URL = 'https://i.ibb.co/VMy4P36/P-icon-by-vexel.png';
const TOTAL_SLOTS = 20;

// Global Variables
let provider, signer, contract, userAddress, privyClient;
let currentRoundId = 1;
let gameInterval;
let isSpinning = false;

// DOM Elements
let connectWalletBtn, disconnectWalletBtn, walletInfo, walletAddress, networkIndicator;
let betButton, betButtonText, betButtonLoader, betInput, jackpotAmount;
let roundNumber, timer, playerEntries, playerCount, lastWinnerInfo;
let transactionStatus, playerCarousel;

// ==========================================
// INISIALISASI DOM ELEMENTS
// ==========================================
function initializeDOMElements() {
    connectWalletBtn = document.getElementById('connect-wallet');
    disconnectWalletBtn = document.getElementById('disconnect-wallet');
    walletInfo = document.getElementById('wallet-info');
    walletAddress = document.getElementById('wallet-address');
    networkIndicator = document.getElementById('network-indicator');
    betButton = document.getElementById('bet-button');
    betButtonText = document.getElementById('bet-button-text');
    betButtonLoader = document.getElementById('bet-button-loader');
    betInput = document.getElementById('bet-input');
    jackpotAmount = document.getElementById('jackpot-amount');
    roundNumber = document.getElementById('round-number');
    timer = document.getElementById('timer');
    playerEntries = document.getElementById('player-entries');
    playerCount = document.getElementById('player-count');
    lastWinnerInfo = document.getElementById('last-winner-info');
    transactionStatus = document.getElementById('transaction-status');
    playerCarousel = document.getElementById('player-carousel');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function setButtonLoading(loading) {
    betButton.disabled = loading;
    if (loading) {
        betButtonText.style.display = 'none';
        betButtonLoader.classList.remove('hidden');
    } else {
        betButtonText.style.display = 'block';
        betButtonLoader.classList.add('hidden');
    }
}

function showTransactionStatus(message, type) {
    transactionStatus.textContent = message;
    transactionStatus.className = `transaction-status status-${type}`;
    transactionStatus.style.display = 'block';
    
    if (type !== 'pending') {
        setTimeout(() => {
            transactionStatus.style.display = 'none';
        }, 5000);
    }
}

// Export global variables untuk digunakan di file lain
window.app = {
    PRIVY_APP_ID,
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    PROFILE_IMAGE_URL,
    TOTAL_SLOTS,
    provider, signer, contract, userAddress, privyClient,
    currentRoundId, gameInterval, isSpinning,
    connectWalletBtn, disconnectWalletBtn, walletInfo, walletAddress, networkIndicator,
    betButton, betButtonText, betButtonLoader, betInput, jackpotAmount,
    roundNumber, timer, playerEntries, playerCount, lastWinnerInfo,
    transactionStatus, playerCarousel,
    initializeDOMElements,
    setButtonLoading,
    showTransactionStatus
};
