import React, { useState } from 'react';
import { claimWinnings } from '../utils/api';
import { getDrandVerificationLink } from '../utils/drandFormula';
import './ResultsBoard.css';

export default function ResultsBoard({ result, playerAddress, betAmount }) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);

  const winnings = betAmount * 2 * 0.98; // 2% fee

  async function handleClaim() {
    try {
      setClaiming(true);
      setError(null);

      await claimWinnings(playerAddress, winnings);
      setClaimed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="results-board">
      <div className="results-card">
        {/* Winner Banner */}
        <div className="winner-banner">
          <h1 className="winner-text">
            {result.matchWinner === 1 ? '🎉 You Win!' : '😔 You Lose'}
          </h1>
          <p className="winner-subtitle">
            {result.matchWinner === 1
              ? `Congratulations! You won the best of 3!`
              : `Good game! Better luck next time.`}
          </p>
        </div>

        {/* Game Information */}
        <div className="info-section">
          <h2>Game Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Your Address</span>
              <span className="value">{playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}</span>
            </div>
            
            <div className="info-item">
              <span className="label">Bet Amount</span>
              <span className="value">{betAmount} POL</span>
            </div>

            <div className="info-item">
              <span className="label">Final Rolls</span>
              <span className="value">
                {result.rolls.player1} vs {result.rolls.player2}
              </span>
            </div>

            <div className="info-item">
              <span className="label">Drand Round</span>
              <span className="value">{result.drandRound}</span>
            </div>
          </div>
        </div>

        {/* Drand Verification */}
        <div className="verification-section">
          <h2>Verify Outcome</h2>
          <p className="verify-desc">
            This game was settled using Drand randomness. You can independently verify the randomness and outcome:
          </p>
          
          <div className="verify-steps">
            <div className="step">
              <span className="step-num">1</span>
              <div>
                <p className="step-title">Check Drand Randomness</p>
                <a
                  href={getDrandVerificationLink(result.drandRound)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="verify-link"
                >
                  drandbeacon.io/round/{result.drandRound} →
                </a>
              </div>
            </div>

            <div className="step">
              <span className="step-num">2</span>
              <div>
                <p className="step-title">Verify the Formula</p>
                <code>total = (drandValue % 12) + 1</code>
                <p className="step-desc">Calculate: ({result.drandValue} % 12) + 1 = ?</p>
              </div>
            </div>

            <div className="step">
              <span className="step-num">3</span>
              <div>
                <p className="step-title">Check Block Explorer</p>
                <p className="step-desc">
                  Transaction: <code>{result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}</code>
                </p>
              </div>
            </div>
          </div>

          <div className="formula-box">
            <p className="label">Public Formula</p>
            <code className="formula">total = (drandValue % 12) + 1</code>
            <p className="formula-desc">
              This formula is immutable and verifiable by anyone. The outcome cannot be changed.
            </p>
          </div>
        </div>

        {/* Claim Winnings (if winner) */}
        {result.matchWinner === 1 && (
          <div className="claim-section">
            <h2>Claim Your Winnings</h2>
            
            {claimed ? (
              <div className="success-message">
                ✅ Winnings claimed! Check your wallet.
              </div>
            ) : (
              <>
                <div className="winnings-box">
                  <p className="winnings-label">You can claim:</p>
                  <p className="winnings-amount">{winnings} POL</p>
                  <p className="winnings-note">
                    (Total pot: {betAmount * 2} POL - 2% protocol fee)
                  </p>
                </div>

                {error && (
                  <div className="error-message">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  className="claim-btn"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? 'Claiming...' : '💰 Claim Winnings'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Play Again */}
        <div className="play-again">
          <button
            className="primary-btn"
            onClick={() => window.location.reload()}
          >
            🎲 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
