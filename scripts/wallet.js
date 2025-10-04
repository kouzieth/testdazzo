// ==========================================
// FUNGSI WALLET CONNECTION DENGAN PRIVY
// ==========================================

async function initializePrivy() {
    try {
        console.log('Checking Privy availability...');
        
        if (!window.privy) {
            console.log('Privy not loaded yet, waiting...');
            setTimeout(initializePrivy, 1000);
            return;
        }

        console.log('Privy SDK found, initializing...');
        
        // [PERUBAHAN] Update konfigurasi untuk Farcaster
        window.app.privyClient = window.privy.initializePrivy({
            appId: window.app.PRIVY_APP_ID,
            config: {
                loginMethods: ['farcaster', 'wallet'],
                farcaster: {
                    createSigner: true,
                },
                appearance: {
                    theme: 'dark',
                    accentColor: '#764fff',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets'
                }
            }
        });

        console.log('Privy initialized successfully');
        
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
    }
}

async function connectWallet() {
    if (!window.app.privyClient) {
        window.app.showTransactionStatus('Wallet connection not ready. Please wait...', 'error');
        return;
    }

    try {
        await window.app.privyClient.login();
        
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

// [PERUBAHAN BESAR] Fungsi ini diubah untuk menampilkan data Farcaster
async function handleWalletConnected(address) {
    console.log('Wallet connected:', address);
    
    window.app.userAddress = address;
    
    try {
        const privyProvider = await window.app.privyClient.getEthereumProvider();
        window.app.provider = new ethers.providers.Web3Provider(privyProvider);
        window.app.signer = window.app.provider.getSigner();
        window.app.contract = new ethers.Contract(window.app.CONTRACT_ADDRESS, window.app.CONTRACT_ABI, window.app.signer);

        // Dapatkan data pengguna lengkap dari Privy
        const user = await window.app.privyClient.getUser();
        window.app.user = user; // Simpan data user secara global untuk digunakan nanti

        const userPfpEl = document.getElementById('user-pfp');
        const walletAddressEl = document.getElementById('wallet-address');

        // Cek apakah pengguna punya akun Farcaster yang terhubung
        if (user.farcaster) {
            userPfpEl.src = user.farcaster.pfp;
            userPfpEl.style.display = 'block';
            walletAddressEl.textContent = user.farcaster.username;
        } else {
            // Jika tidak, tampilkan alamat wallet
            userPfpEl.style.display = 'none';
            walletAddressEl.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }

        // Update UI
        window.app.connectWalletBtn.style.display = 'none';
        window.app.walletInfo.style.display = 'flex';
        
        await checkNetwork();
        window.app.showTransactionStatus('Wallet connected successfully! 🎉', 'success');
        
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
    if (window.app.privyClient) {
        await window.app.privyClient.logout();
    }
    
    window.app.userAddress = null;
    window.app.user = null; // Hapus data user
    window.app.contract = null;
    window.app.provider = null;
    window.app.signer = null;
    
    window.app.connectWalletBtn.style.display = 'block';
    window.app.walletInfo.style.display = 'none';
    
    if (window.app.gameInterval) {
        clearInterval(window.app.gameInterval);
    }
    
    window.app.showTransactionStatus('Wallet disconnected', 'success');
}

window.wallet = {
    initializePrivy,
    connectWallet,
    disconnectWallet,
    checkNetwork,
    handleWalletConnected
};
