// ==========================================
// FUNGSI WALLET CONNECTION DENGAN PRIVY
// ==========================================

async function initializePrivy() {
    try {
        console.log('Checking Privy availability...');
        
        // Tunggu hingga Privy SDK siap
        if (!window.privy) {
            console.log('Privy not loaded yet, waiting...');
            setTimeout(initializePrivy, 1000);
            return;
        }

        console.log('Privy SDK found, initializing...');
        
        // Initialize Privy client dengan konfigurasi khusus
        window.app.privyClient = window.privy.initializePrivy({
            appId: window.app.PRIVY_APP_ID,
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
        const isAuthenticated = await window.app.privyClient.isAuthenticated();
        if (isAuthenticated) {
            console.log('User already authenticated');
            const user = await window.app.privyClient.getUser();
            if (user.wallet) {
                await handleWalletConnected(user.wallet.address);
            }
        } else {
            console.log('User not authenticated');
        }

    } catch (error) {
        console.error('Failed to initialize Privy:', error);
        window.app.showTransactionStatus('Failed to initialize wallet connection: ' + error.message, 'error');
        
        // Coba lagi setelah 3 detik
        setTimeout(initializePrivy, 3000);
    }
}

async function connectWallet() {
    if (!window.app.privyClient) {
        window.app.showTransactionStatus('Wallet connection not ready. Please wait...', 'error');
        return;
    }

    try {
        window.app.showTransactionStatus('Opening Privy login...', 'pending');
        
        // Login dengan Privy [citation:4]
        await window.app.privyClient.login();
        
        // Setelah login, dapatkan data user
        const user = await window.app.privyClient.getUser();
        if (user.wallet) {
            await handleWalletConnected(user.wallet.address);
        } else {
            window.app.showTransactionStatus('No wallet found after login', 'error');
        }
        
    } catch (error) {
        console.error('Wallet connection failed:', error);
        window.app.showTransactionStatus('Connection failed: ' + error.message, 'error');
    }
}

async function handleWalletConnected(address) {
    console.log('Wallet connected:', address);
    
    window.app.userAddress = address;
    
    try {
        // Dapatkan provider dari Privy
        const privyProvider = await window.app.privyClient.getEthereumProvider();
        window.app.provider = new ethers.providers.Web3Provider(privyProvider);
        window.app.signer = window.app.provider.getSigner();
        window.app.contract = new ethers.Contract(window.app.CONTRACT_ADDRESS, window.app.CONTRACT_ABI, window.app.signer);

        // Update UI
        window.app.connectWalletBtn.style.display = 'none';
        window.app.walletInfo.style.display = 'flex';
        window.app.walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        await checkNetwork();
        window.app.showTransactionStatus('Wallet connected successfully! 🎉', 'success');
        
        // Start loading game data
        await window.game.loadGameData();
        window.game.startGameLoop();
        
    } catch (error) {
        console.error('Error setting up wallet connection:', error);
        window.app.showTransactionStatus('Error setting up connection: ' + error.message, 'error');
    }
}

async function checkNetwork() {
    try {
        if (window.app.provider) {
            const network = await window.app.provider.getNetwork();
            console.log('Current network:', network);
            
            if (network.chainId === 84532) { // Base Sepolia
                window.app.networkIndicator.textContent = 'Base Sepolia';
                window.app.networkIndicator.className = 'network-indicator network-base';
            } else {
                window.app.networkIndicator.textContent = 'Wrong Network';
                window.app.networkIndicator.className = 'network-indicator network-wrong';
                window.app.showTransactionStatus('Please switch to Base Sepolia in your wallet', 'error');
            }
        }
    } catch (error) {
        console.error('Error checking network:', error);
    }
}

async function disconnectWallet() {
    console.log('Disconnecting wallet');
    
    // Logout dari Privy
    if (window.app.privyClient) {
        await window.app.privyClient.logout();
    }
    
    window.app.userAddress = null;
    window.app.contract = null;
    window.app.provider = null;
    window.app.signer = null;
    
    // Reset UI
    window.app.connectWalletBtn.style.display = 'block';
    window.app.walletInfo.style.display = 'none';
    window.app.walletAddress.textContent = '';
    
    // Stop game loop
    if (window.app.gameInterval) {
        clearInterval(window.app.gameInterval);
    }
    
    window.app.showTransactionStatus('Wallet disconnected', 'success');
}

// Export functions untuk digunakan di file lain
window.wallet = {
    initializePrivy,
    connectWallet,
    disconnectWallet,
    checkNetwork,
    handleWalletConnected
};
