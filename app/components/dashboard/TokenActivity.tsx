import { TokenTransaction } from '../../types/analytics';
import { useMemo } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const TokenActivity = ({ transactions }: { transactions: TokenTransaction[] }) => {
  const tokenStats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const key = tx.tokenAddress;
      if (!acc[key]) {
        acc[key] = {
          volume: 0,
          buys: 0,
          sells: 0,
          lastPrice: tx.price || 0,
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
    <div className="backdrop-blur-xl bg-white/5 rounded-lg p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4 font-mono">Token Activity</h2>
      <div className="space-y-4">
        {Object.entries(tokenStats)
          .sort((a, b) => b[1].totalValue - a[1].totalValue)
          .map(([token, stats]) => (
            <div
              key={token}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/5"
            >
              <div>
                <p className="font-mono text-sm">{token.slice(0, 8)}...</p>
                <p className="text-xs text-gray-400">
                  {stats.buys} buys • {stats.sells} sells
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">
                  {(stats.totalValue / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </p>
                <p className="text-xs text-gray-400">
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