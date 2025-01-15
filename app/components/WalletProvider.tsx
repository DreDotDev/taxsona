'use client';

import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { Commitment } from '@solana/web3.js';
import { useMemo } from 'react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR for wallet modal
const WalletModalProvider = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletModalProvider),
  { 
    ssr: false,
    loading: () => null
  }
);

require('@solana/wallet-adapter-react-ui/styles.css');

const QUICKNODE_RPC = "https://rough-winter-putty.solana-mainnet.quiknode.pro/fb99ea7b4117dec92a034248b2282d22f75e2be3/";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => QUICKNODE_RPC, []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}