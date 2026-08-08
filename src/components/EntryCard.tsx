// EntryCard Component - Compact design
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius, createShadows, MOOD_EMOJI } from '../theme';
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
        {/* Category icon with colored background */}
        <View style={[styles.categoryIconBg, { backgroundColor: categoryInfo.color + '20' }]}>
          <Text style={styles.categoryIconText}>{categoryInfo.icon}</Text>
        </View>

        {/* Content: title + category tag */}
        <View style={styles.content}>
          {entry.title ? (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {entry.title}
            </Text>
          ) : null}
          <View style={[styles.categoryTag, { backgroundColor: categoryInfo.color + '20' }]}>
            <Text style={[styles.categoryTagText, { color: categoryInfo.color }]}>{categoryInfo.label}</Text>
          </View>
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
            <Text style={[styles.mood, { color: colors.textMuted }]}>
              {MOOD_EMOJI[entry.mood] || '😐'} {entry.mood}
            </Text>
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
  categoryIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
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
