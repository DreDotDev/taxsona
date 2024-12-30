'use client';

import { useState } from 'react';
import { TransactionDetail } from '../../types/analytics';

const TransactionLog = ({ transactions }: { transactions: TransactionDetail[] }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedTransactions = [...transactions].sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.timestamp.getTime() - a.timestamp.getTime()
      : a.timestamp.getTime() - b.timestamp.getTime();
  });

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
          Transaction History
        </h2>
        <button
          onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-1 rounded-lg font-mono text-sm bg-black/20 hover:bg-black/30 border border-solana-purple/10 hover:border-solana-purple/30 transition-all"
        >
          {sortOrder === 'desc' ? '↓ Latest First' : '↑ Oldest First'}
        </button>
      </div>

      <div className="space-y-4">
        {currentTransactions.map((tx) => (
          <div key={tx.signature} className="p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-all border border-solana-purple/10 hover:border-solana-purple/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-white">
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </p>
                <p className="text-xs text-gray-500">
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
                  {tx.balanceChange.toFixed(4)} SOL
                </p>
                <p className="text-xs text-gray-500">
                  Balance: {tx.postBalance.toFixed(4)} SOL
                </p>
              </div>
            </div>
            {tx.type && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-solana-purple/20 to-solana-green/20 border border-solana-purple/10">
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg font-mono text-sm bg-black/20 hover:bg-black/30 disabled:opacity-50 border border-solana-purple/10 hover:border-solana-purple/30 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg font-mono text-sm bg-black/20 hover:bg-black/30 disabled:opacity-50 border border-solana-purple/10 hover:border-solana-purple/30 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionLog; 