import { Connection, PublicKey, Commitment } from '@solana/web3.js';

const QUICKNODE_RPC = "https://rough-winter-putty.solana-mainnet.quiknode.pro/fb99ea7b4117dec92a034248b2282d22f75e2be3/";

export const getQuickNodeConnection = () => {
  return new Connection(QUICKNODE_RPC, {
    commitment: 'confirmed' as Commitment,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
    httpHeaders: {
      'Content-Type': 'application/json',
    }
  });
};

export const getAccountInfo = async (address: string) => {
  const connection = getQuickNodeConnection();
  const publicKey = new PublicKey(address);
  return await connection.getAccountInfo(publicKey);
};

export const getTokenAccounts = async (walletAddress: string) => {
  const connection = getQuickNodeConnection();
  const publicKey = new PublicKey(walletAddress);
  return await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  });
};

export const getTransactionHistory = async (address: string, limit = 1000) => {
  const connection = getQuickNodeConnection();
  const publicKey = new PublicKey(address);
  return await connection.getSignaturesForAddress(publicKey, { limit });
}; 