'use client';

import { useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TransactionDetail } from '../../types/analytics';

interface TransactionLogProps {
  transactions: TransactionDetail[];
}

const TransactionLog = ({ transactions }: TransactionLogProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedTransactions = [...transactions].sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.timestamp.getTime() - a.timestamp.getTime()
      : a.timestamp.getTime() - b.timestamp.getTime();
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const currentTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-lg p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-mono">Transaction Log</h2>
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-mono transition-all"
        >
          {sortOrder === 'desc' ? '↓ Latest First' : '↑ Oldest First'}
        </button>
      </div>

      <div className="space-y-4">
        {currentTransactions.map((tx) => (
          <div
            key={tx.signature}
            className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/5"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-mono text-sm mb-1">
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </p>
                <p className="text-xs text-gray-400">
                  {tx.timestamp.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm ${
                  tx.balanceChange > 0 
                    ? 'text-green-400' 
                    : tx.balanceChange < 0 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                }`}>
                  {tx.balanceChange > 0 ? '+' : ''}
                  {(tx.balanceChange / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
                <p className="text-xs text-gray-400">
                  Balance: {(tx.postBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
              </div>
            </div>
            {tx.type && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                  {tx.type}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-sm font-mono transition-all"
          >
            Previous
          </button>
          <span className="text-sm font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-sm font-mono transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionLog; 