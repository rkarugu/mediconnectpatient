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
import { useAuthStore } from '../store/authStore';

interface WalletData {
  balance: number;
  total_spent: number;
  pending_payments: number;
  this_month_spent: number;
}

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: string;
  balance_after: string;
  description: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  reference_type?: string;
  reference_id?: number;
  metadata?: any;
}

export default function WalletScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
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
      const [walletRes, statementRes] = await Promise.all([
        apiClient.get('/patients/wallet'),
        apiClient.get('/patients/wallet/statement'),
      ]);
      
      console.log('💰 Wallet Response:', JSON.stringify(walletRes.data, null, 2));
      console.log('📄 Statement Response:', JSON.stringify(statementRes.data, null, 2));
      
      if (walletRes.data.success) {
        console.log('✅ Setting wallet data:', walletRes.data.data);
        setWallet(walletRes.data.data);
        
        // Update auth store with latest balance
        if (user && walletRes.data.data?.balance !== undefined) {
          await updateUser({
            ...user,
            wallet_balance: walletRes.data.data.balance,
          });
        }
      }
      if (statementRes.data.success) {
        const txns = statementRes.data.data?.data || statementRes.data.data || [];
        console.log('📊 Setting transactions:', txns.length, 'items');
        console.log('📊 First transaction:', txns[0]);
        setTransactions(txns);
      } else {
        console.error('❌ Statement API failed:', statementRes.data);
      }
    } catch (error) {
      console.error('Load wallet error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, updateUser]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useRealtimeRefresh(loadWallet, {
    events: ['payment.processed', 'service.completed', 'lab_request.created', 'wallet.topped_up', 'wallet.debited'],
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
        
        // Update auth store with new balance
        if (user && res.data.data?.new_balance !== undefined) {
          await updateUser({
            ...user,
            wallet_balance: res.data.data.new_balance,
          });
        }
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

  // No full-screen loading - render immediately with available data

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
          <Text style={styles.balanceAmountHeader}>
            KES {(wallet?.balance ?? user?.wallet_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

        {/* Wallet Statement */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallet Statement</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Your wallet activity will appear here</Text>
          </View>
        ) : (
          <View style={styles.statementContainer}>
            {/* Table Header */}
            <View style={styles.statementHeader}>
              <Text style={[styles.statementHeaderText, { flex: 2 }]}>Description</Text>
              <Text style={[styles.statementHeaderText, { flex: 1, textAlign: 'right' }]}>Debit</Text>
              <Text style={[styles.statementHeaderText, { flex: 1, textAlign: 'right' }]}>Credit</Text>
              <Text style={[styles.statementHeaderText, { flex: 1, textAlign: 'right' }]}>Balance</Text>
            </View>
            
            {/* Transaction Rows */}
            {transactions.map((txn) => (
              <View key={txn.id} style={styles.statementRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.statementDesc}>{txn.description}</Text>
                  <Text style={styles.statementDate}>
                    {new Date(txn.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.statementRef}>{txn.transaction_id}</Text>
                </View>
                <Text style={[styles.statementAmount, styles.debitAmount, { flex: 1 }]}>
                  {txn.type === 'debit' ? parseFloat(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                </Text>
                <Text style={[styles.statementAmount, styles.creditAmount, { flex: 1 }]}>
                  {txn.type === 'credit' ? parseFloat(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                </Text>
                <Text style={[styles.statementAmount, styles.balanceAmount, { flex: 1 }]}>
                  {parseFloat(txn.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
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
  balanceAmountHeader: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginBottom: 16 },
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
  // Statement styles
  statementContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  statementHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statementHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'right',
  },
  statementRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  statementDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statementDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statementRef: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  statementAmount: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  debitAmount: {
    color: COLORS.error,
  },
  creditAmount: {
    color: COLORS.success,
  },
  balanceAmount: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
