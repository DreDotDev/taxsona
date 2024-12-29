import { useEffect, useState } from 'react';
import { AnalyticsData } from '../../types/analytics';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { calculateTokenPnL } from '../../utils/transactionProcessing';
import { getQuickNodeConnection } from '../../utils/quicknode';

const OverviewStats = ({ data, walletAddress }: { data: AnalyticsData; walletAddress: string }) => {
  const [profitLoss, setProfitLoss] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPnL = async () => {
      try {
        const connection = getQuickNodeConnection();
        const pnl = await calculateTokenPnL(walletAddress, connection);
        setProfitLoss(pnl);
      } catch (error) {
        console.error('Error fetching P&L:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (walletAddress) {
      fetchPnL();
    }
  }, [walletAddress]);

  const totalVolumeSol = data.totalVolume / LAMPORTS_PER_SOL;
  const isProfit = profitLoss > 0;
  
  return (
    <div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Volume"
        value={`${totalVolumeSol.toFixed(2)} SOL`}
        icon="📊"
        subtitle="All-time trading volume"
      />
      <StatCard
        title="Net P&L"
        value={isLoading ? 'Loading...' : `${isProfit ? '+' : ''}${profitLoss.toFixed(2)} SOL`}
        icon="💰"
        subtitle="Realized profit/loss from trades"
        valueClassName={isLoading ? 'text-gray-400' : isProfit ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        title="Unique Wallets"
        value={data.uniqueWallets.toString()}
        icon="👥"
        subtitle="Distinct addresses"
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