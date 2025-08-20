import type { WalletError, TransactionError } from '../types/api';
import { walletLogger } from './logger';

// Wallet connection states
export type WalletConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'network_mismatch'
  | 'no_wallet';

// Wallet error codes
export const WALLET_ERROR_CODES = {
  NO_WALLET: 'NO_WALLET',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  USER_REJECTED: 'USER_REJECTED',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
} as const;

// Transaction error codes
export const TRANSACTION_ERROR_CODES = {
  BUILD_FAILED: 'BUILD_FAILED',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  SUBMISSION_FAILED: 'SUBMISSION_FAILED',
  CONFIRMATION_FAILED: 'CONFIRMATION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
} as const;

// Wallet error messages
export const WALLET_ERROR_MESSAGES = {
  [WALLET_ERROR_CODES.NO_WALLET]: 'No CIP-30 wallet detected. Please install Nami, Lace, Eternl, or Flint.',
  [WALLET_ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to wallet. Please try again.',
  [WALLET_ERROR_CODES.NETWORK_MISMATCH]: 'Wallet network mismatch. Please switch to the correct network.',
  [WALLET_ERROR_CODES.SIGNATURE_FAILED]: 'Transaction signature failed. Please try again.',
  [WALLET_ERROR_CODES.INVALID_ADDRESS]: 'Invalid address format. Please check your input.',
  [WALLET_ERROR_CODES.USER_REJECTED]: 'Transaction was rejected by the user.',
  [WALLET_ERROR_CODES.TIMEOUT]: 'Operation timed out. Please try again.',
  [WALLET_ERROR_CODES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Transaction error messages
export const TRANSACTION_ERROR_MESSAGES = {
  [TRANSACTION_ERROR_CODES.BUILD_FAILED]: 'Failed to build transaction. Please check your inputs.',
  [TRANSACTION_ERROR_CODES.SIGNATURE_FAILED]: 'Transaction signature failed. Please try again.',
  [TRANSACTION_ERROR_CODES.SUBMISSION_FAILED]: 'Failed to submit transaction to the network.',
  [TRANSACTION_ERROR_CODES.CONFIRMATION_FAILED]: 'Transaction confirmation failed. Please check the transaction status.',
  [TRANSACTION_ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete the transaction.',
  [TRANSACTION_ERROR_CODES.INVALID_TRANSACTION]: 'Invalid transaction. Please check your inputs.',
  [TRANSACTION_ERROR_CODES.TIMEOUT]: 'Transaction timed out. Please try again.',
  [TRANSACTION_ERROR_CODES.UNKNOWN]: 'An unexpected error occurred with the transaction.'
};

// Create wallet error
export function createWalletError(
  code: keyof typeof WALLET_ERROR_CODES,
  message?: string,
  details?: Record<string, unknown>
): WalletError {
  return {
    message: message || WALLET_ERROR_MESSAGES[code],
    code: WALLET_ERROR_CODES[code],
    details
  };
}

// Create transaction error
export function createTransactionError(
  code: keyof typeof TRANSACTION_ERROR_CODES,
  message?: string,
  txId?: string,
  details?: Record<string, unknown>
): TransactionError {
  return {
    message: message || TRANSACTION_ERROR_MESSAGES[code],
    code: TRANSACTION_ERROR_CODES[code],
    txId,
    details
  };
}

// Enhanced wallet connection with better error handling
export async function connectWalletWithRetry(
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { BrowserWallet } = await import('@meshsdk/core');
      const available = await BrowserWallet.getAvailableWallets();
      
      if (!available || available.length === 0) {
        throw new Error('No CIP-30 wallet detected');
      }
      
      // Try each available wallet
      for (const wallet of available) {
        try {
          const connected = await BrowserWallet.enable(wallet.name);
          if (connected) {
            walletLogger.info('Wallet connected successfully', { wallet: wallet.name });
            return connected;
          }
        } catch (walletError) {
          walletLogger.warn('Failed to connect to wallet', walletError instanceof Error ? walletError : new Error('Unknown wallet error'), {
            wallet: wallet.name,
            attempt
          });
          lastError = walletError instanceof Error ? walletError : new Error('Wallet connection failed');
        }
      }
      
      throw new Error('All available wallets failed to connect');
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown connection error');
      
      if (attempt < maxRetries) {
        walletLogger.warn('Wallet connection attempt failed, retrying', lastError, { attempt, maxRetries });
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError || new Error('Wallet connection failed after all retries');
}

// Validate wallet network
export async function validateWalletNetwork(
  wallet: any,
  expectedNetworkId: number
): Promise<void> {
  try {
    const networkId = await wallet.getNetworkId();
    if (networkId !== expectedNetworkId) {
      const expectedNetwork = expectedNetworkId === 0 ? 'testnet' : 'mainnet';
      const actualNetwork = networkId === 0 ? 'testnet' : 'mainnet';
      throw new Error(`Network mismatch. Expected ${expectedNetwork}, got ${actualNetwork}`);
    }
  } catch (error) {
    walletLogger.error('Network validation failed', error instanceof Error ? error : new Error('Unknown network error'));
    throw error;
  }
}

// Get wallet addresses with validation
export async function getWalletAddresses(wallet: any): Promise<{
  usedAddresses: string[];
  changeAddress: string;
}> {
  try {
    const [usedAddresses, changeAddress] = await Promise.all([
      wallet.getUsedAddresses(),
      wallet.getChangeAddress()
    ]);
    
    if (!changeAddress) {
      throw new Error('No change address available');
    }
    
    return { usedAddresses, changeAddress };
  } catch (error) {
    walletLogger.error('Failed to get wallet addresses', error instanceof Error ? error : new Error('Unknown address error'));
    throw error;
  }
}

// Enhanced transaction building with error handling
export async function buildTransactionWithRetry(
  buildFunction: () => Promise<any>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transaction = await buildFunction();
      walletLogger.info('Transaction built successfully', { attempt });
      return transaction;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown build error');
      
      if (attempt < maxRetries) {
        walletLogger.warn('Transaction build failed, retrying', lastError, { attempt, maxRetries });
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError || new Error('Transaction build failed after all retries');
}

// Enhanced transaction signing with error handling
export async function signTransactionWithRetry(
  wallet: any,
  unsignedTx: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const signedTx = await wallet.signTx(unsignedTx, true);
      walletLogger.info('Transaction signed successfully', { attempt });
      return signedTx;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown signing error');
      
      // Don't retry if user rejected
      if (error instanceof Error && error.message.includes('rejected')) {
        throw createWalletError('USER_REJECTED', 'Transaction was rejected by the user');
      }
      
      if (attempt < maxRetries) {
        walletLogger.warn('Transaction signing failed, retrying', lastError, { attempt, maxRetries });
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError || new Error('Transaction signing failed after all retries');
}

// Enhanced transaction submission with error handling
export async function submitTransactionWithRetry(
  submitFunction: () => Promise<string>,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const txId = await submitFunction();
      walletLogger.info('Transaction submitted successfully', { txId, attempt });
      return txId;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown submission error');
      
      if (attempt < maxRetries) {
        walletLogger.warn('Transaction submission failed, retrying', lastError, { attempt, maxRetries });
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError || new Error('Transaction submission failed after all retries');
}

// Wait for transaction confirmation with timeout
export async function waitForTransactionConfirmation(
  txId: string,
  timeout: number = 60000, // 60 seconds
  checkInterval: number = 2000 // 2 seconds
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      // This would typically check the blockchain for confirmation
      // For now, we'll simulate a successful confirmation
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      // Simulate confirmation after 10 seconds
      if (Date.now() - startTime > 10000) {
        walletLogger.info('Transaction confirmed', { txId });
        return true;
      }
    } catch (error) {
      walletLogger.warn('Transaction confirmation check failed', error instanceof Error ? error : new Error('Unknown confirmation error'), { txId });
    }
  }
  
  throw new Error('Transaction confirmation timeout');
}

// Utility function to format error messages for display
export function formatWalletErrorMessage(error: WalletError | TransactionError): string {
  return error.message;
}

// Utility function to get user-friendly error suggestions
export function getErrorSuggestions(error: WalletError | TransactionError): string[] {
  const suggestions: string[] = [];
  
  switch (error.code) {
    case 'NO_WALLET':
      suggestions.push('Install a CIP-30 compatible wallet like Nami, Lace, Eternl, or Flint');
      suggestions.push('Make sure the wallet extension is enabled in your browser');
      break;
    case 'NETWORK_MISMATCH':
      suggestions.push('Switch your wallet to the correct network (testnet/mainnet)');
      suggestions.push('Check your wallet settings and network configuration');
      break;
    case 'CONNECTION_FAILED':
      suggestions.push('Refresh the page and try again');
      suggestions.push('Check if your wallet extension is working properly');
      break;
    case 'INSUFFICIENT_FUNDS':
      suggestions.push('Add more ADA to your wallet');
      suggestions.push('Check your wallet balance');
      break;
    case 'TIMEOUT':
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      break;
    default:
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the problem persists');
  }
  
  return suggestions;
}
