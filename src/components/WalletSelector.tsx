'use client';

import { useState, useEffect } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { ChevronDown, Wallet, Check } from 'lucide-react';

interface WalletInfo {
  name: string;
  icon?: string;
  iconDataUrl?: string;
}

interface WalletSelectorProps {
  onWalletSelect: (wallet: any) => void;
  onError: (error: string) => void;
  className?: string;
}

export function WalletSelector({ onWalletSelect, onError, className = '' }: WalletSelectorProps) {
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletIcons, setWalletIcons] = useState<Record<string, string>>({});

  // Get available wallets on component mount
  useEffect(() => {
    async function getAvailableWallets() {
      try {
        setIsLoading(true);
        const wallets = await BrowserWallet.getAvailableWallets();
        setAvailableWallets(wallets);
        
        // Fetch icons for all available wallets using CIP-30 cardano.{walletName}.icon
        const iconPromises = wallets.map(async (wallet) => {
          try {
            // Check if the wallet is available in the global cardano object
            const walletName = wallet.name.toLowerCase();
            const cardanoWallet = (window as any).cardano?.[walletName];
            
            if (cardanoWallet && cardanoWallet.icon) {
              return { name: wallet.name, icon: cardanoWallet.icon };
            }
            
            return { name: wallet.name, icon: null };
          } catch (error) {
            console.warn(`Failed to get icon for ${wallet.name}:`, error);
          }
          return { name: wallet.name, icon: null };
        });

        const iconResults = await Promise.allSettled(iconPromises);
        const icons: Record<string, string> = {};
        
        iconResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.icon) {
            icons[result.value.name] = result.value.icon;
          }
        });
        
        setWalletIcons(icons);
        
        // If only one wallet is available, auto-select it
        if (wallets.length === 1) {
          setSelectedWallet(wallets[0]);
        }
      } catch (error) {
        onError('Failed to detect available wallets');
        console.error('Error getting available wallets:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getAvailableWallets();
  }, [onError]);

  const handleWalletSelect = async (wallet: WalletInfo) => {
    try {
      setIsConnecting(true);
      setIsOpen(false);
      
      const connected = await BrowserWallet.enable(wallet.name);
      if (connected) {
        setSelectedWallet(wallet);
        onWalletSelect(connected);
      } else {
        onError(`Failed to connect to ${wallet.name}`);
      }
    } catch (error) {
      onError(`Failed to connect to ${wallet.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getWalletIcon = (walletName: string) => {
    // First try to use the CIP-30 icon if available
    if (walletIcons[walletName]) {
      return (
        <img 
          src={walletIcons[walletName]} 
          alt={`${walletName} icon`}
          className="w-5 h-5 object-contain"
        />
      );
    }
    
    // Fallback to emoji icons for wallets without CIP-30 icons
    const name = walletName.toLowerCase();
    if (name.includes('eternl')) return <span className="text-lg">🔵</span>;
    if (name.includes('nami')) return <span className="text-lg">🔷</span>;
    if (name.includes('lace')) return <span className="text-lg">💎</span>;
    if (name.includes('flint')) return <span className="text-lg">🔥</span>;
    if (name.includes('yoroi')) return <span className="text-lg">🟡</span>;
    if (name.includes('typhon')) return <span className="text-lg">🌪️</span>;
    return <span className="text-lg">💳</span>;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Detecting wallets...</span>
      </div>
    );
  }

  if (availableWallets.length === 0) {
    return (
      <div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center">
          <Wallet className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700">
            No wallet extensions detected. Please install a CIP-30 compatible wallet like Nami, Lace, Eternl, or Flint.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConnecting}
        className={`w-full flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          isConnecting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center">
          {selectedWallet ? (
            <>
              <div className="mr-2">{getWalletIcon(selectedWallet.name)}</div>
              <span className="font-medium text-gray-900">{selectedWallet.name}</span>
              <Check className="h-4 w-4 text-green-500 ml-2" />
            </>
          ) : (
            <>
              <Wallet className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500">
                {availableWallets.length === 1 
                  ? `Connect to ${availableWallets[0].name}`
                  : 'Select a wallet'
                }
              </span>
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="py-1">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isConnecting}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                  isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="mr-3">{getWalletIcon(wallet.name)}</div>
                <span className="font-medium text-gray-900">{wallet.name}</span>
                {selectedWallet?.name === wallet.name && (
                  <Check className="h-4 w-4 text-green-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="mt-2 flex items-center text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
          Connecting to wallet...
        </div>
      )}
    </div>
  );
}
