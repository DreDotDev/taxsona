'use client';

import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { Commitment } from '@solana/web3.js';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

const WalletModalProvider = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletModalProvider),
  { ssr: false }
);

const QUICKNODE_RPC = "https://rough-winter-putty.solana-mainnet.quiknode.pro/fb99ea7b4117dec92a034248b2282d22f75e2be3/";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => QUICKNODE_RPC, []);
  
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as Commitment,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
    httpHeaders: {
      'Content-Type': 'application/json',
    }
  }), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}