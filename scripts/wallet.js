import { 
    PRIVY_APP_ID, 
    initializeDOMElements, 
    showTransactionStatus,
    provider, signer, contract, userAddress, privyClient,
    connectWalletBtn, disconnectWalletBtn, walletInfo, walletAddress, networkIndicator
} from './app.js';

import { startGameLoop, loadGameData } from './game.js';

// ==========================================
// INISIALISASI PRIVY
// ==========================================
export async function initializePrivy() {
    try {
        console.log('Checking Privy availability...');
        
        // Tunggu hingga Privy SDK siap
        if (!window.privy) {
            console.log('Privy not loaded yet, waiting...');
            setTimeout(initializePrivy, 1000);
            return;
        }

        console.log('Privy SDK found, initializing...');
        
        // Initialize Privy client [citation:4]
        privyClient = window.privy.initializePrivy({
            appId: PRIVY_APP_ID,
            config: {
                // ✅ HANYA 2 METODE LOGIN: External Wallet + Farcaster
                loginMethods: ['farcaster', 'wallet'],
                
                // ✅ KONFIGURASI WALLET
                externalWallets: {
                    showAllWallets: true,
                },
                
                appearance: {
                    theme: 'dark',
                    accentColor: '#764fff'
                },
                
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets'
                }
            }
        });

        console.log('Privy initialized successfully');
        
        // Check jika user sudah login
        const isAuthenticated = await privyClient.isAuthenticated();
        if (isAuthenticated) {
            console.log('User already authenticated');
            const user = await privyClient.getUser();
            if (user.wallet) {
                await handleWalletConnected(user.wallet.address);
            }
        } else {
            console.log('User not authenticated');
        }

    } catch (error) {
        console.error('Failed to initialize Privy:', error);
        showTransactionStatus('Failed to initialize wallet connection: ' + error.message, 'error');
        
        // Coba lagi setelah 3 detik
        setTimeout(initializePrivy, 3000);
    }
}

// ==========================================
// FUNGSI WALLET CONNECTION
// ==========================================
export async function connectWallet() {
    if (!privyClient) {
        showTransactionStatus('Wallet connection not ready. Please wait...', 'error');
        return;
    }

    try {
        showTransactionStatus('Opening Privy login...', 'pending');
        
        // Login dengan Privy [citation:3]
        await privyClient.login();
        
        // Setelah login, dapatkan data user
        const user = await privyClient.getUser();
        if (user.wallet) {
            await handleWalletConnected(user.wallet.address);
        } else {
            showTransactionStatus('No wallet found after login', 'error');
        }
        
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showTransactionStatus('Connection failed: ' + error.message, 'error');
    }
}

export async function handleWalletConnected(address) {
    console.log('Wallet connected:', address);
    
    userAddress = address;
    
    try {
        // Dapatkan provider dari Privy [citation:3]
        const privyProvider = await privyClient.getEthereumProvider();
        provider = new ethers.providers.Web3Provider(privyProvider);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Update UI
        connectWalletBtn.style.display = 'none';
        walletInfo.style.display = 'flex';
        walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        await checkNetwork();
        showTransactionStatus('Wallet connected successfully! 🎉', 'success');
        
        // Start loading game data
        await loadGameData();
        startGameLoop();
        
    } catch (error) {
        console.error('Error setting up wallet connection:', error);
        showTransactionStatus('Error setting up connection: ' + error.message, 'error');
    }
}

export async function checkNetwork() {
    try {
        if (provider) {
            const network = await provider.getNetwork();
            console.log('Current network:', network);
            
            if (network.chainId === 84532) { // Base Sepolia
                networkIndicator.textContent = 'Base Sepolia';
                networkIndicator.className = 'network-indicator network-base';
            } else {
                networkIndicator.textContent = 'Wrong Network';
                networkIndicator.className = 'network-indicator network-wrong';
                showTransactionStatus('Please switch to Base Sepolia in your wallet', 'error');
            }
        }
    } catch (error) {
        console.error('Error checking network:', error);
    }
}

export async function disconnectWallet() {
    console.log('Disconnecting wallet');
    
    // Logout dari Privy [citation:3]
    if (privyClient) {
        await privyClient.logout();
    }
    
    userAddress = null;
    contract = null;
    provider = null;
    signer = null;
    
    // Reset UI
    connectWalletBtn.style.display = 'block';
    walletInfo.style.display = 'none';
    walletAddress.textContent = '';
    
    // Stop game loop
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    showTransactionStatus('Wallet disconnected', 'success');
}

// ==========================================
// EVENT LISTENERS
// ==========================================
export function initializeWalletEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
}
