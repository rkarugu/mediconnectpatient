import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { requestHistoryService } from '../services/requestHistoryService';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

const COLORS = {
  primary: '#2B7BB9',
  secondary: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  white: '#FFFFFF',
  background: '#F5F8FA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E6ED',
  star: '#FFD700',
  starEmpty: '#E0E6ED',
};

interface ServiceDetails {
  id: number;
  medic_name: string;
  specialty: string;
}

export default function ReviewScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { requestId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const loadServiceDetails = useCallback(async () => {
    try {
      const details = await requestHistoryService.getRequestDetails(requestId);
      setServiceDetails({
        id: details.id,
        medic_name: details.medic?.name || 'Medical Professional',
        specialty: details.specialty || 'General',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadServiceDetails();
  }, [loadServiceDetails]);

  useRealtimeRefresh(loadServiceDetails, {
    events: ['service.completed', 'payment.processed'],
    intervalMs: 30000,
    enabled: true,
  });

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    setSubmitting(true);
    try {
      await requestHistoryService.submitReview(requestId, {
        rating,
        review: review.trim(),
      });

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Review',
      'Are you sure you want to skip the review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('Main'),
        },
      ]
    );
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={44}
              color={star <= rating ? COLORS.star : COLORS.starEmpty}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Success Icon */}
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.secondary} />
        </View>
        <Text style={styles.successTitle}>Service Completed!</Text>
        <Text style={styles.successSubtitle}>
          How was your experience with {serviceDetails?.medic_name}?
        </Text>
      </View>

      {/* Medic Info Card */}
      <View style={styles.medicCard}>
        <View style={styles.medicAvatar}>
          <Ionicons name="person" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.medicInfo}>
          <Text style={styles.medicName}>{serviceDetails?.medic_name}</Text>
          <Text style={styles.medicSpecialty}>{serviceDetails?.specialty}</Text>
        </View>
      </View>

      {/* Star Rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Tap to Rate</Text>
        {renderStars()}
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
        )}
      </View>

      {/* Review Input */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Write a Review (Optional)</Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="Share your experience with this medical professional..."
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{review.length}/500</Text>
      </View>

      {/* Quick Tags */}
      <View style={styles.tagsSection}>
        <Text style={styles.tagsTitle}>Quick Feedback</Text>
        <View style={styles.tagsContainer}>
          {['Professional', 'Punctual', 'Friendly', 'Knowledgeable', 'Caring', 'Thorough'].map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                review.includes(tag) && styles.tagSelected,
              ]}
              onPress={() => {
                if (review.includes(tag)) {
                  setReview(review.replace(tag + ' ', '').replace(tag, ''));
                } else {
                  setReview((review + ' ' + tag).trim());
                }
              }}
            >
              <Text style={[
                styles.tagText,
                review.includes(tag) && styles.tagTextSelected,
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmitReview}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="send" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  medicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicInfo: {
    marginLeft: 12,
    flex: 1,
  },
  medicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  medicSpecialty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
  },
  reviewSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  tagsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  tagTextSelected: {
    color: COLORS.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
