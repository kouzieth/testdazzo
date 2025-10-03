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

function updateCarousel(players) {
    // Clear all slots first
    const allSlots = window.app.playerCarousel.querySelectorAll('.player-slot');
    allSlots.forEach(slot => {
        slot.className = 'player-slot waiting';
        slot.innerHTML = `
            <img src="${window.app.PROFILE_IMAGE_URL}" alt="waiting">
            <div class="name">Waiting...</div>
            <div class="details">0.0000 ETH</div>
        `;
    });

    // Fill with actual players
    players.forEach((player, index) => {
        const slotIndex = index % window.app.TOTAL_SLOTS;
        const slots = document.querySelectorAll(`.player-slot[data-slot-id="${slotIndex}"]`);
        
        slots.forEach(slot => {
            slot.classList.remove('waiting');
            slot.innerHTML = `
                <img src="${window.app.PROFILE_IMAGE_URL}" alt="${player.address}">
                <div class="name">${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}</div>
                <div class="details">${player.bet} ETH</div>
            `;
        });
    });

    // Add idle animation if not spinning
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
        console.log('Loading game data...');
        
        // Get current round
        window.app.currentRoundId = await window.app.contract.currentRoundId();
        console.log('Current round:', window.app.currentRoundId.toString());
        window.app.roundNumber.textContent = window.app.currentRoundId.toString();

        // Get round info
        const roundInfo = await window.app.contract.getRoundInfo(window.app.currentRoundId);
        console.log('Round info:', roundInfo);
        
        // Update UI with round info
        updateGameUI(roundInfo);

        // Get total jackpot
        const totalJackpotValue = await window.app.contract.totalJackpot();
        const jackpotInEth = ethers.utils.formatEther(totalJackpotValue);
        window.app.jackpotAmount.textContent = `${parseFloat(jackpotInEth).toFixed(4)} ETH`;

        // Update carousel with current players
        await updateCarouselWithPlayers();

    } catch (error) {
        console.error('Error loading game data:', error);
        if (error.message.includes('contract')) {
            window.app.showTransactionStatus('Contract not found. Please check contract address.', 'error');
        }
    }
}

function updateGameUI(roundInfo) {
    // Update timer
    const timeLeft = parseInt(roundInfo.timeLeft.toString());
    console.log('Time left:', timeLeft);
    updateTimerDisplay(timeLeft);

    // Update player count
    window.app.playerCount.textContent = roundInfo.playerCount.toString();

    // Update player list if there are players
    if (roundInfo.playerCount > 0) {
        updatePlayerList();
    } else {
        window.app.playerEntries.innerHTML = `
            <div style="text-align: center; color: var(--muted-text-color); padding: 2rem;">
                No players yet. Be the first to bet!
            </div>
        `;
    }

    // Check if round just ended and we have a winner
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
        console.log('Players:', players);
        
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
        console.log('Placing bet:', betValue, 'ETH');
        
        const tx = await window.app.contract.placeBet(window.app.currentRoundId, { value: betAmount });
        window.app.showTransactionStatus('Transaction submitted. Waiting for confirmation...', 'pending');
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        window.app.showTransactionStatus('Bet placed successfully! 🎉 Good luck!', 'success');
        
        // Reload game data to reflect changes
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
        } else if (error.message.includes('Invalid round')) {
            errorMessage = 'Round has ended. Refreshing...';
            await loadGameData();
        } else if (error.message.includes('execution reverted')) {
            errorMessage = 'Contract error. Please check round status.';
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
    // Clear any existing interval
    if (window.app.gameInterval) {
        clearInterval(window.app.gameInterval);
    }
    
    // Update game data every 10 seconds
    window.app.gameInterval = setInterval(async () => {
        if (window.app.contract && window.app.userAddress) {
            console.log('Auto-updating game data...');
            await loadGameData();
        }
    }, 10000);
}

// Export functions untuk digunakan di file lain
window.game = {
    setupInitialCarousel,
    loadGameData,
    placeBet,
    addBet,
    startGameLoop,
    updateCarouselWithPlayers,
    spinToWinner: async (winnerAddress) => {
        // Implementation of spinToWinner function
        if (!window.app.contract) return;
        
        window.app.isSpinning = true;
        window.app.playerCarousel.classList.remove('idle-slide');
        
        try {
            const players = await window.app.contract.getRoundPlayers(window.app.currentRoundId);
            // ... rest of spinToWinner implementation
        } catch (error) {
            console.error('Error during spin animation:', error);
            window.app.isSpinning = false;
        }
    }
};
