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
  timestamp: number;
  tokenSymbol: string;
  amount: number;
  price: number; // Price in SOL
  type: 'buy' | 'sell';
  txHash: string;
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
  stats: {
    netBalance: number;
    totalVolume: number;
    realizedPnL: number;
  };
  topWallets: WalletInteraction[];
  tokenTransactions: TokenTransaction[];
  nftTransactions: NFTTransaction[];
  totalVolume: number;
  uniqueWallets: number;
  transactionLog: TransactionDetail[];
} 