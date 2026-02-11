import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../config/api';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface WalletData {
  balance: number;
  total_spent: number;
  pending_payments: number;
  this_month_spent: number;
}

interface Transaction {
  id: number;
  amount: string;
  payment_method: string;
  status: string;
  transaction_id: string;
  created_at: string;
  service_request_id: number;
  metadata?: {
    type?: string;
    lab_test_request_id?: number;
    lab_facility_id?: number;
    collection_fee?: number;
  };
}

export default function WalletScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpPhone, setTopUpPhone] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const [walletRes, txnRes] = await Promise.all([
        apiClient.get('/patients/wallet'),
        apiClient.get('/patients/wallet/transactions'),
      ]);
      if (walletRes.data.success) {
        setWallet(walletRes.data.data);
      }
      if (txnRes.data.success) {
        setTransactions(txnRes.data.data?.data || []);
      }
    } catch (error) {
      console.error('Load wallet error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useRealtimeRefresh(loadWallet, {
    events: ['payment.processed', 'service.completed', 'lab_request.created'],
    intervalMs: 30000,
    enabled: true,
  });

  const handleRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum top-up is KES 100');
      return;
    }
    if (!topUpPhone || topUpPhone.length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid M-Pesa phone number');
      return;
    }

    setTopUpLoading(true);
    try {
      let formattedPhone = topUpPhone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const res = await apiClient.post('/patients/wallet/top-up', {
        amount,
        method: 'mpesa',
        phone_number: formattedPhone,
      });

      if (res.data.success) {
        Alert.alert('Success', `Wallet topped up with KES ${amount.toLocaleString()}`);
        setShowTopUpModal(false);
        setTopUpAmount('');
        setTopUpPhone('');
        loadWallet();
      } else {
        Alert.alert('Failed', res.data.message || 'Top-up failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'pending': case 'pending_confirmation': return COLORS.warning;
      case 'processing': return COLORS.primary;
      case 'failed': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'pending_confirmation': return 'Awaiting Confirmation';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const getMethodIcon = (method: string): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'wallet': return 'wallet';
      case 'mpesa': return 'phone-portrait';
      case 'cash': return 'cash';
      default: return 'card';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            KES {(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <TouchableOpacity style={styles.topUpButton} onPress={() => setShowTopUpModal(true)}>
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trending-down" size={24} color={COLORS.error} />
            <Text style={styles.statAmount}>
              KES {(wallet?.this_month_spent ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={styles.statAmount}>
              KES {(wallet?.pending_payments ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
            <Text style={styles.statAmount}>
              KES {(wallet?.total_spent ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Your payment history will appear here</Text>
          </View>
        ) : (
          transactions.map((txn) => (
            <View key={txn.id} style={styles.txnCard}>
              <View style={styles.txnIconWrap}>
                <Ionicons name={getMethodIcon(txn.payment_method)} size={20} color={COLORS.white} />
              </View>
              <View style={styles.txnDetails}>
                <Text style={styles.txnTitle}>
                  {txn.metadata?.type === 'lab_test_payment' ? 'Lab Test Payment' :
                   txn.payment_method === 'wallet' ? 'Wallet Payment' :
                   txn.payment_method === 'mpesa' ? 'M-Pesa Payment' :
                   txn.payment_method === 'cash' ? 'Cash Payment' : 'Payment'}
                </Text>
                <Text style={styles.txnRef}>{txn.transaction_id}</Text>
                <Text style={styles.txnDate}>
                  {new Date(txn.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={styles.txnAmount}>-KES {parseFloat(txn.amount).toLocaleString()}</Text>
                <View style={[styles.txnStatusBadge, { backgroundColor: getStatusColor(txn.status) + '20' }]}>
                  <Text style={[styles.txnStatusText, { color: getStatusColor(txn.status) }]}>
                    {getStatusLabel(txn.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Top-Up Modal */}
      <Modal visible={showTopUpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount (KES)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1000"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
            />

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountBtn, topUpAmount === String(amt) && styles.quickAmountBtnActive]}
                  onPress={() => setTopUpAmount(String(amt))}
                >
                  <Text style={[styles.quickAmountText, topUpAmount === String(amt) && styles.quickAmountTextActive]}>
                    {amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+254</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="7XX XXX XXX"
                value={topUpPhone}
                onChangeText={setTopUpPhone}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, topUpLoading && { opacity: 0.6 }]}
              onPress={handleTopUp}
              disabled={topUpLoading}
            >
              {topUpLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.confirmBtnText}>Top Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  balanceCard: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginBottom: 16 },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  topUpButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: -12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statAmount: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  txnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnDetails: { flex: 1 },
  txnTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  txnRef: { fontSize: 11, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2 },
  txnDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: 'bold', color: COLORS.error },
  txnStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  txnStatusText: { fontSize: 10, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickAmountBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  quickAmountText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  quickAmountTextActive: { color: COLORS.primary },
  phoneRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  phonePrefix: { padding: 14, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, backgroundColor: COLORS.backgroundDark },
  phoneInput: { flex: 1, padding: 14, fontSize: 16 },
  confirmBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmBtnText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
});
