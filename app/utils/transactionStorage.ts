import { supabase } from './supabase';
import { TransactionDetail, AnalyticsData } from '../types/analytics';

export async function storeTransactionHistory(
  walletAddress: string,
  transactions: TransactionDetail[],
  analyticsData: AnalyticsData
) {
  try {
    // Store the transaction batch
    const { error: txError } = await supabase
      .from('transaction_history')
      .insert({
        wallet_address: walletAddress,
        transaction_data: {
          transactions,
          analytics: {
            totalVolume: analyticsData.totalVolume,
            stats: analyticsData.stats,
            tokenTransactions: analyticsData.tokenTransactions,
            nftTransactions: analyticsData.nftTransactions,
          }
        }
      });

    if (txError) throw txError;

    return true;
  } catch (error) {
    console.error('Error storing transaction history:', error);
    throw error;
  }
}

export async function getStoredTransactionHistory(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_history')
      .select('transaction_data')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.transaction_data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return null;
  }
} 