import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AnalyticsData, TransactionDetail } from '../../types/analytics';

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
});

const TransactionReport = ({ data }: { data: AnalyticsData }) => (
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
    </Page>
  </Document>
);

export default TransactionReport;