import { WalletInteraction } from '../../types/analytics';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const TopWallets = ({ wallets }: { wallets: WalletInteraction[] }) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-lg p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4 font-mono">Top Interacting Wallets</h2>
      <div className="space-y-4">
        {wallets.map((wallet, index) => (
          <WalletCard
            key={wallet.address}
            wallet={wallet}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

const WalletCard = ({ wallet, rank }: { wallet: WalletInteraction; rank: number }) => {
  const totalSentSol = wallet.totalSent / LAMPORTS_PER_SOL;
  
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/5">
      <div className="flex items-center space-x-4">
        <span className="text-lg font-mono text-gray-400">#{rank}</span>
        <div>
          <p className="font-mono text-sm">
            {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
          </p>
          <p className="text-xs text-gray-400">
            {wallet.transactionCount} transactions
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm">{totalSentSol.toFixed(2)} SOL</p>
        <p className="text-xs text-gray-400">
          Last: {new Date(wallet.lastInteraction).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default TopWallets; 