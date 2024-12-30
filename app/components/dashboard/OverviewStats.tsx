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
  
  const totalVolumeSol = data.totalVolume / LAMPORTS_PER_SOL;
  
  // Separate transactions by type
  const transactionSummaries: Record<string, TransactionSummary[]> = {
    tokenProfit: [],
    tokenLoss: [],
    solSent: [],
    solReceived: [],
    gasFees: []
  };

  let totalTokenProfit = 0;
  let totalTokenLoss = 0;
  let totalSolSent = 0;
  let totalSolReceived = 0;
  let totalGasFees = 0;

  data.transactionLog.forEach(tx => {
    if (tx.type === 'Token Transfer') {
      const summary: TransactionSummary = {
        signature: tx.signature,
        timestamp: tx.timestamp,
        invested: tx.balanceChange < 0 ? Math.abs(tx.balanceChange) : 0,
        result: tx.balanceChange > 0 ? tx.balanceChange : Math.abs(tx.balanceChange),
        type: tx.type
      };

      if (tx.balanceChange > 0) {
        transactionSummaries.tokenProfit.push(summary);
        totalTokenProfit += tx.balanceChange;
      } else if (tx.balanceChange < 0) {
        transactionSummaries.tokenLoss.push(summary);
        totalTokenLoss += Math.abs(tx.balanceChange);
      }
    } else if (tx.type === 'SOL Transfer') {
      const summary: TransactionSummary = {
        signature: tx.signature,
        timestamp: tx.timestamp,
        invested: 0,
        result: Math.abs(tx.balanceChange),
        type: tx.type
      };

      if (tx.balanceChange > 0) {
        transactionSummaries.solReceived.push(summary);
        totalSolReceived += tx.balanceChange;
      } else if (tx.balanceChange < 0) {
        transactionSummaries.solSent.push(summary);
        totalSolSent += Math.abs(tx.balanceChange);
      }
    }

    // Calculate gas fees (small negative balance changes)
    if (tx.balanceChange < 0 && Math.abs(tx.balanceChange) < 0.01) {
      transactionSummaries.gasFees.push({
        signature: tx.signature,
        timestamp: tx.timestamp,
        invested: 0,
        result: Math.abs(tx.balanceChange),
        type: 'Gas Fee'
      });
      totalGasFees += Math.abs(tx.balanceChange);
    }
  });

  // Calculate net profit/loss (only from token trades)
  const netProfitLoss = totalTokenProfit - totalTokenLoss;
  const isProfit = netProfitLoss > 0;

  return (
    <div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Volume"
        value={`${totalVolumeSol.toFixed(2)} SOL`}
        icon="📊"
        subtitle="All-time trading volume"
      />
      <StatCard
        title="Net Trading P/L"
        value={`${isProfit ? '+' : ''}${netProfitLoss.toFixed(4)} SOL`}
        icon="💰"
        subtitle="Net profit/loss from token trading"
        valueClassName={isProfit ? 'text-green-400' : 'text-red-400'}
      />
      <ExpandableStatCard
        title="Token Profit"
        value={`+${totalTokenProfit.toFixed(4)} SOL`}
        icon="📈"
        subtitle={`${transactionSummaries.tokenProfit.length} profitable token trades`}
        valueClassName="text-green-400"
        isExpanded={expandedCard === 'tokenProfit'}
        onToggle={() => setExpandedCard(expandedCard === 'tokenProfit' ? null : 'tokenProfit')}
        transactions={transactionSummaries.tokenProfit}
      />
      <ExpandableStatCard
        title="Token Loss"
        value={`-${totalTokenLoss.toFixed(4)} SOL`}
        icon="📉"
        subtitle={`${transactionSummaries.tokenLoss.length} unprofitable token trades`}
        valueClassName="text-red-400"
        isExpanded={expandedCard === 'tokenLoss'}
        onToggle={() => setExpandedCard(expandedCard === 'tokenLoss' ? null : 'tokenLoss')}
        transactions={transactionSummaries.tokenLoss}
      />
      <ExpandableStatCard
        title="SOL Sent"
        value={`${totalSolSent.toFixed(4)} SOL`}
        icon="↗️"
        subtitle={`${transactionSummaries.solSent.length} outgoing transfers`}
        valueClassName="text-orange-400"
        isExpanded={expandedCard === 'solSent'}
        onToggle={() => setExpandedCard(expandedCard === 'solSent' ? null : 'solSent')}
        transactions={transactionSummaries.solSent}
      />
      <ExpandableStatCard
        title="SOL Received"
        value={`${totalSolReceived.toFixed(4)} SOL`}
        icon="↙️"
        subtitle={`${transactionSummaries.solReceived.length} incoming transfers`}
        valueClassName="text-blue-400"
        isExpanded={expandedCard === 'solReceived'}
        onToggle={() => setExpandedCard(expandedCard === 'solReceived' ? null : 'solReceived')}
        transactions={transactionSummaries.solReceived}
      />
      <ExpandableStatCard
        title="Gas Fees"
        value={`${totalGasFees.toFixed(4)} SOL`}
        icon="⛽"
        subtitle={`${transactionSummaries.gasFees.length} transactions`}
        valueClassName="text-gray-400"
        isExpanded={expandedCard === 'gasFees'}
        onToggle={() => setExpandedCard(expandedCard === 'gasFees' ? null : 'gasFees')}
        transactions={transactionSummaries.gasFees}
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
                  {tx.result > 0 ? '+' : '-'}{tx.result.toFixed(4)} SOL
                </span>
                {tx.invested > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Invested: {tx.invested.toFixed(4)} SOL)
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