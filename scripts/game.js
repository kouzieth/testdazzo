// ==========================================
// FUNGSI GAME LOGIC
// ==========================================

function setupInitialCarousel() {
    const singlePass = Array.from({ length: window.app.TOTAL_SLOTS }, (_, i) => 
        `<div class="player-slot waiting" data-slot-id="${i}">
            <img src="${window.app.PROFILE_IMAGE_URL}" alt="waiting">
            <div class="name">Waiting...</div>
            <div class="details">0.0000 ETH</div>
        </div>`
    ).join('');
    
    window.app.playerCarousel.innerHTML = singlePass + singlePass;
    window.app.playerCarousel.classList.add('idle-slide');
}

async function updateCarouselWithPlayers() {
    if (!window.app.contract) return;

    try {
        const players = await window.app.contract.getRoundPlayers(window.app.currentRoundId);
        const playerBets = await Promise.all(
            players.map(async (player) => {
                const bet = await window.app.contract.getPlayerBet(window.app.currentRoundId, player);
                return {
                    address: player,
                    bet: parseFloat(ethers.utils.formatEther(bet)).toFixed(4)
                };
            })
        );

        updateCarousel(playerBets);
    } catch (error) {
        console.error('Error updating carousel:', error);
    }
}

// [PERUBAHAN] Logika untuk menampilkan profil Farcaster di carousel
function updateCarousel(players) {
    const allSlots = window.app.playerCarousel.querySelectorAll('.player-slot');
    allSlots.forEach(slot => {
        slot.className = 'player-slot waiting';
        slot.innerHTML = `
            <img src="${window.app.PROFILE_IMAGE_URL}" alt="waiting">
            <div class="name">Waiting...</div>
            <div class="details">0.0000 ETH</div>
        `;
    });

    const loggedInUser = window.app.user;

    players.forEach((player, index) => {
        const slotIndex = index % window.app.TOTAL_SLOTS;
        const slots = document.querySelectorAll(`.player-slot[data-slot-id="${slotIndex}"]`);
        
        slots.forEach(slot => {
            slot.classList.remove('waiting');
            
            let displayName = `${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}`;
            let displayPfp = window.app.PROFILE_IMAGE_URL;

            // Cek apakah pemain ini adalah pengguna yang sedang login DAN punya profil Farcaster
            if (loggedInUser && loggedInUser.farcaster && loggedInUser.wallet.address.toLowerCase() === player.address.toLowerCase()) {
                displayName = loggedInUser.farcaster.username;
                displayPfp = loggedInUser.farcaster.pfp;
            }
            
            slot.innerHTML = `
                <img src="${displayPfp}" alt="${displayName}">
                <div class="name">${displayName}</div>
                <div class="details">${player.bet} ETH</div>
            `;
        });
    });

    if (!window.app.isSpinning) {
        window.app.playerCarousel.classList.add('idle-slide');
    }
}

async function loadGameData() {
    if (!window.app.contract) {
        console.log('No contract available');
        return;
    }

    try {
        window.app.currentRoundId = await window.app.contract.currentRoundId();
        window.app.roundNumber.textContent = window.app.currentRoundId.toString();

        const roundInfo = await window.app.contract.getRoundInfo(window.app.currentRoundId);
        
        updateGameUI(roundInfo);

        const totalJackpotValue = await window.app.contract.totalJackpot();
        const jackpotInEth = ethers.utils.formatEther(totalJackpotValue);
        window.app.jackpotAmount.textContent = `${parseFloat(jackpotInEth).toFixed(4)} ETH`;

        await updateCarouselWithPlayers();

    } catch (error) {
        console.error('Error loading game data:', error);
        if (error.message.includes('contract')) {
            window.app.showTransactionStatus('Contract not found. Please check contract address.', 'error');
        }
    }
}

function updateGameUI(roundInfo) {
    const timeLeft = parseInt(roundInfo.timeLeft.toString());
    updateTimerDisplay(timeLeft);
    window.app.playerCount.textContent = roundInfo.playerCount.toString();

    if (roundInfo.playerCount > 0) {
        updatePlayerList();
    } else {
        window.app.playerEntries.innerHTML = `<div style="text-align: center; color: var(--muted-text-color); padding: 2rem;">No players yet. Be the first to bet!</div>`;
    }

    if (roundInfo.ended && roundInfo.winner !== ethers.constants.AddressZero && !window.app.isSpinning) {
        spinToWinner(roundInfo.winner);
        
        window.app.lastWinnerInfo.innerHTML = `
            <div style="color: var(--win-color); font-weight: bold; font-size: 1.1rem;">
                ${roundInfo.winner.substring(0, 6)}...${roundInfo.winner.substring(roundInfo.winner.length - 4)}
            </div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                Won ${ethers.utils.formatEther(roundInfo.totalPrize)} ETH
            </div>
        `;
        window.app.lastWinnerInfo.classList.add('pulse');
    } else if (roundInfo.winner !== ethers.constants.AddressZero) {
        window.app.lastWinnerInfo.innerHTML = `
            <div style="color: var(--win-color); font-weight: bold; font-size: 1.1rem;">
                ${roundInfo.winner.substring(0, 6)}...${roundInfo.winner.substring(roundInfo.winner.length - 4)}
            </div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                Won ${ethers.utils.formatEther(roundInfo.totalPrize)} ETH
            </div>
        `;
    }
}

async function updatePlayerList() {
    if (!window.app.contract) return;

    try {
        const players = await window.app.contract.getRoundPlayers(window.app.currentRoundId);
        let playersHTML = '';

        for (const player of players) {
            const betAmount = await window.app.contract.getPlayerBet(window.app.currentRoundId, player);
            const betInEth = ethers.utils.formatEther(betAmount);
            
            playersHTML += `
                <div class="player-row">
                    <div class="player-address">
                        ${player.substring(0, 8)}...${player.substring(player.length - 6)}
                    </div>
                    <div class="player-bet">
                        ${parseFloat(betInEth).toFixed(4)} ETH
                    </div>
                </div>
            `;
        }

        window.app.playerEntries.innerHTML = playersHTML;
    } catch (error) {
        console.error('Error updating player list:', error);
    }
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    window.app.timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    if (seconds < 10) {
        window.app.timer.style.color = 'var(--error-color)';
    } else if (seconds < 30) {
        window.app.timer.style.color = 'var(--highlight-color)';
    } else {
        window.app.timer.style.color = 'var(--win-color)';
    }
}

async function placeBet() {
    if (!window.app.userAddress) {
        window.app.showTransactionStatus('Please connect your wallet first!', 'error');
        return;
    }
    if (!window.app.contract) {
        window.app.showTransactionStatus('Contract not configured.', 'error');
        return;
    }
    const betValue = parseFloat(window.app.betInput.value);
    if (isNaN(betValue) || betValue < 0.0001) {
        window.app.showTransactionStatus('Minimum bet is 0.0001 ETH', 'error');
        return;
    }
    try {
        window.app.showTransactionStatus('Processing your bet...', 'pending');
        window.app.setButtonLoading(true);

        const betAmount = ethers.utils.parseEther(betValue.toString());
        const tx = await window.app.contract.placeBet(window.app.currentRoundId, { value: betAmount });
        window.app.showTransactionStatus('Transaction submitted. Waiting for confirmation...', 'pending');
        
        await tx.wait();
        window.app.showTransactionStatus('Bet placed successfully! 🎉 Good luck!', 'success');
        
        await loadGameData();
        window.app.betInput.value = '';
        
    } catch (error) {
        console.error('Bet failed:', error);
        let errorMessage = 'Transaction failed';
        if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient ETH balance';
        } else if (error.message.includes('user rejected') || error.message.includes('denied')) {
            errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('Round ended')) {
            errorMessage = 'Round has ended. Please wait for next round';
        }
        window.app.showTransactionStatus(errorMessage, 'error');
    } finally {
        window.app.setButtonLoading(false);
    }
}

function addBet(amount) {
    const current = parseFloat(window.app.betInput.value) || 0;
    window.app.betInput.value = (current + amount).toFixed(4);
}

function startGameLoop() {
    if (window.app.gameInterval) {
        clearInterval(window.app.gameInterval);
    }
    window.app.gameInterval = setInterval(async () => {
        if (window.app.contract && window.app.userAddress) {
            await loadGameData();
        }
    }, 10000);
}

// Dummy spinToWinner function
async function spinToWinner(winnerAddress) {
    console.log("Spinning to winner", winnerAddress);
    // Implementation can be added later
}

window.game = {
    setupInitialCarousel,
    loadGameData,
    placeBet,
    addBet,
    startGameLoop,
    updateCarouselWithPlayers
};
