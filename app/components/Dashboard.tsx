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
    <div className="space-y-4 sm:space-y-6 min-w-full">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-4 pb-2">
        {['overview', 'wallets', 'tokens', 'nfts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none min-w-[80px] px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-r from-solana-purple to-solana-green text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-w-full">
        <div className={`${activeTab === 'overview' ? 'block' : 'hidden'}`}>
          <OverviewStats data={data} />
        </div>
        <div className={`${activeTab === 'wallets' ? 'block' : 'hidden'}`}>
          <TopWallets wallets={data.topWallets} />
        </div>
        <div className={`${activeTab === 'tokens' ? 'block' : 'hidden'}`}>
          <TokenActivity transactions={data.tokenTransactions} />
        </div>
        <div className={`${activeTab === 'nfts' ? 'block' : 'hidden'}`}>
          <NFTActivity transactions={data.nftTransactions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 