import React, { useState, useEffect } from 'react';
import { getDiceTotalFromDrand, splitDiceTotal } from '../utils/drandFormula';
import './DiceGame.css';

export default function DiceGame({ playerRole, roundNumber, drandHook, onRollComplete }) {
  const [diceState, setDiceState] = useState({
    die1: 1,
    die2: 1,
    total: 2,
    rolling: false,
    drandData: null
  });
  const [drandFetchStatus, setDrandFetchStatus] = useState('ready'); // ready, fetching, fetched
  const [error, setError] = useState(null);

  // Handle rolling the dice
  async function rollDice() {
    try {
      setError(null);
      setDrandFetchStatus('fetching');
      
      // Fetch latest Drand
      const drandData = await drandHook.fetchLatestDrand();
      setDrandFetchStatus('fetched');

      // Convert Drand value to dice total
      const drandValue = parseInt(drandData.randomness, 16);
      const diceTotal = getDiceTotalFromDrand(drandValue);

      // Animate rolling
      setDiceState({
        die1: 1,
        die2: 1,
        total: diceTotal,
        rolling: true,
        drandData
      });

      // Simulate rolling animation (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Set final dice (split the total randomly)
      const { die1, die2 } = splitDiceTotal(diceTotal);

      setDiceState({
        die1,
        die2,
        total: diceTotal,
        rolling: false,
        drandData
      });

      // Notify parent
      onRollComplete(playerRole === 'creator' ? 1 : 2, diceTotal, drandData);

    } catch (err) {
      setError(err.message);
      setDrandFetchStatus('ready');
    }
  }

  return (
    <div className="dice-game">
      {/* Drand Verification Info */}
      <div className="drand-info">
        <p className="label">Public Randomness Source:</p>
        <p className="formula">total = (drandValue % 12) + 1</p>
        
        {drandFetchStatus === 'fetched' && diceState.drandData && (
          <div className="verification">
            <p><span>Drand Round:</span> <code>{diceState.drandData.round}</code></p>
            <p><span>Your Total:</span> <code>{diceState.total}</code></p>
            <a
              href={`https://drandbeacon.io/round/${diceState.drandData.round}`}
              target="_blank"
              rel="noopener noreferrer"
              className="verify-link"
            >
              Verify on Drand Beacon →
            </a>
          </div>
        )}
      </div>

      {/* Dice Display */}
      <div className="dice-container">
        <div className={`die ${diceState.rolling ? 'rolling' : ''}`}>
          <span className="pip">{diceState.die1}</span>
        </div>
        <div className="plus">+</div>
        <div className={`die ${diceState.rolling ? 'rolling' : ''}`}>
          <span className="pip">{diceState.die2}</span>
        </div>
        <div className="equals">=</div>
        <div className="total-box">
          <span className="total">{diceState.total}</span>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {drandFetchStatus === 'fetching' && (
        <div className="status-message fetching">
          🔄 Fetching Drand randomness...
        </div>
      )}

      {diceState.rolling && (
        <div className="status-message rolling">
          🎲 Rolling... (Drand powered)
        </div>
      )}

      {drandFetchStatus === 'fetched' && !diceState.rolling && (
        <div className="status-message complete">
          ✓ Roll complete
        </div>
      )}

      {/* Roll Button */}
      <button
        className="roll-btn"
        onClick={rollDice}
        disabled={
          diceState.rolling ||
          drandFetchStatus === 'fetching' ||
          (drandFetchStatus === 'fetched' && !diceState.rolling)
        }
      >
        {diceState.rolling ? '🎲 Rolling...' : 'Roll Dice'}
      </button>

      {/* Info Text */}
      <div className="info-text">
        <p>Powered by <strong>Drand</strong> - Trustless, Public Randomness</p>
        <p>Each roll is verifiable on drandbeacon.io</p>
      </div>
    </div>
  );
}
