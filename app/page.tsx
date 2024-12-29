'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TransactionAnalytics } from '../app/components/TransactionAnalytics';
import { WalletProvider } from '../app/components/WalletProvider';

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Solana Transaction Analyzer
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect your wallet and analyze your transaction history
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 rounded-md" />
          </div>

          <div className="mt-10">
            <TransactionAnalytics />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}