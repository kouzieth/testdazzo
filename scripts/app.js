// ==========================================
// KONFIGURASI APLIKASI
// ==========================================

// 🔑 GANTI DENGAN PRIVY APP ID ANDA
export const PRIVY_APP_ID = 'cmgb2kkqc000kkv0d96pfrstl';

// Konfigurasi Contract
export const CONTRACT_ADDRESS = "0xB4BA0d964CB4Ef4c2CEC675299e1058102435b1b";
export const CONTRACT_ABI = [
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
export const PROFILE_IMAGE_URL = 'https://i.ibb.co/VMy4P36/P-icon-by-vexel.png';
export const TOTAL_SLOTS = 20;

// Global Variables
export let provider, signer, contract, userAddress, privyClient;
export let currentRoundId = 1;
export let gameInterval;
export let isSpinning = false;

// DOM Elements
export let connectWalletBtn, disconnectWalletBtn, walletInfo, walletAddress, networkIndicator;
export let betButton, betButtonText, betButtonLoader, betInput, jackpotAmount;
export let roundNumber, timer, playerEntries, playerCount, lastWinnerInfo;
export let transactionStatus, playerCarousel;

// ==========================================
// INISIALISASI DOM ELEMENTS
// ==========================================
export function initializeDOMElements() {
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
export function setButtonLoading(loading) {
    betButton.disabled = loading;
    if (loading) {
        betButtonText.style.display = 'none';
        betButtonLoader.classList.remove('hidden');
    } else {
        betButtonText.style.display = 'block';
        betButtonLoader.classList.add('hidden');
    }
}

export function showTransactionStatus(message, type) {
    transactionStatus.textContent = message;
    transactionStatus.className = `transaction-status status-${type}`;
    transactionStatus.style.display = 'block';
    
    if (type !== 'pending') {
        setTimeout(() => {
            transactionStatus.style.display = 'none';
        }, 5000);
    }
}

export function addBet(amount) {
    const current = parseFloat(betInput.value) || 0;
    betInput.value = (current + amount).toFixed(4);
}
