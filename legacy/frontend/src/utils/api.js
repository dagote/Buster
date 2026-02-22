/**
 * API Integration with Bitcino Backend Server
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Place a new bet
 * @param {string} playerAddress - Wallet address
 * @param {number} amount - Bet amount
 * @returns {object} Bet details {betId, player1, amount, status, txHash}
 */
export async function placeBet(playerAddress, amount) {
  try {
    const response = await fetch(`${API_URL}/api/bet/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        player_address: playerAddress
      })
    });
    
    if (!response.ok) {
      let errorMsg = 'Failed to place bet';
      try {
        const error = await response.json();
        errorMsg = error.detail || error.message || errorMsg;
      } catch (e) {
        errorMsg = `Server error: ${response.status}`;
      }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log('Place bet response:', data);
    return data;
  } catch (err) {
    console.error('Place bet error:', err);
    throw new Error(`Bet placement failed: ${err.message}`);
  }
}

/**
 * Join an existing bet
 * @param {number} betId - Bet ID to join
 * @param {string} playerAddress - Wallet address
 * @param {number} amount - Bet amount (must match creator)
 * @returns {object} Updated bet details
 */
export async function joinBet(betId, playerAddress, amount) {
  try {
    const response = await fetch(`${API_URL}/api/bet/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_id: betId,
        amount,
        player_address: playerAddress
      })
    });
    
    if (!response.ok) {
      let errorMsg = 'Failed to join bet';
      try {
        const error = await response.json();
        errorMsg = error.detail || error.message || errorMsg;
      } catch (e) {
        errorMsg = `Server error: ${response.status}`;
      }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log('Join bet response:', data);
    return data;
  } catch (err) {
    console.error('Join bet error:', err);
    throw new Error(`Failed to join bet: ${err.message}`);
  }
}

/**
 * Play the game and settle with Drand randomness
 * (Best of 5 has already been determined on frontend)
 * @param {number} betId - Bet ID
 * @param {string} playerAddress - Player address
 * @returns {object} Settlement result with rolls and tx hash
 */
export async function playGame(betId, playerAddress) {
  try {
    const response = await fetch(`${API_URL}/api/game/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_id: betId,
        player_address: playerAddress
      })
    });
    
    if (!response.ok) {
      let errorMsg = 'Failed to play game';
      try {
        const error = await response.json();
        errorMsg = error.detail || error.message || errorMsg;
      } catch (e) {
        errorMsg = `Server error: ${response.status}`;
      }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log('Play game response:', data);
    return data;
  } catch (err) {
    console.error('Play game error:', err);
    throw new Error(`Game settlement failed: ${err.message}`);
  }
}

/**
 * Get bet details
 * @param {number} betId - Bet ID
 * @returns {object} Bet details
 */
export async function getBet(betId) {
  try {
    const response = await fetch(`${API_URL}/api/bet/${betId}`);
    
    if (!response.ok) {
      throw new Error('Bet not found');
    }
    
    const data = await response.json();
    console.log('Get bet response:', data);
    return data;
  } catch (err) {
    console.error('Get bet error:', err);
    throw new Error(`Failed to fetch bet: ${err.message}`);
  }
}

/**
 * Get player's balance
 * @param {string} playerAddress - Wallet address
 * @returns {object} Balance details
 */
export async function getBalance(playerAddress) {
  try {
    console.log(`[API] Fetching balance from ${API_URL}/api/player/${playerAddress}`);
    
    const response = await fetch(`${API_URL}/api/player/${playerAddress}`);
    
    console.log(`[API] Balance response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {
        // Response wasn't JSON
      }
      throw new Error(`Balance endpoint error: ${errorMsg}`);
    }
    
    const data = await response.json();
    console.log('[API] Get balance response:', data);
    return data;
  } catch (err) {
    console.error('[API] Get balance error:', err);
    throw err;
  }
}

/**
 * Claim winnings
 * @param {string} playerAddress - Wallet address
 * @param {number} amount - Amount to claim
 * @returns {object} Claim details {txHash, status}
 */
export async function claimWinnings(playerAddress, amount) {
  const response = await fetch(`${API_URL}/api/player/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_address: playerAddress,
      amount
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to claim winnings');
  }
  
  return response.json();
}
