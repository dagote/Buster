/**
 * MetaMask/Wallet Connection Hook
 * Sign in with wallet address (no complex logic, just address verification)
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is available and listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for account changes in MetaMask
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnect();
        } else {
          // User switched accounts
          const newAddress = accounts[0];
          setAddress(newAddress);
          console.log('Account switched to:', newAddress);
        }
      };

      // Add account change listener
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }

      // Cleanup listener on unmount
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  /**
   * Connect to MetaMask
   */
  async function connect() {
    try {
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension.');
      }

      // Request permissions for eth_accounts
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // Use eth_requestAccounts after permissions
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const currentAddress = accounts[0];
      console.log('✅ Connected:', currentAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Force Polygon network
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0x89' }]);

      setAddress(currentAddress);
      setProvider(provider);
      setConnected(true);
      
      return currentAddress;
    } catch (err) {
      setError(err.message);
      setConnected(false);
      throw err;
    }
  }

  /**
   * Disconnect wallet
   */
  function disconnect() {
    setAddress(null);
    setProvider(null);
    setConnected(false);
    // Clear all IndexedDB as well
    if (typeof indexedDB !== 'undefined') {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    }
    // Reload page to clear all frontend state
    window.location.href = '/';
  }

  return {
    address,
    provider,
    connected,
    error,
    connect,
    disconnect
  };
}

/**
 * Drand Fetching Hook
 */
export function useDrandFetch() {
  const [drandData, setDrandData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLatestDrand() {
    try {
      setLoading(true);
      setError(null);

      const drandApi = import.meta.env.VITE_DRAND_API || 'https://drandbeacon.io/api/public';
      const response = await fetch(`${drandApi}/latest`);

      if (!response.ok) {
        throw new Error('Failed to fetch Drand randomness');
      }

      const data = await response.json();
      setDrandData(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    drandData,
    loading,
    error,
    fetchLatestDrand
  };
}
