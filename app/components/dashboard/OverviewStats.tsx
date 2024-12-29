import { AnalyticsData } from '../../types/analytics';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const OverviewStats = ({ data }: { data: AnalyticsData }) => {
  const totalVolumeSol = data.totalVolume / LAMPORTS_PER_SOL;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Volume"
        value={`${totalVolumeSol.toFixed(2)} SOL`}
        icon="📊"
      />
      <StatCard
        title="Unique Wallets"
        value={data.uniqueWallets.toString()}
        icon="👥"
      />
      <StatCard
        title="Token Transactions"
        value={data.tokenTransactions.length.toString()}
        icon="🔄"
      />
      <StatCard
        title="NFT Transactions"
        value={data.nftTransactions.length.toString()}
        icon="🖼️"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: string; icon: string }) => (
  <div className="backdrop-blur-xl bg-white/5 p-4 rounded-lg border border-white/10">
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-400">Last 24h</span>
    </div>
    <p className="mt-2 text-2xl font-bold font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-sm text-gray-400">{title}</p>
  </div>
);

export default OverviewStats; 