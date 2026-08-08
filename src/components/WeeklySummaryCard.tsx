// WeeklySummaryCard — Compact weekly summary preview for HomeScreen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows, MOOD_EMOJI } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getUserSettings, getWeeklySummary } from '../services/storage';
import { getCurrentWeek } from '../services/weeklySummary';

interface Props {
  onPress: () => void;
}

export const WeeklySummaryCard: React.FC<Props> = ({ onPress }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const { user } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [topMood, setTopMood] = useState('');

  // Re-check settings every time screen gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!user) return;
        try {
          const settings = await getUserSettings(user.id);
          if (!settings?.weeklySummary) {
            if (!cancelled) setEnabled(false);
            return;
          }
          if (!cancelled) setEnabled(true);

          const week = getCurrentWeek();
          const summary = await getWeeklySummary(user.id, week.start);
          if (summary && !cancelled) {
            setEntryCount(summary.entryCount);
            if (summary.moodTrend.length > 0) {
              const counts: Record<string, number> = {};
              for (const item of summary.moodTrend) {
                counts[item.mood] = (counts[item.mood] || 0) + 1;
              }
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              setTopMood(MOOD_EMOJI[top[0]] || '😐');
            }
          }
        } catch {
          // Silently fail
        }
      };
      load();
      return () => { cancelled = true; };
    }, [user])
  );

  if (!enabled) return null;

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: colors.primaryLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.chipEmoji}>📊</Text>
      <Text style={[styles.chipLabel, { color: colors.primary }]}>This Week</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 18,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
