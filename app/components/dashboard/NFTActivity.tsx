import { NFTTransaction } from '../../types/analytics';
import { useMemo } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const NFTActivity = ({ transactions }: { transactions: NFTTransaction[] }) => {
  const collectionStats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const key = tx.collectionName || 'Unknown Collection';
      if (!acc[key]) {
        acc[key] = {
          volume: 0,
          buys: 0,
          sells: 0,
          avgPrice: 0,
          transactions: [],
          lastTransaction: tx.timestamp
        };
      }
      acc[key].volume += tx.price;
      acc[key][tx.type === 'buy' ? 'buys' : 'sells']++;
      acc[key].transactions.push(tx);
      acc[key].avgPrice = acc[key].volume / (acc[key].buys + acc[key].sells);
      acc[key].lastTransaction = Math.max(acc[key].lastTransaction, tx.timestamp);
      return acc;
    }, {} as Record<string, {
      volume: number;
      buys: number;
      sells: number;
      avgPrice: number;
      transactions: NFTTransaction[];
      lastTransaction: number;
    }>);
  }, [transactions]);

  return (
    <div className="backdrop-blur-xl bg-black/30 rounded-xl p-6 border border-solana-purple/20">
      <h2 className="text-xl font-bold mb-6 font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
        NFT Activity
      </h2>
      <div className="space-y-4">
        {Object.entries(collectionStats)
          .sort((a, b) => b[1].volume - a[1].volume)
          .map(([collection, stats]) => (
            <div
              key={collection}
              className="p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-all border border-solana-purple/10 hover:border-solana-purple/30"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold font-mono text-white">{collection}</h3>
                <span className="text-sm font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                  {(stats.volume / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                <div>
                  <p>Avg Price</p>
                  <p className="font-mono text-white">
                    {(stats.avgPrice / LAMPORTS_PER_SOL).toFixed(2)} SOL
                  </p>
                </div>
                <div>
                  <p>Buys</p>
                  <p className="font-mono text-green-400">{stats.buys}</p>
                </div>
                <div>
                  <p>Sells</p>
                  <p className="font-mono text-red-400">{stats.sells}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last activity: {new Date(stats.lastTransaction * 1000).toLocaleDateString()}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default NFTActivity; 