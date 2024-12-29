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
			console.error("No wallet connected:", { 
				walletConnected: !!connected,
				hasPublicKey: !!publicKey,
				hasConnection: !!connection 
			});
			return;
		}

		setLoading(true);
		try {
			console.log("Starting analysis for wallet:", publicKey.toBase58());
			
			// Verify connection is still active
			const version = await connection.getVersion();
			console.log("Connection verified:", version);

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

			// Process transactions in batches of 10 to avoid rate limiting
			for (let i = 0; i < signatures.length; i += 10) {
				const batch = signatures.slice(i, i + 10);
				await Promise.all(
					batch.map(async (sig) => {
						try {
							const tx = await connection.getParsedTransaction(sig.signature, {
								maxSupportedTransactionVersion: 0,
							});

							if (!tx?.meta) return;

							processWalletInteractions(tx, publicKey, walletInteractions);
							processTokenTransactions(tx, publicKey, tokenTxs);
							processNFTTransactions(tx, publicKey, nftTxs);

							const index = tx.transaction.message.accountKeys.findIndex(
								(key) => key.pubkey.equals(publicKey)
							);

							if (index !== -1 && tx.meta.postBalances && tx.meta.preBalances) {
								const balanceChange = (tx.meta.postBalances[index] - tx.meta.preBalances[index]) / LAMPORTS_PER_SOL;
								if (balanceChange > 0) {
									totalProfit += balanceChange;
								} else if (balanceChange < 0) {
									totalLoss += Math.abs(balanceChange);
								}

								transactionDetails.push({
									signature: sig.signature,
									timestamp: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()),
									balanceChange,
									postBalance: tx.meta.postBalances[index] / LAMPORTS_PER_SOL,
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

			console.log("Processed transactions:", transactionDetails.length);

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
				transactionLog: transactionDetails
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
