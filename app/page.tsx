'use client';

import dynamic from 'next/dynamic';
import { WalletProvider } from './components/WalletProvider';
import HomeContent from './components/HomeContent';

export default function Home() {
  return (
    <WalletProvider>
      <HomeContent />
    </WalletProvider>
  );
}