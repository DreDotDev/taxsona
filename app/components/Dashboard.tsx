'use client';

import { useState } from 'react';
import { AnalyticsData } from '../types/analytics';
import TopWallets from '../components/dashboard/TopWallets';
import TokenActivity from '../components/dashboard/TokenActivity';
import NFTActivity from '../components/dashboard/NFTActivity';
import OverviewStats from '../components/dashboard/OverviewStats';

const Dashboard = ({ data }: { data: AnalyticsData }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {['overview', 'wallets', 'tokens', 'nfts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-solana-purple to-solana-green text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {activeTab === 'overview' && <OverviewStats data={data} />}
        {activeTab === 'wallets' && <TopWallets wallets={data.topWallets} />}
        {activeTab === 'tokens' && <TokenActivity transactions={data.tokenTransactions} />}
        {activeTab === 'nfts' && <NFTActivity transactions={data.nftTransactions} />}
      </div>
    </div>
  );
};

export default Dashboard; 