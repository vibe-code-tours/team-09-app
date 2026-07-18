// EntryCard Component - Compact design
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime } from '../theme';
import { Entry } from '../types';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  onDelete?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress, onDelete }) => {
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
      {/* Main row: icon + content + actions */}
      <View style={styles.mainRow}>
        {/* Category icon */}
        <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>

        {/* Content: title + summary */}
        <View style={styles.content}>
          {entry.title ? (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {entry.title}
            </Text>
          ) : null}
          <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={1}>
            {entry.summary}
          </Text>
        </View>

        {/* Actions: time + delete */}
        <View style={styles.actions}>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatRelativeTime(entry.createdAt)}
          </Text>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Footer: mood + pinned (only if needed) */}
      {(entry.isPinned || entry.mood) && (
        <View style={styles.footer}>
          {entry.mood && (
            <Text style={[styles.mood, { color: colors.textMuted }]}>{entry.mood}</Text>
          )}
          {entry.isPinned && (
            <Text style={[styles.pinned, { color: colors.accent }]}>📌</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 20,
    width: 28,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  time: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.lg + spacing.sm,
  },
  mood: {
    fontSize: 11,
  },
  pinned: {
    fontSize: 11,
  },
});
