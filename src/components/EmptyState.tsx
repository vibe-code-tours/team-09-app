// EmptyState - Animated empty state with dual CTAs for first-time users
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme';

interface EmptyStateProps {
  onRecord?: () => void;
  onWriteNote?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onRecord,
  onWriteNote,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const illustrationSize = Math.min(120, screenWidth * 0.3);

  // Pulse animation for the microphone icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      {/* Animated microphone illustration */}
      <View style={[styles.illustrationContainer, { width: illustrationSize, height: illustrationSize }]}>
        {/* Pulse ring behind the icon */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: colors.primary,
              width: illustrationSize,
              height: illustrationSize,
              borderRadius: illustrationSize / 2,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
        {/* Mic icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.primaryLight,
              width: illustrationSize * 0.8,
              height: illustrationSize * 0.8,
              borderRadius: illustrationSize * 0.4,
            },
          ]}
        >
          <Ionicons name="mic" size={48} color={colors.primary} />
        </View>
      </View>

      {/* Title and subtitle */}
      <Text style={[styles.title, { color: colors.text }]}>
        No entries yet
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Start recording or writing to create your first entry
      </Text>

      {/* Dual CTAs */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaPrimary, { backgroundColor: colors.primary }]}
          onPress={onRecord}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={20} color="#FFFFFF" />
          <Text style={styles.ctaPrimaryText}>Record Your First Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onWriteNote}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={[styles.ctaSecondaryText, { color: colors.primary }]}>Write a Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl * 2,
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  pulseRing: {
    position: 'absolute',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  ctaRow: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  ctaPrimary: {
    // backgroundColor set via prop
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSecondary: {
    borderWidth: 1,
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
