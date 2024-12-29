import { 
  ParsedTransactionWithMeta, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Connection,
  SystemProgram
} from '@solana/web3.js';
import { 
  getAccount,
  getMint
} from '@solana/spl-token';
import { WalletInteraction, TokenTransaction, NFTTransaction } from '../types/analytics';
import { Metaplex } from "@metaplex-foundation/js";

// Define a union type for both browser and node crypto implementations
type CryptoImplementation = Crypto | typeof window.crypto;

// Define type for global crypto
declare global {
  interface Global {
    crypto: CryptoImplementation;
  }
}

// Use dynamic import for node:crypto
const getCrypto = async () => {
  if (typeof window === "undefined") {
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.webcrypto as CryptoImplementation;
  }
  return window.crypto;
};

// Initialize crypto
(async () => {
  if (typeof window === "undefined") {
    const cryptoImpl = await getCrypto();
    (global as { crypto: CryptoImplementation }).crypto = cryptoImpl;
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
  interactions: Map<string, WalletInteraction>
) => {
  if (!tx.meta?.postBalances || !tx.meta?.preBalances) return;

  const accounts = tx.transaction.message.accountKeys;
  const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

  // Find user wallet index
  const userWalletIndex = accounts.findIndex(account => account.pubkey.equals(userWallet));
  if (userWalletIndex === -1) return;

  // Calculate user's balance change
  const userPreBalance = tx.meta.preBalances[userWalletIndex];
  const userPostBalance = tx.meta.postBalances[userWalletIndex];
  const userBalanceChange = userPostBalance - userPreBalance;

  // Only process if there was an actual balance change
  if (userBalanceChange !== 0) {
    for (let index = 0; index < accounts.length; index++) {
      if (index === userWalletIndex) continue;
      
      const account = accounts[index];
      const address = account.pubkey.toBase58();
      
      // Skip program accounts and system program
      if (account.signer || account.pubkey.equals(SystemProgram.programId)) continue;

      const currentInteraction = interactions.get(address) || {
        address,
        totalSent: 0,
        totalReceived: 0,
        lastInteraction: timestamp,
        transactionCount: 0
      };

      // If user lost SOL, this account received it (minus fees)
      if (userBalanceChange < 0) {
        currentInteraction.totalReceived += Math.abs(userBalanceChange) / LAMPORTS_PER_SOL;
      }
      // If user gained SOL, this account sent it
      else {
        currentInteraction.totalSent += userBalanceChange / LAMPORTS_PER_SOL;
      }

      currentInteraction.transactionCount++;
      currentInteraction.lastInteraction = timestamp;
      interactions.set(address, currentInteraction);
    }
  }
};

export const processTokenTransactions = async (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  connection: Connection
): Promise<TokenTransaction[]> => {
  const tokenTxs: TokenTransaction[] = [];
  
  if (!tx.meta || !tx.meta.postTokenBalances || !tx.meta.preTokenBalances) return tokenTxs;

  const userWalletIndex = tx.transaction.message.accountKeys.findIndex(
    account => account.pubkey.equals(userWallet)
  );
  
  // Calculate SOL price from user wallet balance change
  const solChange = (tx.meta.postBalances[userWalletIndex] - tx.meta.preBalances[userWalletIndex]) / LAMPORTS_PER_SOL;

  for (const postBalance of tx.meta.postTokenBalances) {
    const preBalance = tx.meta.preTokenBalances.find(
      pre => pre.accountIndex === postBalance.accountIndex
    );

    if (!preBalance) continue;

    const balanceChange = Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
    if (balanceChange === 0) continue;

    try {
      const tokenAccount = await getAccount(connection, tx.transaction.message.accountKeys[postBalance.accountIndex].pubkey);
      
      // Only process if this token account belongs to the user
      if (!tokenAccount.owner.equals(userWallet)) continue;

      tokenTxs.push({
        tokenAddress: tokenAccount.mint.toBase58(),
        amount: Math.abs(balanceChange),
        type: balanceChange > 0 ? 'buy' : 'sell',
        price: Math.abs(solChange), // Use actual SOL change
        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now()
      });
    } catch (error) {
      console.error('Error processing token transaction:', error);
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

  const userWalletIndex = tx.transaction.message.accountKeys.findIndex(
    account => account.pubkey.equals(userWallet)
  );
  
  // Calculate actual SOL change for the user's wallet
  const solChange = (tx.meta.postBalances[userWalletIndex] - tx.meta.preBalances[userWalletIndex]) / LAMPORTS_PER_SOL;

  // Check if instruction exists and has programId before accessing it
  const isNFTTransaction = tx.transaction.message.instructions.some(
    ix => typeof ix === 'object' && 'programId' in ix && NFT_PROGRAM_IDS.includes(ix.programId.toString())
  );

  if (isNFTTransaction && solChange !== 0) {
    // Find NFT token accounts that changed
    const tokenChanges = tx.meta?.postTokenBalances?.filter(post => {
      const pre = tx.meta?.preTokenBalances?.find(p => p.accountIndex === post.accountIndex);
      return pre && Number(post.uiTokenAmount.amount) !== Number(pre.uiTokenAmount.amount);
    }) || [];

    for (const tokenBalance of tokenChanges) {
      try {
        const tokenAccount = await getAccount(connection, tx.transaction.message.accountKeys[tokenBalance.accountIndex].pubkey);
        
        // Only process if this token account belongs to the user
        if (!tokenAccount.owner.equals(userWallet)) continue;

        const mint = tokenAccount.mint;
        const mintInfo = await getMint(connection, mint);
        
        // Verify it's an NFT
        if (mintInfo.supply === BigInt(1)) {
          const metaplex = new Metaplex(connection);
          const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
          
          nftTxs.push({
            mint: mint.toBase58(),
            collectionName: nft.collection?.address.toString() || 'Unknown Collection',
            price: Math.abs(solChange),
            type: solChange < 0 ? 'buy' : 'sell',
            timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now()
          });
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