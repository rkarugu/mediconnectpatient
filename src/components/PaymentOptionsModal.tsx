import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Button } from './index';

export type PaymentMethod = 'cash' | 'mpesa' | 'wallet' | 'insurance' | 'card';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

interface PaymentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPayment: (method: PaymentMethod) => void;
  estimatedPrice: number;
  walletBalance?: number;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'cash',
    name: 'Cash',
    description: 'Pay with cash when service is complete',
    icon: 'cash-outline',
    color: COLORS.success,
    available: true,
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Pay using Safaricom M-Pesa',
    icon: 'phone-portrait-outline',
    color: '#4CAF50',
    available: true,
  },
  {
    id: 'wallet',
    name: 'MediConnect Wallet',
    description: 'Use your MediConnect wallet balance',
    icon: 'wallet-outline',
    color: COLORS.primary,
    available: true,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Use your health insurance coverage',
    icon: 'shield-checkmark-outline',
    color: COLORS.info,
    available: true,
  },
  {
    id: 'card',
    name: 'Card Payment',
    description: 'Pay with debit or credit card',
    icon: 'card-outline',
    color: COLORS.secondary,
    available: true,
  },
];

export default function PaymentOptionsModal({
  visible,
  onClose,
  onSelectPayment,
  estimatedPrice,
  walletBalance = 0,
}: PaymentOptionsModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('cash');
  const [insuranceDetails, setInsuranceDetails] = useState({
    provider: '',
    memberNumber: '',
  });
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);

  const handleSelectMethod = (method: PaymentMethod) => {
    if (method === 'insurance') {
      setShowInsuranceForm(true);
      setSelectedMethod(method);
    } else if (method === 'wallet' && walletBalance < estimatedPrice) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (KES ${walletBalance.toLocaleString()}) is less than the estimated price (KES ${estimatedPrice.toLocaleString()}). Please top up or choose another payment method.`
      );
    } else {
      setSelectedMethod(method);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (selectedMethod === 'insurance' && (!insuranceDetails.provider || !insuranceDetails.memberNumber)) {
      Alert.alert('Error', 'Please provide insurance details');
      return;
    }

    onSelectPayment(selectedMethod);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Estimated Service Cost</Text>
            <Text style={styles.priceValue}>KES {estimatedPrice.toLocaleString()}</Text>
          </View>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {paymentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  selectedMethod === option.id && styles.paymentOptionSelected,
                  !option.available && styles.paymentOptionDisabled,
                ]}
                onPress={() => handleSelectMethod(option.id)}
                disabled={!option.available}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  {option.id === 'wallet' && (
                    <Text style={styles.walletBalance}>
                      Balance: KES {walletBalance.toLocaleString()}
                    </Text>
                  )}
                </View>
                <View style={styles.radioButton}>
                  {selectedMethod === option.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {showInsuranceForm && selectedMethod === 'insurance' && (
              <View style={styles.insuranceForm}>
                <Text style={styles.formTitle}>Insurance Details</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Insurance Provider</Text>
                  <TouchableOpacity style={styles.selectInput}>
                    <Text style={styles.selectInputText}>
                      {insuranceDetails.provider || 'Select Provider'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Member Number</Text>
                  <View style={styles.textInput}>
                    <Text style={styles.textInputPlaceholder}>Enter member number</Text>
                  </View>
                </View>
                <Text style={styles.insuranceNote}>
                  We'll verify your coverage with your insurance provider
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Confirm Payment Method"
              onPress={handleConfirmPayment}
              disabled={!selectedMethod}
              fullWidth
            />
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['2xl'],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  priceSection: {
    backgroundColor: COLORS.primaryLight + '10',
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  optionsContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: SPACING.base,
    minHeight: 200,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '05',
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  walletBalance: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  insuranceForm: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectInputText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  textInput: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputPlaceholder: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  insuranceNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  footer: {
    gap: SPACING.md,
  },
  cancelButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
});
