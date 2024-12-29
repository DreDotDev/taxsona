'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TransactionAnalytics } from '../app/components/TransactionAnalytics';
import { WalletProvider } from '../app/components/WalletProvider';

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-solana-purple via-solana-green to-solana-blue animate-gradient-xy sm:text-5xl md:text-6xl">
              Solana Transaction Analyzer
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 font-mono sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect your wallet and analyze your transaction history
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <WalletMultiButton />
          </div>

          <div className="mt-10">
            <TransactionAnalytics />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}