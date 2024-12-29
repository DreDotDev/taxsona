'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransactionStats {
  totalProfit: number;
  totalLoss: number;
  netBalance: number;
}

const TransactionAnalytics = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [stats, setStats] = useState<TransactionStats>({
    totalProfit: 0,
    totalLoss: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);

  const analyzeTransactions = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey);
      
      if (signatures.length === 0) {
        setHasTransactions(false);
        setLoading(false);
        return;
      }
      
      setHasTransactions(true);
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
    <div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-lg sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <button
          onClick={analyzeTransactions}
          disabled={!publicKey || loading}
          className="w-full flex justify-center py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
        >
          <span className="flex items-center space-x-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Analyzing Blockchain Data...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Analyze On-Chain Activity</span>
              </>
            )}
          </span>
        </button>

        {hasTransactions === false && (
          <div className="text-center p-4 sm:p-6 backdrop-blur-md bg-black/30 rounded-lg sm:rounded-xl border border-yellow-500/20">
            <div className="flex justify-center mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-yellow-300 font-mono">
              No on-chain activity detected for this wallet.
            </p>
          </div>
        )}

        {hasTransactions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            <div className="backdrop-blur-md bg-green-500/10 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-500/20">
              <h3 className="text-base sm:text-lg font-mono text-green-400">Total Profit</h3>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-green-500">
                {stats.totalProfit.toFixed(4)} <span className="text-xs sm:text-sm">SOL</span>
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-red-500/10 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-red-500/20">
              <h3 className="text-base sm:text-lg font-mono text-red-400">Total Loss</h3>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-red-500">
                {stats.totalLoss.toFixed(4)} <span className="text-xs sm:text-sm">SOL</span>
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-blue-500/10 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-500/20 sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-mono text-blue-400">Net Balance</h3>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-blue-500">
                {stats.netBalance.toFixed(4)} <span className="text-xs sm:text-sm">SOL</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionAnalytics; 