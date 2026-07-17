// HomeScreen - Redesigned per sketches 001-C, 002-A, 003-A
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, Category, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime, formatHeaderDate, getGreeting } from '../theme';
import { Entry } from '../types';
import { getEntries, getTodayEntries } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();
  const shadows = createShadows(isDark, colors.primary);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  // Load entries every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        try {
          const [allEntries, todayEntries] = await Promise.all([
            getEntries(userId),
            getTodayEntries(userId),
          ]);

          if (cancelled) return;

          setEntries(allEntries);

          // Compute stats from real data
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekEntries = allEntries.filter(e => e.createdAt >= weekAgo);
          setStats({
            today: todayEntries.length,
            week: weekEntries.length,
            total: allEntries.length,
          });
        } catch (err) {
          console.error('[HomeScreen] Failed to load entries:', err);
        }
      };

      loadData();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Filter entries based on selected category
  const filteredEntries = selectedCategory === 'all'
    ? entries
    : entries.filter(entry => entry.category === selectedCategory);

  // Split into pinned and unpinned
  const pinnedEntries = filteredEntries.filter(e => e.isPinned);
  const unpinnedEntries = filteredEntries.filter(e => !e.isPinned);

  // Group unpinned entries by day
  const groupEntriesByDay = (entries: Entry[]): Array<{ date: string; entries: Entry[] }> => {
    const groups: Record<string, Entry[]> = {};
    entries.forEach(entry => {
      const dateKey = entry.createdAt.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return Object.entries(groups)
      .map(([dateStr, entries]) => ({
        date: dateStr,
        entries,
        dateObj: new Date(dateStr),
      }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .map(({ date, entries }) => ({ date, entries }));
  };

  const groupedEntries = groupEntriesByDay(unpinnedEntries);
  const limitedGroupedEntries = groupedEntries.slice(0, 5); // Limit to 5 most recent entries
  const hasMoreEntries = unpinnedEntries.length > 5;

  // Category options for the chip list
  const categoryOptions: Array<{ key: Category | 'all'; label: string; icon: string; color: string }> = [
    { key: 'all', label: 'All', icon: '📋', color: colors.primary },
    ...Object.entries(CATEGORIES).map(([key, value]) => ({
      key: key as Category,
      label: value.label,
      icon: value.icon,
      color: value.color,
    })),
  ];

  const renderCategoryChip = useCallback(({ item }: { item: typeof categoryOptions[0] }) => {
    const isSelected = selectedCategory === item.key;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? item.color : colors.surface,
            borderColor: isSelected ? item.color : colors.border,
          },
          shadows.sm,
        ]}
        onPress={() => setSelectedCategory(item.key)}
        activeOpacity={0.7}
      >
        <Text style={styles.chipIcon}>{item.icon}</Text>
        <Text
          style={[
            styles.chipLabel,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, colors, shadows]);

  const renderEntry = useCallback(({ item }: { item: Entry }) => {
    const cat = CATEGORIES[item.category];
    return (
      <TouchableOpacity
        style={[styles.entryCard, { backgroundColor: colors.surface, borderLeftColor: cat.color }, shadows.sm]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CreateNote', { entryId: item.id, startViewOnly: true })}
      >
        {/* Header: icon + category + time + audio badge */}
        <View style={styles.entryHeader}>
          <View style={styles.entryCategoryRow}>
            <Text style={styles.entryIcon}>{cat.icon}</Text>
            <Text style={[styles.entryCategory, { color: cat.color }]}>{cat.label}</Text>
            {item.audioUri ? (
              <View style={[styles.audioBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="mic" size={10} color={colors.primary} />
                <Text style={[styles.audioBadgeText, { color: colors.primary }]}>Audio</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.entryTime, { color: colors.textMuted }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {/* Title */}
        {item.title ? (
          <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}

        {/* Summary */}
        <Text style={[styles.entrySummary, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.summary}
        </Text>

        {/* Footer: mood + pinned + audio player */}
        <View style={styles.entryFooter}>
          <Text style={[styles.entryMood, { color: colors.textMuted }]}>{item.mood}</Text>
          {item.isPinned && (
            <Text style={[styles.entryPinned, { color: colors.accent }]}>📌 Pinned</Text>
          )}
          {item.audioUri ? (
            <AudioPlayer audioUri={item.audioUri} compact />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }, [colors, shadows, navigation]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerGreeting, { color: colors.text }]}>{getGreeting()}</Text>
            <Text style={[styles.headerDate, { color: colors.textMuted }]}>
              {formatHeaderDate(new Date())}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>KA</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>{stats.today}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Today</Text>
          </View>
          <View style={[styles.metricCard, styles.metricCardHighlight, shadows.primary]}>
            <Text style={[styles.metricNumber, styles.metricNumberWhite]}>{stats.week}</Text>
            <Text style={[styles.metricLabel, styles.metricLabelWhite]}>This Week</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
        </View>

        {/* Category Chips */}
        <View style={styles.categorySection}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>Categories</Text>
          <FlatList
            data={categoryOptions}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
          />
        </View>

        {/* Pinned Entries Section */}
        {pinnedEntries.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 Pinned Entries</Text>
            </View>
            {pinnedEntries.map(item => (
              <View key={item.id}>
                {renderEntry({ item })}
              </View>
            ))}
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
          {hasMoreEntries && (
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Search')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Day-grouped entries */}
        {limitedGroupedEntries.map(group => (
          <View key={group.date} style={styles.dayGroup}>
            <Text style={[styles.dayHeader, { color: colors.textMuted }]}>
              {formatHeaderDate(new Date(group.date))}
            </Text>
            {group.entries.map(item => (
              <View key={item.id}>
                {renderEntry({ item })}
              </View>
            ))}
          </View>
        ))}

        {/* Empty State */}
        {unpinnedEntries.length === 0 && pinnedEntries.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No entries yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap the mic to record your first entry
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Metric Cards
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  metricCardHighlight: {
    backgroundColor: '#E91E63',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricNumberWhite: {
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  metricLabelWhite: {
    color: 'rgba(255,255,255,0.8)',
  },
  // Category Chips
  categorySection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  categorySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  categoryChipsContainer: {
    paddingRight: spacing.xl,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Section
  sectionContainer: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Entry Cards
  entryCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryIcon: {
    fontSize: 16,
  },
  entryCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  audioBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  entryTime: {
    fontSize: 12,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  entrySummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  entryMood: {
    fontSize: 12,
  },
  entryPinned: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Day Grouping
  dayGroup: {
    marginBottom: spacing.md,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  // List
  listContent: {
    paddingBottom: 100,
  },
});
