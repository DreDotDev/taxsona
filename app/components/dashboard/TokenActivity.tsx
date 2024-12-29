import { TokenTransaction } from '../../types/analytics';
import { useMemo } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const TokenActivity = ({ transactions }: { transactions: TokenTransaction[] }) => {
  const tokenStats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const key = tx.mint || 'SOL';
      if (!acc[key]) {
        acc[key] = {
          volume: 0,
          buys: 0,
          sells: 0,
          lastPrice: tx.price,
          totalValue: 0
        };
      }
      acc[key].volume += tx.amount;
      acc[key].totalValue += (tx.price || 0) * tx.amount;
      acc[key][tx.type === 'buy' ? 'buys' : 'sells']++;
      return acc;
    }, {} as Record<string, { 
      volume: number; 
      buys: number; 
      sells: number; 
      lastPrice: number;
      totalValue: number;
    }>);
  }, [transactions]);

  return (
    <div className="backdrop-blur-xl bg-black/30 rounded-xl p-6 border border-solana-purple/20">
      <h2 className="text-xl font-bold mb-6 font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
        Token Activity
      </h2>
      <div className="space-y-4">
        {Object.entries(tokenStats)
          .sort((a, b) => b[1].totalValue - a[1].totalValue)
          .map(([token, stats]) => (
            <div
              key={token}
              className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-all border border-solana-purple/10 hover:border-solana-purple/30"
            >
              <div>
                <p className="font-mono text-sm text-white">
                  {token.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-500">
                  {stats.buys} buys • {stats.sells} sells
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                  {(stats.totalValue / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </p>
                <p className="text-xs text-gray-500">
                  Volume: {stats.volume.toFixed(2)} tokens
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TokenActivity; 