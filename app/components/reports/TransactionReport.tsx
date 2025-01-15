import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AnalyticsData, TransactionDetail } from '../../types/analytics';
import { calculateTaxEstimate } from '../../utils/gpt';
import { supabase } from '../../utils/supabase';
import { useEffect, useState } from 'react';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '50%',
    padding: 10,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    marginTop: 5,
  },
  transactionTitle: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 20,
  },
  transaction: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  txDate: {
    width: '25%',
  },
  txType: {
    width: '25%',
  },
  txAmount: {
    width: '25%',
  },
  txSignature: {
    width: '25%',
    fontSize: 8,
  },
  taxSection: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  taxTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  taxContent: {
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  }
});

const TransactionReport = ({ data }: { data: AnalyticsData }) => {
  const [taxEstimate, setTaxEstimate] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaxEstimate = async () => {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select()
          .eq('wallet_address', data.walletAddress)
          .single();

        if (!profile) {
          console.error('User profile not found');
          return;
        }

        // Get tax estimate
        const estimate = await calculateTaxEstimate(
          data.transactionLog,
          {
            country: profile.country,
            region: profile.region,
            annual_income: profile.annual_income
          }
        );

        setTaxEstimate(estimate);
      } catch (error) {
        console.error('Error generating tax estimate:', error);
      }
    };

    fetchTaxEstimate();
  }, [data.walletAddress]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction Report</Text>
          <Text>Wallet: {data.walletAddress}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Volume</Text>
            <Text style={styles.statValue}>{data.totalVolume.toFixed(2)} SOL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Net P/L</Text>
            <Text style={styles.statValue}>{data.stats.realizedPnL.toFixed(4)} SOL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Profit</Text>
            <Text style={styles.statValue}>{data.stats.totalProfit.toFixed(4)} SOL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Loss</Text>
            <Text style={styles.statValue}>{data.stats.totalLoss.toFixed(4)} SOL</Text>
          </View>
        </View>

        <Text style={styles.transactionTitle}>Transaction History</Text>
        {data.transactionLog.map((tx: TransactionDetail) => (
          <View style={styles.transaction} key={tx.signature}>
            <Text style={styles.txDate}>
              {tx.timestamp.toLocaleDateString()}
            </Text>
            <Text style={styles.txType}>{tx.type}</Text>
            <Text style={styles.txAmount}>
              {tx.balanceChange.toFixed(4)} SOL
            </Text>
            <Text style={styles.txSignature}>
              {tx.signature.slice(0, 8)}...
            </Text>
          </View>
        ))}

        <View style={styles.taxSection}>
          <Text style={styles.taxTitle}>Tax Estimation Report</Text>
          {taxEstimate ? (
            <>
              <Text style={styles.taxContent}>
                {taxEstimate}
              </Text>
              <Text style={styles.disclaimer}>
                Disclaimer: This tax estimation is provided for informational purposes only and should not be considered as professional tax advice. Please consult with a qualified tax professional for accurate tax calculations and filing requirements.
              </Text>
            </>
          ) : (
            <Text style={styles.taxContent}>
              Tax estimation could not be generated. Please ensure your profile information is complete and try again.
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default TransactionReport;