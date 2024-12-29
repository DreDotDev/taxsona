"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { 
	LAMPORTS_PER_SOL, 
	ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { 
	AnalyticsData, 
	WalletInteraction, 
	TokenTransaction, 
	NFTTransaction,
	TransactionDetail 
} from "../types/analytics";
import Dashboard from "./Dashboard";
import { 
	processWalletInteractions, 
	processTokenTransactions, 
	processNFTTransactions, 
	calculateTotalVolume,
	NFT_PROGRAM_IDS 
} from "../utils/transactionProcessing";

const determineTransactionType = (tx: ParsedTransactionWithMeta): string => {
	const programs = tx.transaction.message.instructions.map((ix) => 
		'programId' in ix ? ix.programId.toString() : ''
	);
	if (programs.includes(TOKEN_PROGRAM_ID.toString())) return 'Token Transfer';
	if (programs.some((p: string) => NFT_PROGRAM_IDS.includes(p))) return 'NFT Transaction';
	return 'SOL Transfer';
};

const TransactionAnalytics = () => {
	const { publicKey, connected } = useWallet();
	const { connection } = useConnection();
	const [loading, setLoading] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

	// Monitor wallet connection status
	useEffect(() => {
		if (connected && publicKey) {
			console.log("Wallet connected:", publicKey.toBase58());
		}
	}, [connected, publicKey]);

	// Monitor connection status
	useEffect(() => {
		if (connection) {
			connection.getVersion()
				.then(version => {
					console.log("Connected to Solana network:", version);
				})
				.catch(err => {
					console.error("Failed to connect to Solana:", err);
				});
		}
	}, [connection]);

	const analyzeTransactions = async () => {
		if (!publicKey || !connection) {
			console.error("No wallet connected or connection not established");
			return;
		}

		setLoading(true);
		try {
			console.log("Starting analysis for wallet:", publicKey.toBase58());
			
			const signatures = await connection.getSignaturesForAddress(publicKey, {
				limit: 1000,
			});

			console.log("Fetched signatures:", signatures.length);

			const walletInteractions = new Map<string, WalletInteraction>();
			const tokenTxs: TokenTransaction[] = [];
			const nftTxs: NFTTransaction[] = [];
			let totalProfit = 0;
			let totalLoss = 0;
			const transactionDetails: TransactionDetail[] = [];

			// Process transactions in smaller batches
			for (let i = 0; i < signatures.length; i += 5) {
				const batch = signatures.slice(i, i + 5);
				
				await Promise.all(
					batch.map(async (sig) => {
						try {
							const tx = await connection.getParsedTransaction(sig.signature, {
								maxSupportedTransactionVersion: 0,
							});

							if (!tx || !tx.meta) return;

							// Process wallet interactions
							await processWalletInteractions(tx, publicKey, walletInteractions, connection);

							// Process token transactions
							const tokenTransactions = await processTokenTransactions(tx, publicKey, connection);
							tokenTxs.push(...tokenTransactions);

							// Process NFT transactions
							const nftTransactions = await processNFTTransactions(tx, publicKey, connection);
							nftTxs.push(...nftTransactions);

							// Calculate balance changes
							const accountIndex = tx.transaction.message.accountKeys.findIndex(
								(key) => key.pubkey.equals(publicKey)
							);

							if (accountIndex >= 0) {
								const balanceChange = 
									(tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex]) / 
									LAMPORTS_PER_SOL;

								if (balanceChange > 0) {
									totalProfit += balanceChange;
								} else {
									totalLoss += Math.abs(balanceChange);
								}

								transactionDetails.push({
									signature: sig.signature,
									timestamp: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()),
									balanceChange,
									postBalance: tx.meta.postBalances[accountIndex] / LAMPORTS_PER_SOL,
									type: determineTransactionType(tx)
								});
							}
						} catch (txError) {
							console.error("Error processing transaction:", sig.signature, txError);
						}
					})
				);

				// Add a small delay between batches to avoid rate limiting
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			setAnalyticsData({
				stats: {
					totalProfit,
					totalLoss,
					netBalance: totalProfit - totalLoss,
				},
				topWallets: Array.from(walletInteractions.values())
					.sort((a, b) => b.totalSent - a.totalSent)
					.slice(0, 10),
				tokenTransactions: tokenTxs,
				nftTransactions: nftTxs,
				totalVolume: calculateTotalVolume(tokenTxs, nftTxs),
				uniqueWallets: walletInteractions.size,
				transactionLog: transactionDetails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			});
		} catch (error) {
			console.error("Analysis failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-lg p-4 sm:p-6 w-full max-w-full">
			<button 
				onClick={analyzeTransactions} 
				disabled={!publicKey || loading} 
				className="w-full mb-4 sm:mb-6 py-2 sm:py-3 rounded-xl font-mono text-sm sm:text-base bg-gradient-to-r from-solana-purple to-solana-green disabled:opacity-50"
			>
				{loading ? "Analyzing..." : "Analyze Transactions"}
			</button>
			
			{loading && (
				<div className="text-center py-4">
					<p className="text-sm text-gray-400">Analyzing your transactions...</p>
				</div>
			)}

			{!loading && analyticsData && (
				<div className="w-full overflow-x-auto">
					<Dashboard data={analyticsData} />
				</div>
			)}
		</div>
	);
};

export default TransactionAnalytics;
