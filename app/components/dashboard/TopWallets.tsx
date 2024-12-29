import { WalletInteraction } from '../../types/analytics';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const TopWallets = ({ wallets }: { wallets: WalletInteraction[] }) => {
  return (
    <div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg backdrop-blur-xl bg-black/30 rounded-xl p-6 border border-solana-purple/20">
      <h2 className="text-xl font-bold mb-6 font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
        Top Interacting Wallets
      </h2>
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
    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-all border border-solana-purple/10 hover:border-solana-purple/30">
      <div className="flex items-center space-x-4">
        <span className="text-lg font-mono text-solana-purple">#{rank}</span>
        <div>
          <p className="font-mono text-sm text-white">
            {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
          </p>
          <p className="text-xs text-gray-500">
            {wallet.transactionCount} transactions
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
          {totalSentSol.toFixed(2)} SOL
        </p>
        <p className="text-xs text-gray-500">
          Last: {new Date(wallet.lastInteraction).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default TopWallets; 