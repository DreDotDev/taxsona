"use client";

import { useState } from "react";
import { AnalyticsData } from "../types/analytics";
import TopWallets from "./dashboard/TopWallets";
import TokenActivity from "./dashboard/TokenActivity";
import NFTActivity from "./dashboard/NFTActivity";
import OverviewStats from "./dashboard/OverviewStats";
import TransactionLog from "./dashboard/TransactionLog";
import { PDFDownloadLink } from "@react-pdf/renderer";
import TransactionReport from "./reports/TransactionReport";

const Dashboard = ({ data }: { data: AnalyticsData }) => {
	const [activeTab, setActiveTab] = useState("overview");

	const tabs = [
		{ id: "overview", label: "Overview", icon: "📊" },
		{ id: "wallets", label: "Wallets", icon: "👥" },
		{ id: "tokens", label: "Tokens", icon: "🔄" },
		{ id: "nfts", label: "NFTs", icon: "🖼️" },
		{ id: "transactions", label: "Transactions", icon: "📝" },
	];

	return (
		<div className="min-h-screen bg-dark-DEFAULT dark:bg-dark-DEFAULT space-y-6">
			<div className="flex overflow-x-auto scrollbar-hide">
				<div className="flex space-x-2 p-1 bg-black/20 backdrop-blur-xl rounded-lg border border-solana-purple/20">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`
                px-4 py-2 rounded-lg font-mono text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id ? "bg-gradient-to-r from-solana-purple to-solana-green text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}
              `}
						>
							<span className="mr-2">{tab.icon}</span>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			<div className="space-y-6">
				<div className={`${activeTab === "overview" ? "block" : "hidden"}`}>
					<OverviewStats data={data} />
				</div>
				<div className={`${activeTab === "wallets" ? "block" : "hidden"}`}>
					<TopWallets wallets={data.topWallets} />
				</div>
				<div className={`${activeTab === "tokens" ? "block" : "hidden"}`}>
					<TokenActivity transactions={data.tokenTransactions} />
				</div>
				<div className={`${activeTab === "nfts" ? "block" : "hidden"}`}>
					<NFTActivity transactions={data.nftTransactions} />
				</div>
				<div className={`${activeTab === "transactions" ? "block" : "hidden"}`}>
					<TransactionLog transactions={data.transactionLog} />
				</div>
			</div>

			<div className="flex justify-end">
				<PDFDownloadLink 
					document={<TransactionReport data={data} />} 
					fileName={`transaction-report-${data.walletAddress.slice(0, 8)}.pdf`} 
					className="px-4 py-2 rounded-lg font-mono text-sm bg-black/20 hover:bg-black/30 border border-solana-purple/10 hover:border-solana-purple/30 transition-all"
				>
					<span>Export PDF Report</span>
				</PDFDownloadLink>
			</div>
		</div>
	);
};

export default Dashboard;
