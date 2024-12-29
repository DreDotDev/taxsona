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
  signature: string;
  timestamp: number;
  mint: string;
  amount: number;
  price: number;
  type: 'buy' | 'sell';
  txHash?: string;
}

export interface NFTTransaction {
  mint: string;
  collectionName: string;
  price: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export interface TransactionDetail {
  signature: string;
  timestamp: Date;
  balanceChange: number;
  postBalance: number;
  type?: string;
  description?: string;
}

export interface AnalyticsData {
  totalVolume: number;
  uniqueWallets: number;
  tokenTransactions: TokenTransaction[];
  nftTransactions: NFTTransaction[];
  topWallets: WalletInteraction[];
  transactionLog: TransactionDetail[];
  stats: {
    realizedPnL: number;
    totalProfit: number;
    totalLoss: number;
    netBalance?: number;
  };
  walletAddress: string;
} 