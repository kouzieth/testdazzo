import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    PROFILE_IMAGE_URL,
    TOTAL_SLOTS,
    provider, signer, contract, userAddress,
    currentRoundId, gameInterval, isSpinning,
    betButton, betInput, jackpotAmount, roundNumber, timer,
    playerEntries, playerCount, lastWinnerInfo, playerCarousel,
    setButtonLoading, showTransactionStatus,
    initializeDOMElements
} from './app.js';

// ==========================================
// EVENT LISTENERS FOR GAME
// ==========================================
export function initializeGameEventListeners() {
    betButton.addEventListener('click', placeBet);
}

// ==========================================
// CAROUSEL FUNCTIONS
// ==========================================
export function setupInitialCarousel() {
    const singlePass = Array.from({ length: TOTAL_SLOTS }, (_, i) => 
        `<div class="player-slot waiting" data-slot-id="${i}">
            <img src="${PROFILE_IMAGE_URL}" alt="waiting">
            <div class="name">Waiting...</div>
            <div class="details">0.0000 ETH</div>
        </div>`
    ).join('');
    
    playerCarousel.innerHTML = singlePass + singlePass;
    playerCarousel.classList.add('idle-slide');
}

export async function updateCarouselWithPlayers() {
    if (!contract) return;

    try {
        const players = await contract.getRoundPlayers(currentRoundId);
        const playerBets = await Promise.all(
            players.map(async (player) => {
                const bet = await contract.getPlayerBet(currentRoundId, player);
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

export function updateCarousel(players) {
    // Clear all slots first
    const allSlots = playerCarousel.querySelectorAll('.player-slot');
    allSlots.forEach(slot => {
        slot.className = 'player-slot waiting';
        slot.innerHTML = `
            <img src="${PROFILE_IMAGE_URL}" alt="waiting">
            <div class="name">Waiting...</div>
            <div class="details">0.0000 ETH</div>
        `;
    });

    // Fill with actual players
    players.forEach((player, index) => {
        const slotIndex = index % TOTAL_SLOTS;
        const slots = document.querySelectorAll(`.player-slot[data-slot-id="${slotIndex}"]`);
        
        slots.forEach(slot => {
            slot.classList.remove('waiting');
            slot.innerHTML = `
                <img src="${PROFILE_IMAGE_URL}" alt="${player.address}">
                <div class="name">${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}</div>
                <div class="details">${player.bet} ETH</div>
            `;
        });
    });

    // Add idle animation if not spinning
    if (!isSpinning) {
        playerCarousel.classList.add('idle-slide');
    }
}

export async function spinToWinner(winnerAddress) {
    if (!contract) return;
    
    isSpinning = true;
    playerCarousel.classList.remove('idle-slide');
    
    try {
        const players = await contract.getRoundPlayers(currentRoundId);
        const playerBets = await Promise.all(
            players.map(async (player) => {
                const bet = await contract.getPlayerBet(currentRoundId, player);
                return {
                    address: player,
                    bet: ethers.utils.formatEther(bet)
                };
            })
        );

        // Create multiple copies for smooth spinning
        const spinningPlayers = [];
        for (let i = 0; i < 5; i++) {
            spinningPlayers.push(...playerBets);
        }

        // Find winner index
        const winnerIndex = playerBets.findIndex(p => p.address.toLowerCase() === winnerAddress.toLowerCase());
        const targetPosition = (4 * playerBets.length) + winnerIndex;

        // Calculate target translateX
        const slotWidth = 100 + 16; // width + margin
        const targetTranslateX = -(targetPosition * slotWidth) + (playerCarousel.parentElement.offsetWidth / 2) - (slotWidth / 2);

        // Add some random offset for excitement
        const randomOffset = (Math.random() - 0.5) * (slotWidth * 0.3);
        const finalTranslateX = targetTranslateX + randomOffset;

        // Apply spinning animation
        playerCarousel.style.transition = 'transform 4s cubic-bezier(0.2, 0.9, 0.3, 1)';
        playerCarousel.style.transform = `translateX(${finalTranslateX}px)`;

        // Highlight winner after spin
        setTimeout(() => {
            const allSlots = playerCarousel.querySelectorAll('.player-slot');
            allSlots.forEach((slot, index) => {
                if (index % playerBets.length === winnerIndex) {
                    slot.classList.add('winner', 'winner-glow');
                }
            });
            
            showTransactionStatus(`🎉 Winner: ${winnerAddress.substring(0, 6)}...${winnerAddress.substring(winnerAddress.length - 4)} won the jackpot!`, 'success');
            
            // Reset after celebration
            setTimeout(() => {
                isSpinning = false;
                playerCarousel.classList.add('idle-slide');
            }, 3000);
            
        }, 4200);

    } catch (error) {
        console.error('Error during spin animation:', error);
        isSpinning = false;
    }
}

// ==========================================
// GAME LOGIC FUNCTIONS
// ==========================================
export async function loadGameData() {
    if (!contract) {
        console.log('No contract available');
        return;
    }

    try {
        console.log('Loading game data...');
        
        // Get current round
        currentRoundId = await contract.currentRoundId();
        console.log('Current round:', currentRoundId.toString());
        roundNumber.textContent = currentRoundId.toString();

        // Get round info
        const roundInfo = await contract.getRoundInfo(currentRoundId);
        console.log('Round info:', roundInfo);
        
        // Update UI with round info
        updateGameUI(roundInfo);

        // Get total jackpot
        const totalJackpotValue = await contract.totalJackpot();
        const jackpotInEth = ethers.utils.formatEther(totalJackpotValue);
        jackpotAmount.textContent = `${parseFloat(jackpotInEth).toFixed(4)} ETH`;

        // Update carousel with current players
        await updateCarouselWithPlayers();

    } catch (error) {
        console.error('Error loading game data:', error);
        if (error.message.includes('contract')) {
            showTransactionStatus('Contract not found. Please check contract address.', 'error');
        }
    }
}

export function updateGameUI(roundInfo) {
    // Update timer
    const timeLeft = parseInt(roundInfo.timeLeft.toString());
    console.log('Time left:', timeLeft);
    updateTimerDisplay(timeLeft);

    // Update player count
    playerCount.textContent = roundInfo.playerCount.toString();

    // Update player list if there are players
    if (roundInfo.playerCount > 0) {
        updatePlayerList();
    } else {
        playerEntries.innerHTML = `
            <div style="text-align: center; color: var(--muted-text-color); padding: 2rem;">
                No players yet. Be the first to bet!
            </div>
        `;
    }

    // Check if round just ended and we have a winner
    if (roundInfo.ended && roundInfo.winner !== ethers.constants.AddressZero && !isSpinning) {
        spinToWinner(roundInfo.winner);
        
        lastWinnerInfo.innerHTML = `
            <div style="color: var(--win-color); font-weight: bold; font-size: 1.1rem;">
                ${roundInfo.winner.substring(0, 6)}...${roundInfo.winner.substring(roundInfo.winner.length - 4)}
            </div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                Won ${ethers.utils.formatEther(roundInfo.totalPrize)} ETH
            </div>
        `;
        lastWinnerInfo.classList.add('pulse');
    } else if (roundInfo.winner !== ethers.constants.AddressZero) {
        lastWinnerInfo.innerHTML = `
            <div style="color: var(--win-color); font-weight: bold; font-size: 1.1rem;">
                ${roundInfo.winner.substring(0, 6)}...${roundInfo.winner.substring(roundInfo.winner.length - 4)}
            </div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                Won ${ethers.utils.formatEther(roundInfo.totalPrize)} ETH
            </div>
        `;
    }
}

export async function updatePlayerList() {
    if (!contract) return;

    try {
        const players = await contract.getRoundPlayers(currentRoundId);
        console.log('Players:', players);
        
        let playersHTML = '';

        for (const player of players) {
            const betAmount = await contract.getPlayerBet(currentRoundId, player);
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

        playerEntries.innerHTML = playersHTML;
    } catch (error) {
        console.error('Error updating player list:', error);
    }
}

export function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    if (seconds < 10) {
        timer.style.color = 'var(--error-color)';
    } else if (seconds < 30) {
        timer.style.color = 'var(--highlight-color)';
    } else {
        timer.style.color = 'var(--win-color)';
    }
}

export async function placeBet() {
    if (!userAddress) {
        showTransactionStatus('Please connect your wallet first!', 'error');
        return;
    }

    if (!contract) {
        showTransactionStatus('Contract not configured.', 'error');
        return;
    }

    const betValue = parseFloat(betInput.value);
    if (isNaN(betValue) || betValue < 0.0001) {
        showTransactionStatus('Minimum bet is 0.0001 ETH', 'error');
        return;
    }

    try {
        showTransactionStatus('Processing your bet...', 'pending');
        setButtonLoading(true);

        const betAmount = ethers.utils.parseEther(betValue.toString());
        console.log('Placing bet:', betValue, 'ETH');
        
        const tx = await contract.placeBet(currentRoundId, { value: betAmount });
        showTransactionStatus('Transaction submitted. Waiting for confirmation...', 'pending');
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        showTransactionStatus('Bet placed successfully! 🎉 Good luck!', 'success');
        
        // Reload game data to reflect changes
        await loadGameData();
        betInput.value = '';
        
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
        
        showTransactionStatus(errorMessage, 'error');
    } finally {
        setButtonLoading(false);
    }
}

export function startGameLoop() {
    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Update game data every 10 seconds
    gameInterval = setInterval(async () => {
        if (contract && userAddress) {
            console.log('Auto-updating game data...');
            await loadGameData();
        }
    }, 10000);
}

// ==========================================
// INITIALIZE GAME
// ==========================================
export function initializeGame() {
    setupInitialCarousel();
    initializeGameEventListeners();
          }
