import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';

// NOTE: this now shows the customer's real (currently always-empty) wallet
// balance instead of a hardcoded 200.00 fake number. GET /payments/wallet
// and GET /payments/transactions are scoped to req.user._id, so they work
// for any role -- but nothing in the app currently credits a customer's
// wallet (only rider/wholesaler payouts write Transactions today), so this
// will read 0 until that becomes an actual product feature (e.g. refunds or
// referral credit). "Add Money" was removed rather than left as a dead
// button -- there's no deposit endpoint for customers on the backend yet.
export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
          api.get('/payments/wallet'),
          api.get('/payments/transactions'),
        ]);
        setBalance(walletRes.data?.balance || 0);
        setTransactions(txRes.data || []);
      } catch (err) {
        console.warn('Wallet fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        {loading ? (
          <ActivityIndicator color={Colors.white} style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.balanceAmount}>Rs. {balance.toFixed(2)}</Text>
        )}
      </View>
      <Text style={styles.historyTitle}>Transaction History</Text>
      {!loading && transactions.length === 0 && (
        <Text style={styles.empty}>No recent transactions</Text>
      )}
      {transactions.map((tx) => (
        <View key={tx._id} style={styles.txRow}>
          <Text style={styles.txLabel}>{tx.description || tx.type}</Text>
          <Text style={[styles.txAmount, tx.type === 'debit' && styles.txDebit]}>
            {tx.type === 'debit' ? '-' : '+'}Rs. {Number(tx.amount).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  balanceLabel: { color: Colors.white, fontSize: 16 },
  balanceAmount: { color: Colors.white, fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  empty: { color: Colors.gray, textAlign: 'center', marginTop: 20 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.lightGray },
  txLabel: { color: Colors.black },
  txAmount: { fontWeight: '700', color: Colors.success },
  txDebit: { color: Colors.error },
});
