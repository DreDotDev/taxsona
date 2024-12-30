"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { LAMPORTS_PER_SOL, ParsedTransactionWithMeta } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnalyticsData, WalletInteraction, TokenTransaction, NFTTransaction, TransactionDetail } from "../types/analytics";
import Dashboard from "./Dashboard";
import { processWalletInteractions, processTokenTransactions, processNFTTransactions, calculateTotalVolume, NFT_PROGRAM_IDS } from "../utils/transactionProcessing";
import LoadingAnimation from "./LoadingAnimation";

const determineTransactionType = (tx: ParsedTransactionWithMeta): string => {
	const programs = tx.transaction.message.instructions.map((ix) => ("programId" in ix ? ix.programId.toString() : ""));
	if (programs.includes(TOKEN_PROGRAM_ID.toString())) return "Token Transfer";
	if (programs.some((p: string) => NFT_PROGRAM_IDS.includes(p))) return "NFT Transaction";
	return "SOL Transfer";
};

const TransactionAnalytics = () => {
	const { publicKey, connected } = useWallet();
	const { connection } = useConnection();
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

	useEffect(() => {
		if (connected && publicKey) {
			console.log("Wallet connected:", publicKey.toBase58());
		}
	}, [connected, publicKey]);

	useEffect(() => {
		if (connection) {
			connection
				.getVersion()
				.then((version) => console.log("Connected to Solana network:", version))
				.catch((err) => console.error("Failed to connect to Solana:", err));
		}
	}, [connection]);

	const analyzeTransactions = async () => {
		if (!publicKey || !connection) {
			console.error("No wallet connected or connection not established");
			return;
		}

		setLoading(true);
		setProgress(0);

		try {
			console.log("Starting analysis for wallet:", publicKey.toBase58());

			let allSignatures: any[] = [];
			let lastSignature = null;
			const oneYearAgo = new Date();
			oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

			// Keep fetching until we either:
			// 1. Get transactions older than a year
			// 2. Run out of transactions to fetch
			while (true) {
				const options: any = {
					limit: 1000,
				};
				
				if (lastSignature) {
					options.before = lastSignature;
				}

				const signatures = await connection.getSignaturesForAddress(publicKey, options);
				
				if (signatures.length === 0) break;

				// Check if we've reached transactions older than a year
				const oldestTxTime = signatures[signatures.length - 1].blockTime;
				if (oldestTxTime && oldestTxTime * 1000 < oneYearAgo.getTime()) {
					// Filter out transactions older than a year
					const recentSignatures = signatures.filter(sig => 
						sig.blockTime && sig.blockTime * 1000 >= oneYearAgo.getTime()
					);
					allSignatures.push(...recentSignatures);
					break;
				}

				allSignatures.push(...signatures);
				lastSignature = signatures[signatures.length - 1].signature;

				// Add a small delay to avoid rate limiting
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			console.log("Fetched total signatures:", allSignatures.length);

			const walletInteractions = new Map<string, WalletInteraction>();
			const tokenTxs: TokenTransaction[] = [];
			const nftTxs: NFTTransaction[] = [];
			const transactionDetails: TransactionDetail[] = [];
			let totalProfit = 0;
			let totalLoss = 0;

			const progressIncrement = 100 / allSignatures.length;
			let processedCount = 0;

			// Process transactions in batches of 5
			for (let i = 0; i < allSignatures.length; i += 5) {
				const batch = allSignatures.slice(i, i + 5);

				await Promise.all(
					batch.map(async (sig) => {
						try {
							const tx = await connection.getParsedTransaction(sig.signature, {
								maxSupportedTransactionVersion: 0,
							});

							if (!tx || !tx.meta) return;

							// Process wallet interactions
							await processWalletInteractions(tx, publicKey, walletInteractions);

							// Process token transactions
							const tokenTransactions = await processTokenTransactions(tx, publicKey, connection);
							tokenTxs.push(...tokenTransactions.map(tx => ({
								...tx,
								mint: tx.mint || 'Unknown Token'
							})));

							// Process NFT transactions
							const nftTransactions = await processNFTTransactions(tx, publicKey, connection);
							nftTxs.push(...nftTransactions);

							// Calculate balance changes
							const accountIndex = tx.transaction.message.accountKeys.findIndex((key) => key.pubkey.equals(publicKey));

							if (accountIndex >= 0) {
								// For token transfers, we should only consider the token transaction calculations
								// not the SOL balance change (which would double count)
								let balanceChangeInSol = 0;
								
								if (determineTransactionType(tx) === "Token Transfer") {
									// Only use token changes for token transfers
									const tokenChange = tokenTransactions.reduce((sum, tx) => {
										const change = tx.type === 'buy' ? -Math.abs(tx.price || 0) : Math.abs(tx.price || 0);
										return sum + (change * LAMPORTS_PER_SOL);
									}, 0);
									balanceChangeInSol = tokenChange / LAMPORTS_PER_SOL;
								} else if (determineTransactionType(tx) === "NFT Transaction") {
									// Only use NFT changes for NFT transactions
									const nftChange = nftTransactions.reduce((sum, tx) => {
										const change = tx.type === 'buy' ? -Math.abs(tx.price) : Math.abs(tx.price);
										return sum + (change * LAMPORTS_PER_SOL);
									}, 0);
									balanceChangeInSol = nftChange / LAMPORTS_PER_SOL;
								} else {
									// For regular SOL transfers, use the direct balance change
									const solBalanceChange = (tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex]);
									balanceChangeInSol = solBalanceChange / LAMPORTS_PER_SOL;
								}

								// Update totals based on the transaction type
								if (balanceChangeInSol > 0) {
									totalProfit += balanceChangeInSol;
								} else if (balanceChangeInSol < 0) {
									totalLoss += Math.abs(balanceChangeInSol);
								}

								// Add transaction to details log
								transactionDetails.push({
									signature: sig.signature,
									timestamp: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()),
									balanceChange: balanceChangeInSol,
									postBalance: tx.meta.postBalances[accountIndex] / LAMPORTS_PER_SOL,
									type: determineTransactionType(tx),
								});
							}

							processedCount++;
							setProgress(processedCount * progressIncrement);
						} catch (txError) {
							console.error("Error processing transaction:", sig.signature, txError);
						}
					})
				);

				// Add a small delay between batches to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			const totalVolume = calculateTotalVolume(tokenTxs, nftTxs);
			console.log("Volume breakdown:", {
				tokenVolume: tokenTxs.reduce((sum, tx) => sum + (tx.price || 0), 0),
				nftVolume: nftTxs.reduce((sum, tx) => sum + tx.price, 0),
				totalVolume,
			});

			setAnalyticsData({
				stats: {
				  realizedPnL: totalProfit - totalLoss,
				  totalProfit,
				  totalLoss,
				  netBalance: totalProfit - totalLoss
				},
				topWallets: Array.from(walletInteractions.values())
					.sort((a, b) => b.totalSent - a.totalSent)
					.slice(0, 10),
				tokenTransactions: tokenTxs.map(tx => ({
					...tx,
					tokenSymbol: tx.mint || 'SOL',
					txHash: tx.signature
				})),
				nftTransactions: nftTxs,
				totalVolume,
				uniqueWallets: walletInteractions.size,
				transactionLog: transactionDetails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
				walletAddress: publicKey.toBase58()
			});
		} catch (error) {
			console.error("Analysis failed:", error);
		} finally {
			setLoading(false);
			setProgress(0);
		}
	};

	return (
		<div className="rounded-lg bg-dark-secondary dark:bg-dark-secondary p-4 shadow-lg">
			<button onClick={analyzeTransactions} disabled={!publicKey || loading} className="w-full mb-4 sm:mb-6 py-2 sm:py-3 rounded-xl font-mono text-sm sm:text-base bg-gradient-to-r from-solana-purple to-solana-green disabled:opacity-50">
				{loading ? "Analyzing..." : "Analyze Transactions"}
			</button>

			{loading && <LoadingAnimation progress={progress} />}

			{!loading && analyticsData && (
				<div className="w-full overflow-x-auto">
					<Dashboard data={analyticsData} />
				</div>
			)}
		</div>
	);
};

export default TransactionAnalytics;
