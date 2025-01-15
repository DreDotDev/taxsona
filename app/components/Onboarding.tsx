import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useWallet } from '@solana/wallet-adapter-react';

const REGIONS = {
  USA: [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  ],
  Canada: [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon'
  ]
};

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { publicKey } = useWallet();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<'USA' | 'Canada' | null>(null);
  const [region, setRegion] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([
          {
            country,
            region,
            annual_income: Number(annualIncome),
            wallet_address: publicKey?.toString(),
          },
        ]);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-dark-secondary p-8 rounded-xl max-w-md w-full mx-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Welcome to TaxSona
            </h2>
            <p className="text-gray-400">Select your country of residence:</p>
            <div className="grid grid-cols-2 gap-4">
              {['USA', 'Canada'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCountry(c as 'USA' | 'Canada');
                    setStep(2);
                  }}
                  className="p-4 rounded-lg border border-solana-purple/20 hover:border-solana-purple/40 transition-all"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && country && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Select your {country === 'USA' ? 'State' : 'Province'}
            </h2>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2 rounded bg-black/30 border border-solana-purple/20"
            >
              <option value="">Select...</option>
              {REGIONS[country].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={() => region && setStep(3)}
              disabled={!region}
              className="w-full p-2 rounded bg-gradient-to-r from-solana-purple to-solana-green disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Annual Income
            </h2>
            <input
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="Enter your annual income"
              className="w-full p-2 rounded bg-black/30 border border-solana-purple/20"
            />
            <button
              onClick={handleSubmit}
              disabled={!annualIncome}
              className="w-full p-2 rounded bg-gradient-to-r from-solana-purple to-solana-green disabled:opacity-50"
            >
              Complete Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}