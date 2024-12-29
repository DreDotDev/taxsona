'use client';

import dynamic from 'next/dynamic';
import { WalletProvider } from '../app/components/WalletProvider';

// Dynamically import components that need client-side functionality
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const TransactionAnalytics = dynamic(
  () => import('../app/components/TransactionAnalytics'),
  { ssr: false }
);

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16">
          <div className="text-center space-y-4 sm:space-y-6 mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-solana-purple via-solana-green to-solana-blue animate-gradient-xy">
              TAXSONA
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto text-gray-300 font-mono">
              Connect your wallet and analyze your transaction history
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <WalletMultiButton />
          </div>

          <div className="w-full">
            <TransactionAnalytics />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}