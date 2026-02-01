import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT * 0.9],
  initialSnapPoint = 0,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentSnapPoint = useRef(snapPoints[initialSnapPoint]);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT - currentSnapPoint.current,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newValue = SCREEN_HEIGHT - currentSnapPoint.current + gestureState.dy;
        if (newValue >= SCREEN_HEIGHT - snapPoints[snapPoints.length - 1]) {
          translateY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 50;
        if (gestureState.dy > threshold) {
          const nextSnapIndex = snapPoints.findIndex(
            (point) => point < currentSnapPoint.current
          );
          if (nextSnapIndex === -1) {
            onClose();
          } else {
            currentSnapPoint.current = snapPoints[nextSnapIndex];
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT - currentSnapPoint.current,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        } else if (gestureState.dy < -threshold) {
          const nextSnapIndex = snapPoints.findIndex(
            (point) => point > currentSnapPoint.current
          );
          if (nextSnapIndex !== -1) {
            currentSnapPoint.current = snapPoints[nextSnapIndex];
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT - currentSnapPoint.current,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        } else {
          Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT - currentSnapPoint.current,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.header}>
            <View style={styles.handle} />
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.xl,
  },
  header: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.base,
  },
});
