import React, { useState } from 'react';

export default function WalletConnect({ wallet, large = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleConnect() {
    try {
      setLoading(true);
      setError(null);
      await wallet.connect();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`wallet-connect ${large ? 'large' : ''}`}>
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      <button 
        className="connect-btn"
        onClick={handleConnect}
        disabled={loading}
      >
        {loading ? 'Connecting...' : '🔗 Connect MetaMask'}
      </button>
    </div>
  );
}

const styles = `
.wallet-connect {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-connect.large .connect-btn {
  padding: 16px 32px;
  font-size: 18px;
}

.connect-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.connect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border-left: 4px solid #dc2626;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
}
