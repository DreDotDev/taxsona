import { useState } from 'react';
import { AnalyticsData } from '../../types/analytics';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransactionSummary {
  signature: string;
  timestamp: Date;
  invested: number;
  result: number;
  type: string;
}

const OverviewStats = ({ data }: { data: AnalyticsData }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const profitLoss = data.stats.realizedPnL;
  const totalVolumeSol = data.totalVolume / LAMPORTS_PER_SOL;
  const isProfit = profitLoss > 0;

  // Convert TransactionDetail to TransactionSummary
  const transactionSummaries: Record<string, TransactionSummary[]> = {
    profit: [],
    loss: []
  };

  data.transactionLog.forEach(tx => {
    const summary: TransactionSummary = {
      signature: tx.signature,
      timestamp: tx.timestamp,
      invested: tx.balanceChange < 0 ? Math.abs(tx.balanceChange) : 0,
      result: tx.balanceChange > 0 ? tx.balanceChange : tx.balanceChange,
      type: tx.type || 'Unknown'
    };

    if (tx.balanceChange > 0) {
      transactionSummaries.profit.push(summary);
    } else if (tx.balanceChange < 0) {
      transactionSummaries.loss.push(summary);
    }
  });

  return (
    <div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Volume"
        value={`${totalVolumeSol.toFixed(2)} SOL`}
        icon="📊"
        subtitle="All-time trading volume"
      />
      <ExpandableStatCard
        title="Total Profit"
        value={`+${(data.stats.totalProfit || 0).toFixed(2)} SOL`}
        icon="📈"
        subtitle={`${transactionSummaries.profit.length} profitable trades`}
        valueClassName="text-green-400"
        isExpanded={expandedCard === 'profit'}
        onToggle={() => setExpandedCard(expandedCard === 'profit' ? null : 'profit')}
        transactions={transactionSummaries.profit}
      />
      <ExpandableStatCard
        title="Total Loss"
        value={`-${(data.stats.totalLoss || 0).toFixed(2)} SOL`}
        icon="📉"
        subtitle={`${transactionSummaries.loss.length} unprofitable trades`}
        valueClassName="text-red-400"
        isExpanded={expandedCard === 'loss'}
        onToggle={() => setExpandedCard(expandedCard === 'loss' ? null : 'loss')}
        transactions={transactionSummaries.loss}
      />
      <StatCard
        title="Net P&L"
        value={`${isProfit ? '+' : ''}${profitLoss.toFixed(2)} SOL`}
        icon="💰"
        subtitle="Overall profit/loss"
        valueClassName={isProfit ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        title="Total Transactions"
        value={(data.tokenTransactions.length + data.nftTransactions.length).toString()}
        icon="🔄"
        subtitle="Combined token & NFT trades"
      />
    </div>
  );
};

const ExpandableStatCard = ({ 
  title, 
  value, 
  icon, 
  subtitle,
  valueClassName = 'bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent',
  isExpanded,
  onToggle,
  transactions
}: { 
  title: string;
  value: string;
  icon: string;
  subtitle: string;
  valueClassName?: string;
  isExpanded: boolean;
  onToggle: () => void;
  transactions: TransactionSummary[];
}) => (
  <div className={`backdrop-blur-xl bg-black/30 p-6 rounded-xl border border-solana-purple/20 hover:border-solana-purple/40 transition-all ${
    isExpanded ? 'col-span-full' : ''
  }`}>
    <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={onToggle}>
      <span className="text-2xl">{icon}</span>
      <h3 className="text-sm font-mono text-gray-400">{title}</h3>
      <span className="text-gray-400">{isExpanded ? '↑' : '↓'}</span>
    </div>
    <p className={`mt-2 text-2xl font-bold font-mono ${valueClassName}`}>
      {value}
    </p>
    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>

    {isExpanded && (
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
        {transactions.map((tx) => (
          <div key={tx.signature} className="p-3 bg-black/20 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-gray-400">
                {tx.signature.slice(0, 6)}...{tx.signature.slice(-6)}
              </span>
              <div className="text-right">
                <span className={tx.result > 0 ? 'text-green-400' : 'text-red-400'}>
                  {tx.result > 0 ? '+' : ''}{(tx.result / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </span>
                {tx.invested > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Invested: {(tx.invested / LAMPORTS_PER_SOL).toFixed(4)} SOL)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{tx.timestamp.toLocaleDateString()}</span>
              <span>{tx.type}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  icon, 
  subtitle,
  valueClassName = 'bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent'
}: { 
  title: string;
  value: string;
  icon: string;
  subtitle: string;
  valueClassName?: string;
}) => (
  <div className="backdrop-blur-xl bg-black/30 p-6 rounded-xl border border-solana-purple/20 hover:border-solana-purple/40 transition-all">
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-sm font-mono text-gray-400">{title}</h3>
    </div>
    <p className={`mt-2 text-2xl font-bold font-mono ${valueClassName}`}>
      {value}
    </p>
    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
  </div>
);

export default OverviewStats; 