// EntryCard Component - Updated per Sketch 002-A
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime } from '../theme';
import { Entry } from '../types';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const categoryInfo = CATEGORIES[entry.category];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderLeftColor: categoryInfo.color },
        shadows.sm,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Header: icon + category + time */}
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={[styles.categoryLabel, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatRelativeTime(entry.createdAt)}
        </Text>
      </View>

      {/* Title */}
      {entry.title ? (
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {entry.title}
        </Text>
      ) : null}

      {/* Summary */}
      <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
        {entry.summary}
      </Text>

      {/* Footer: mood + pinned */}
      <View style={styles.footer}>
        <Text style={[styles.mood, { color: colors.textMuted }]}>{entry.mood}</Text>
        {entry.isPinned && (
          <Text style={[styles.pinned, { color: colors.accent }]}>📌 Pinned</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mood: {
    fontSize: 12,
  },
  pinned: {
    fontSize: 12,
    fontWeight: '500',
  },
});
