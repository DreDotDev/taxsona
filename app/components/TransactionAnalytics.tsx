import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransactionStats {
  totalProfit: number;
  totalLoss: number;
  netBalance: number;
}

export function TransactionAnalytics() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [stats, setStats] = useState<TransactionStats>({
    totalProfit: 0,
    totalLoss: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(false);

  const analyzeTransactions = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey);
      let totalProfit = 0;
      let totalLoss = 0;

      for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        if (tx?.meta?.postBalances && tx?.meta?.preBalances) {
          const balanceChange = (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL;
          if (balanceChange > 0) {
            totalProfit += balanceChange;
          } else {
            totalLoss += Math.abs(balanceChange);
          }
        }
      }

      setStats({
        totalProfit,
        totalLoss,
        netBalance: totalProfit - totalLoss,
      });
    } catch (error) {
      console.error('Error analyzing transactions:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="space-y-6">
        <button
          onClick={analyzeTransactions}
          disabled={!publicKey || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Transactions'}
        </button>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 dark:text-green-100">Total Profit</h3>
            <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-200">
              {stats.totalProfit.toFixed(4)} SOL
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-100">Total Loss</h3>
            <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-200">
              {stats.totalLoss.toFixed(4)} SOL
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100">Net Balance</h3>
            <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-200">
              {stats.netBalance.toFixed(4)} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 