import { 
  ParsedTransactionWithMeta, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Connection 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAccount,
  getMint
} from '@solana/spl-token';
import { WalletInteraction, TokenTransaction, NFTTransaction } from '../types/analytics';
import { Metaplex } from "@metaplex-foundation/js";

// Use dynamic import for node:crypto
const getCrypto = async () => {
  if (typeof window === "undefined") {
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.webcrypto;
  }
  return window.crypto;
};

// Initialize crypto
(async () => {
  if (typeof window === "undefined") {
    const cryptoImpl = await getCrypto();
    (global as any).crypto = cryptoImpl;
  }
})();

export const NFT_PROGRAM_IDS = [
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metaplex Token Metadata
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98', // Metaplex Auction
  'meshj2Qsd9TyZG8rGK3U4yZxh1zHqZ9MJsAVK4Fd7zZ',  // Magic Eden v2
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K'   // Magic Eden v1
];

export const processWalletInteractions = async (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  interactions: Map<string, WalletInteraction>,
  _connection: Connection
) => {
  if (!tx.meta?.postBalances || !tx.meta?.preBalances) return;

  const accounts = tx.transaction.message.accountKeys;
  const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index];
    if (account.pubkey.equals(userWallet)) continue;

    const address = account.pubkey.toBase58();
    const currentInteraction = interactions.get(address) || {
      address,
      totalSent: 0,
      totalReceived: 0,
      lastInteraction: timestamp,
      transactionCount: 0
    };

    const preBalance = tx.meta.preBalances[index];
    const postBalance = tx.meta.postBalances[index];
    const balanceChange = (postBalance - preBalance) / LAMPORTS_PER_SOL;

    if (balanceChange > 0) {
      currentInteraction.totalReceived += balanceChange;
    } else if (balanceChange < 0) {
      currentInteraction.totalSent += Math.abs(balanceChange);
    }

    currentInteraction.transactionCount++;
    currentInteraction.lastInteraction = timestamp;
    interactions.set(address, currentInteraction);
  }
};

export const processTokenTransactions = async (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  connection: Connection
): Promise<TokenTransaction[]> => {
  const tokenTxs: TokenTransaction[] = [];
  
  if (!tx.meta || !tx.meta.postTokenBalances || !tx.meta.preTokenBalances) return tokenTxs;

  const instructions = tx.transaction.message.instructions;
  const timestamp = tx.blockTime ? tx.blockTime * 1000 : Date.now();

  for (const instruction of instructions) {
    if ('programId' in instruction && instruction.programId.equals(TOKEN_PROGRAM_ID)) {
      const preBalances = new Map(
        tx.meta.preTokenBalances.map(b => [b.accountIndex, b])
      );
      const postBalances = new Map(
        tx.meta.postTokenBalances.map(b => [b.accountIndex, b])
      );

      for (const [accountIndex, postBalance] of postBalances) {
        const preBalance = preBalances.get(accountIndex);
        if (!preBalance) continue;

        const balanceChange = Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
        if (balanceChange === 0) continue;

        try {
          const tokenAccount = await getAccount(connection, tx.transaction.message.accountKeys[accountIndex].pubkey);
          const mint = await getMint(connection, tokenAccount.mint);

          tokenTxs.push({
            tokenAddress: tokenAccount.mint.toBase58(),
            amount: Math.abs(balanceChange / Math.pow(10, mint.decimals)),
            type: balanceChange > 0 ? 'buy' : 'sell',
            price: tx.meta.postBalances[0] - tx.meta.preBalances[0], // Approximate SOL price
            timestamp
          });
        } catch (error) {
          console.error('Error processing token transaction:', error);
        }
      }
    }
  }

  return tokenTxs;
};

export const processNFTTransactions = async (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  connection: Connection
): Promise<NFTTransaction[]> => {
  const nftTxs: NFTTransaction[] = [];
  
  if (!tx.meta) return nftTxs;

  const isNFTTransaction = tx.transaction.message.instructions.some(
    ix => 'programId' in ix && NFT_PROGRAM_IDS.includes(ix.programId.toString())
  );

  if (isNFTTransaction) {
    const solChange = (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL;
    
    // Find the NFT mint address from token balances
    const tokenBalances = tx.meta.postTokenBalances || [];
    for (const tokenBalance of tokenBalances) {
      try {
        const tokenAccount = await getAccount(connection, tx.transaction.message.accountKeys[tokenBalance.accountIndex].pubkey);
        const mint = tokenAccount.mint;
        const mintAddress = mint.toBase58();
        
        // Check if this is an NFT (supply of 1)
        const mintInfo = await getMint(connection, mint);
        if (mintInfo.supply === BigInt(1)) {
          // Fetch NFT metadata from Metaplex
          const metaplex = new Metaplex(connection);
          const metadataAccount = await metaplex.nfts().findByMint({ mintAddress: mint });
          
          nftTxs.push({
            mint: mintAddress,
            collectionName: metadataAccount.collection?.address.toString() || 'Unknown Collection',
            price: Math.abs(solChange),
            type: solChange < 0 ? 'buy' : 'sell',
            timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now()
          });
          break;
        }
      } catch (error) {
        console.error('Error processing NFT transaction:', error);
      }
    }
  }

  return nftTxs;
};

export const calculateTotalVolume = (
  tokenTxs: TokenTransaction[], 
  nftTxs: NFTTransaction[]
): number => {
  const tokenVolume = tokenTxs.reduce((sum, tx) => sum + (tx.price || 0), 0);
  const nftVolume = nftTxs.reduce((sum, tx) => sum + tx.price, 0);
  return tokenVolume + nftVolume;
};