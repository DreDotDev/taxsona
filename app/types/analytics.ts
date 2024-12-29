import { PublicKey } from '@solana/web3.js';

export interface TransactionStats {
  totalProfit: number;
  totalLoss: number;
  netBalance: number;
}

export interface WalletInteraction {
  address: string;
  totalSent: number;
  totalReceived: number;
  lastInteraction: Date;
  transactionCount: number;
}

export interface TokenTransaction {
  tokenAddress: string;
  tokenName?: string;
  amount: number;
  price?: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export interface NFTTransaction {
  mint: string;
  collectionName?: string;
  price: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export interface AnalyticsData {
  stats: TransactionStats;
  topWallets: WalletInteraction[];
  tokenTransactions: TokenTransaction[];
  nftTransactions: NFTTransaction[];
  totalVolume: number;
  uniqueWallets: number;
} 