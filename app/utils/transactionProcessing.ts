import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletInteraction, TokenTransaction, NFTTransaction } from '../types/analytics';

const NFT_PROGRAM_IDS = [
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metaplex
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98'  // Metaplex Auction
];

export const processWalletInteractions = (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  interactions: Map<string, WalletInteraction>
) => {
  if (!tx.meta?.postBalances || !tx.meta?.preBalances) return;

  const accounts = tx.transaction.message.accountKeys;
  const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

  accounts.forEach((account, index) => {
    if (account.pubkey.equals(userWallet)) return;

    const address = account.pubkey.toBase58();
    const currentInteraction = interactions.get(address) || {
      address,
      totalSent: 0,
      totalReceived: 0,
      lastInteraction: timestamp,
      transactionCount: 0
    };

    const balanceChange = (tx.meta!.postBalances[index] - tx.meta!.preBalances[index]) / 1e9;
    if (balanceChange > 0) {
      currentInteraction.totalReceived += balanceChange;
    } else if (balanceChange < 0) {
      currentInteraction.totalSent += Math.abs(balanceChange);
    }

    currentInteraction.transactionCount++;
    currentInteraction.lastInteraction = timestamp;
    interactions.set(address, currentInteraction);
  });
};

export const processTokenTransactions = (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  transactions: TokenTransaction[]
) => {
  if (!tx.meta?.innerInstructions || !tx.blockTime) return;

  const tokenTransfers = tx.meta.innerInstructions.flatMap(ix => 
    ix.instructions.filter(instruction => 
      'programId' in instruction && 
      instruction.programId.equals(TOKEN_PROGRAM_ID) &&
      'parsed' in instruction &&
      instruction.parsed.type === 'transfer'
    )
  );

  tokenTransfers.forEach(transfer => {
    if (!('parsed' in transfer)) return;
    const { info } = transfer.parsed;
    const isReceiving = info.destination === userWallet.toBase58();
    
    transactions.push({
      tokenAddress: info.mint,
      amount: Number(info.amount) / 1e9,
      type: isReceiving ? 'buy' : 'sell',
      timestamp: tx.blockTime || 0
    });
  });
};

export const processNFTTransactions = (
  tx: ParsedTransactionWithMeta,
  userWallet: PublicKey,
  transactions: NFTTransaction[]
) => {
  if (!tx.meta?.innerInstructions || !tx.blockTime) return;

  const nftInstructions = tx.meta.innerInstructions.filter(ix => 
    ix.instructions.some(instruction => 
      'programId' in instruction && 
      NFT_PROGRAM_IDS.includes(instruction.programId.toBase58())
    )
  );

  // Process NFT instructions (simplified version)
  nftInstructions.forEach(ix => {
    const solTransfer = ix.instructions.find(instruction => 
      'parsed' in instruction && 
      instruction.parsed.type === 'transfer' &&
      instruction.programId.equals(TOKEN_PROGRAM_ID)
    );

    if (solTransfer && 'parsed' in solTransfer) {
      const price = Number(solTransfer.parsed.info.amount) / 1e9;
      const isReceiving = solTransfer.parsed.info.destination === userWallet.toBase58();

      transactions.push({
        mint: solTransfer.parsed.info.mint,
        price,
        type: isReceiving ? 'buy' : 'sell',
        timestamp: tx.blockTime || 0
      });
    }
  });
};

export const calculateTotalVolume = (
  tokenTxs: TokenTransaction[],
  nftTxs: NFTTransaction[]
): number => {
  const tokenVolume = tokenTxs.reduce((sum, tx) => sum + (tx.price || 0), 0);
  const nftVolume = nftTxs.reduce((sum, tx) => sum + tx.price, 0);
  return tokenVolume + nftVolume;
}; 