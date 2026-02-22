import React, { useState, useEffect } from 'react';
import { useWallet } from './utils/hooks';
import GameRoom from './components/GameRoom';
import WalletConnect from './components/WalletConnect';
import './App.css';

export default function App() {
  const wallet = useWallet();
  const [gameId, setGameId] = useState(null);
  const [betAmount, setBetAmount] = useState(10); // Default bet in POL

  useEffect(() => {
    // Check if game ID is in URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('game');
    if (id) {
      setGameId(id);
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎲 Bitcino Protocol</h1>
          <p>Trustless P2P Dice Game with Drand</p>
        </div>
        
        {wallet.connected ? (
          <div className="wallet-info">
            <span className="address">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
            <button className="disconnect-btn" onClick={() => wallet.disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <WalletConnect wallet={wallet} />
        )}
      </header>

      {wallet.connected ? (
        <GameRoom walletAddress={wallet.address} />
      ) : (
        <main className="main-content">
          <div className="welcome-screen">
            <div className="welcome-card">
              <h2>Welcome to Bitcino</h2>
              <p>A trustless P2P dice game using Drand randomness</p>
              <div className="feature-list">
                <div className="feature">
                  <span className="icon">✓</span>
                  <div>
                    <h3>Verifiable Randomness</h3>
                    <p>Powered by Drand - transparent and decentralized</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon">✓</span>
                  <div>
                    <h3>Fair Play</h3>
                    <p>Best of 3 wins - no server manipulation</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon">✓</span>
                  <div>
                    <h3>On-Chain Settlement</h3>
                    <p>Payouts verified by smart contract</p>
                  </div>
                </div>
              </div>
              <WalletConnect wallet={wallet} large />
            </div>
          </div>
        </main>
      )}

      <footer className="footer">
        <div className="footer-content">
          <p>
            📖 <a href="/formula.html">View Public Formula</a> • 
            🔗 <a href="https://drandbeacon.io">Drand Beacon</a> • 
            📊 <a href="/docs">Documentation</a>
          </p>
          <p className="formula-note">
            All game outcomes derived from public Drand randomness: <code>total = (drandValue % 12) + 1</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
