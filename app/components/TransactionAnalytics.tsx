"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { LAMPORTS_PER_SOL, ParsedTransactionWithMeta } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getQuickNodeConnection, getTransactionHistory } from "../utils/quicknode";
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
	const programs = tx.transaction.message.instructions.map((ix: any) => ix.programId.toString());
	if (programs.includes(TOKEN_PROGRAM_ID.toString())) return 'Token Transfer';
	if (programs.some((p: string) => NFT_PROGRAM_IDS.includes(p))) return 'NFT Transaction';
	return 'SOL Transfer';
};

const TransactionAnalytics = () => {
	const { publicKey } = useWallet();
	const connection = getQuickNodeConnection();
	const [loading, setLoading] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  

	const analyzeTransactions = async () => {
		if (!publicKey) return;

		setLoading(true);
		try {
			const signatures = await getTransactionHistory(publicKey.toBase58());
			console.log("Fetched signatures:", signatures.length); // Debug log

			const walletInteractions = new Map<string, WalletInteraction>();
			const tokenTxs: TokenTransaction[] = [];
			const nftTxs: NFTTransaction[] = [];
			let totalProfit = 0;
			let totalLoss = 0;
			const transactionDetails: TransactionDetail[] = [];

			for (const sig of signatures) {
				try {
					const tx = await connection.getParsedTransaction(sig.signature, {
						maxSupportedTransactionVersion: 0,
					});
					
					if (!tx?.meta) {
						console.log("Skipping transaction - no metadata:", sig.signature);
						continue;
					}

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
					continue;
				}
			}

			console.log("Processed transactions:", transactionDetails.length); // Debug log

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
