"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getQuickNodeConnection, getTransactionHistory } from "../utils/quicknode";
import { AnalyticsData, WalletInteraction, TokenTransaction, NFTTransaction } from "../types/analytics";
import Dashboard from "./Dashboard";
import { processWalletInteractions, processTokenTransactions, processNFTTransactions, calculateTotalVolume } from "../utils/transactionProcessing";

const TransactionAnalytics = () => {
	const { publicKey, connected } = useWallet();
	const connection = getQuickNodeConnection();
	const [loading, setLoading] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

	const analyzeTransactions = async () => {
		if (!publicKey) return;

		setLoading(true);
		try {
			const signatures = await getTransactionHistory(publicKey.toBase58());
			const walletInteractions = new Map<string, WalletInteraction>();
			const tokenTxs: TokenTransaction[] = [];
			const nftTxs: NFTTransaction[] = [];
			let totalProfit = 0;
			let totalLoss = 0;

			for (const sig of signatures) {
				const tx = await connection.getParsedTransaction(sig.signature);
				if (!tx?.meta) continue;

				// Process wallet interactions
				processWalletInteractions(tx, publicKey, walletInteractions);

				// Process token transactions
				processTokenTransactions(tx, publicKey, tokenTxs);

				// Process NFT transactions
				processNFTTransactions(tx, publicKey, nftTxs);

				// Calculate profit/loss from SOL transfers
				if (tx.meta.postBalances && tx.meta.preBalances) {
					const index = tx.transaction.message.accountKeys.findIndex((key) => key.pubkey.equals(publicKey));
					if (index !== -1) {
						const balanceChange = (tx.meta.postBalances[index] - tx.meta.preBalances[index]) / LAMPORTS_PER_SOL;
						if (balanceChange > 0) {
							totalProfit += balanceChange;
						} else if (balanceChange < 0) {
							totalLoss += Math.abs(balanceChange);
						}
					}
				}
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
			});
		} catch (error) {
			console.error("Analysis failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-lg p-4 sm:p-6 w-full max-w-full overflow-hidden">
			<button onClick={analyzeTransactions} disabled={!publicKey || loading} className="w-full mb-4 sm:mb-6 py-2 sm:py-3 rounded-xl font-mono text-sm sm:text-base bg-gradient-to-r from-solana-purple to-solana-green">
				{loading ? "Analyzing..." : "Analyze Transactions"}
			</button>

			{analyticsData && <Dashboard data={analyticsData} />}
		</div>
	);
};

export default TransactionAnalytics;
