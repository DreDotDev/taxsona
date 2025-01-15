import { useState } from 'react';
import { calculateTaxEstimate } from '../../utils/gpt';
import { AnalyticsData } from '../../types/analytics';
import { supabase } from '../../utils/supabase';

export default function TaxEstimate({ 
  data,
  walletAddress 
}: { 
  data: AnalyticsData;
  walletAddress: string;
}) {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<string | null>(null);

  const generateEstimate = async () => {
    setLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select()
        .eq('wallet_address', walletAddress)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get tax estimate from GPT
      const taxEstimate = await calculateTaxEstimate(
        data.transactionLog,
        {
          country: profile.country,
          region: profile.region,
          annual_income: profile.annual_income
        }
      );

      setEstimate(taxEstimate);
    } catch (error) {
      console.error('Error generating tax estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-secondary shadow-lg backdrop-blur-xl bg-black/30 rounded-xl p-6 border border-solana-purple/20">
      <h2 className="text-xl font-bold mb-6 font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
        Tax Estimate
      </h2>
      
      {!estimate ? (
        <button
          onClick={generateEstimate}
          disabled={loading}
          className="w-full p-2 rounded bg-gradient-to-r from-solana-purple to-solana-green disabled:opacity-50"
        >
          {loading ? 'Generating Estimate...' : 'Generate Tax Estimate'}
        </button>
      ) : (
        <div className="space-y-4 whitespace-pre-wrap font-mono text-sm text-gray-300">
          {estimate}
        </div>
      )}
    </div>
  );
} 