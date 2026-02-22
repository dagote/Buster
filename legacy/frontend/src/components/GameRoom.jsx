import React, { useState, useEffect } from 'react';
import { useDrandFetch } from '../utils/hooks';
import { placeBet, joinBet, playGame, getBet, getBalance } from '../utils/api';
import { getDiceTotalFromDrand, getDrandVerificationLink } from '../utils/drandFormula';
import DiceGame from './DiceGame';
import ResultsBoard from './ResultsBoard';
import './GameRoom.css';

export default function GameRoom({ walletAddress }) {
  const drandHook = useDrandFetch();
  
  // Game state
  const [gameState, setGameState] = useState('setup'); // setup, waiting, playing, completed
  const [betId, setBetId] = useState(null);
  const [betAmount, setBetAmount] = useState(1); // Default 1 POL
  const [opponentAddress, setOpponentAddress] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); // creator or joiner
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(null);
  const [minBet, setMinBet] = useState(0.1);
  const [maxBet, setMaxBet] = useState(1000);
  const [displayCurrency, setDisplayCurrency] = useState('usd'); // 'usd' or 'pol'
  const [polPrice, setPolPrice] = useState(0.8); // Default fallback
  const [usdcPrice, setUsdcPrice] = useState(1.0);

  // Fetch user's balance on mount (with aggressive timeout)
  useEffect(() => {
    async function fetchBalance() {
      try {
        setBalanceLoading(true);
        setBalanceError(null);
        console.log('🔍 Fetching balance for walletAddress:', walletAddress);
        
        // Set a timeout of 3 seconds - if slower, use fallback
        // RPC calls to Polygon can be slow, so we bail out quickly
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC call slow - using fallback')), 3000)
        );
        
        const balancePromise = getBalance(walletAddress);
        const balanceData = await Promise.race([balancePromise, timeoutPromise]);
        
        console.log('✅ API Response:', balanceData);
        setBalance(balanceData);
      } catch (err) {
        console.warn('⚠️ Balance fetch failed:', err.message);
        console.log('Proceeding without balance check - validation will happen on-chain');
        // Set balance to fallback object with all fields
        setBalance({ 
          balance_wei: 0, 
          claimable_balance: 0, 
          wallet_balance: 0,
          wallet_balance_wei: 0,
          address: walletAddress 
        });
        setBalanceError('(Using blockchain for validation)');
      } finally {
        setBalanceLoading(false);
      }
    }
    
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  // Fetch POL and USDC prices every 5 seconds
  useEffect(() => {
    async function fetchPrices() {
      try {
        // Use backend proxy to avoid CORS issues
        const response = await fetch(
          'http://localhost:8000/api/prices'
        );
        const data = await response.json();
        if (data.pol_price) {
          setPolPrice(data.pol_price);
        }
        if (data.usdc_price) {
          setUsdcPrice(data.usdc_price);
        }
      } catch (err) {
        console.warn('Failed to fetch prices:', err);
        // Use realistic fallback prices for 2026
        setPolPrice(0.25); // More realistic POL price
        setUsdcPrice(1.0);
      }
    }

    fetchPrices(); // Fetch immediately
    const interval = setInterval(fetchPrices, 30000); // Then every 30 seconds (server cache updates every 30s)
    return () => clearInterval(interval);
  }, []);

  // Helper: Get balance in POL
  function getBalanceInPol() {
    if (!balance) return 0;
    // Use the new wallet_balance field from the updated API
    return balance.wallet_balance || 0;
  }

  // Helper: Check if user has sufficient balance
  function hasSufficientBalance() {
    const balanceInPol = getBalanceInPol();
    return balanceInPol >= betAmount;
  }

  // Helper: Convert MATIC amount to display amount (MATIC or USD)
  function convertToDisplayAmount(polAmount) {
    if (displayCurrency === 'usd') {
      console.log('POL price:', polPrice);
      console.log('POL amount:', polAmount);
      console.log('USD result:', polAmount * polPrice);
      return polAmount * polPrice;
    }
    return polAmount;
  }

  // Helper: Get display unit
  function getDisplayUnit() {
    return displayCurrency === 'usd' ? 'USD' : 'POL';
  }

  // Helper: Format display amount
  function formatDisplayAmount(amount) {
    if (displayCurrency === 'usd') {
      return amount.toFixed(2);
    }
    return amount.toFixed(4);
  }

  // Helper: Cycle through currencies
  function cycleCurrency() {
    setDisplayCurrency(displayCurrency === 'usd' ? 'pol' : 'usd');
  }

  // Helper: Get currency layout display text
  function getCurrencyLayout() {
    return displayCurrency === 'usd' ? 'USD / POL' : 'POL / USD';
  }

  // Helper: Set bet to minimum
  function setBetToMin() {
    setBetAmount(minBet);
  }

  // Helper: Set bet to maximum
  function setBetToMax() {
    setBetAmount(maxBet);
  }

  // Generate shareable game link
  function getGameLink() {
    const gameId = betId || 'new';
    return `${window.location.origin}/?game=${gameId}&bet=${betAmount}`;
  }

  // Create a new bet
  async function createBet() {
    try {
      setLoading(true);
      setError(null);
      
      // Validate bet amount
      if (betAmount <= 0) {
        throw new Error('Bet amount must be greater than 0');
      }

      // Check balance
      if (!hasSufficientBalance()) {
        const availableInMatic = getBalanceInMatic().toFixed(4);
        throw new Error(
          `Insufficient funds. You have ${availableInMatic} MATIC available, but need ${betAmount.toFixed(4)} MATIC.`
        );
      }
      
      const bet = await placeBet(walletAddress, betAmount);
      const betId = bet.bet_id || bet.betId;
      if (!betId) {
        throw new Error('No bet ID returned from server');
      }
      setBetId(betId);
      setPlayerRole('creator');
      setGameState('waiting');
    } catch (err) {
      setError(err.message);
      console.error('Create bet error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Join an existing bet
  async function joinExistingBet(id) {
    try {
      setLoading(true);
      setError(null);
      
      const existingBet = await getBet(id);
      setBetAmount(existingBet.amount);
      
      const bet = await joinBet(id, walletAddress, existingBet.amount);
      setBetId(bet.bet_id);
      setOpponentAddress(bet.player1);
      setPlayerRole('joiner');
      setGameState('playing');
      startNewRound();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Start a new round
  function startNewRound() {
    setCurrentRound((c) => c + 1);
    setGameState('playing');
  }

  // Handle a dice roll result
  function handleRollComplete(playerNumber, diceTotal, drandData) {
    const newRound = {
      roundNumber: currentRound,
      drandRound: drandData.round,
      drandValue: drandData.randomness,
      playerRolls: {
        [playerNumber]: diceTotal
      }
    };

    const currentRoundData = rounds.find(r => r.roundNumber === currentRound);
    
    if (currentRoundData) {
      // Both players have rolled
      currentRoundData.playerRolls[playerNumber] = diceTotal;
      
      const p1Total = currentRoundData.playerRolls[1];
      const p2Total = currentRoundData.playerRolls[2];
      const roundWinner = p1Total > p2Total ? 1 : p2Total > p1Total ? 2 : null;

      if (roundWinner) {
        const newScore = { ...score };
        newScore[`player${roundWinner}`]++;
        setScore(newScore);

        // Check if we have a best of 3 winner (first to 2 wins)
        if (newScore.player1 >= 2 || newScore.player2 >= 2) {
          const matchWinner = newScore.player1 >= 2 ? 1 : 2;
          completeGame(matchWinner, currentRoundData);
        } else if (currentRound < 5) {
          // Continue to next round
          setTimeout(() => startNewRound(), 2000);
        }
      }
    } else {
      setRounds([...rounds, newRound]);
    }
  }

  // Complete the game and settle on-chain
  async function completeGame(matchWinner, lastRound) {
    try {
      setGameState('completed');
      
      // Call contract to settle with Drand data
      const result = await playGame(betId, walletAddress);
      
      setGameResult({
        matchWinner,
        contractWinner: result.winner,
        txHash: result.tx_hash,
        drandRound: result.drand_round,
        drandValue: result.drand_value,
        rolls: {
          player1: result.player1_roll,
          player2: result.player2_roll
        }
      });
    } catch (err) {
      setError(err.message);
    }
  }

  // Setup screen - simplified betting interface
  if (gameState === 'setup') {
    const balanceInPol = getBalanceInPol();
    const insufficientFunds = balance && balanceInPol < betAmount;
    const betTooLow = betAmount < minBet;
    const betTooHigh = betAmount > maxBet;
    const isValidBet = !insufficientFunds && !betTooLow && !betTooHigh && betAmount > 0;

    return (
      <div className="game-room setup">
        <div className="setup-card">
          {/* Currency Cycle Button */}
          <button className="currency-toggle" onClick={cycleCurrency}>
            💱 {getCurrencyLayout()}
          </button>

          {/* Available Balance */}
          <div className="balance-section">
            <div className="balance-label">Available Balance</div>
            <div className="balance-value">
              {balanceLoading 
                ? 'Loading...' 
                : `${formatDisplayAmount(convertToDisplayAmount(balanceInPol))}`
              }
              <span className="balance-unit">{getDisplayUnit()}</span>
            </div>
          </div>

          {/* Bet Amount Display (Large) */}
          <div className="amount-display-section">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
              min={minBet}
              max={maxBet}
              step="0.1"
              placeholder="0"
              className="amount-input"
            />
            <span className="amount-unit">{getDisplayUnit()}</span>
          </div>

          {/* Bet Size in POL with Min/Max Buttons */}
          <div className="bet-size-section">
            <div className="bet-size-label">Bet Size in POL</div>
            <div className="bet-size-range">
              {minBet} - {maxBet}
            </div>
            <div className="minmax-buttons">
              <button className="minmax-btn" onClick={setBetToMin}>
                MIN
              </button>
              <button className="minmax-btn" onClick={setBetToMax}>
                MAX
              </button>
            </div>
          </div>

          {/* Error/Warning Messages */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {insufficientFunds && (
            <div className="warning-message">
              Insufficient balance ({formatDisplayAmount(convertToDisplayAmount(balanceInPol))} {getDisplayUnit()} available)
            </div>
          )}

          {betTooLow && (
            <div className="warning-message">
              Bet must be at least {formatDisplayAmount(convertToDisplayAmount(minBet))} {getDisplayUnit()}
            </div>
          )}

          {betTooHigh && (
            <div className="warning-message">
              Bet cannot exceed {formatDisplayAmount(convertToDisplayAmount(maxBet))} {getDisplayUnit()}
            </div>
          )}

          {/* Create Game Button */}
          <button
            className={`create-btn ${isValidBet ? 'active' : 'disabled'}`}
            onClick={createBet}
            disabled={loading || !isValidBet}
          >
            {loading ? 'Creating Game...' : 'Create Game'}
          </button>
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (gameState === 'waiting') {
    return (
      <div className="game-room waiting">
        <div className="waiting-card">
          <h2>Waiting for Opponent</h2>
          <p>Share this link with your opponent:</p>
          
          <div className="share-link">
            <input type="text" readOnly value={getGameLink()} />
            <button
              onClick={() => {
                navigator.clipboard.writeText(getGameLink());
                alert('Link copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
          
          <div className="bet-info">
            <p>Bet Amount: <strong>{betAmount} MATIC</strong></p>
            <p>Game ID: <strong>{betId}</strong></p>
          </div>
          
          <div className="loading-spinner">⏳ Waiting for opponent...</div>
        </div>
      </div>
    );
  }

  // Playing
  if (gameState === 'playing') {
    return (
      <div className="game-room playing">
        <div className="game-header">
          <h2>Round {currentRound} of 5</h2>
          <div className="score-display">
            <div className="score">
              <span className="label">You</span>
              <span className="value">{score.player1}</span>
            </div>
            <span className="divider">vs</span>
            <div className="score">
              <span className="label">Opponent</span>
              <span className="value">{score.player2}</span>
            </div>
          </div>
        </div>
        
        <div className="game-content">
          <DiceGame
            playerRole={playerRole}
            roundNumber={currentRound}
            drandHook={drandHook}
            onRollComplete={handleRollComplete}
          />
        </div>
        
        <div className="game-info">
          <p>First to 2 wins claims the pot</p>
          <p className="formula-hint">
            Formula: total = (drandValue % 12) + 1
          </p>
        </div>
      </div>
    );
  }

  // Game completed
  if (gameState === 'completed' && gameResult) {
    return (
      <ResultsBoard
        result={gameResult}
        playerAddress={walletAddress}
        betAmount={betAmount}
      />
    );
  }

  return null;
}
