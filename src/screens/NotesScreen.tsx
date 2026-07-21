// NotesScreen - All entries grouped by date
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, Category, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime, formatHeaderDate } from '../theme';
import { Entry } from '../types';
import { getEntries } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';

type DayGroup = {
  date: string;
  dateObj: Date;
  entries: Entry[];
};

export const NotesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();
  const shadows = createShadows(isDark, colors.primary);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  // Load entries every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        try {
          const allEntries = await getEntries(userId);
          if (cancelled) return;
          setEntries(allEntries);
        } catch (err) {
          console.error('[NotesScreen] Failed to load entries:', err);
        }
      };

      loadData();
      return () => { cancelled = true; };
    }, [])
  );

  // Filter entries based on selected category
  const filteredEntries = selectedCategory === 'all'
    ? entries
    : entries.filter(entry => entry.category === selectedCategory);

  // Group entries by date
  const groupEntriesByDay = (items: Entry[]): DayGroup[] => {
    const groups: Record<string, Entry[]> = {};
    items.forEach(entry => {
      const dateKey = entry.createdAt.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return Object.entries(groups)
      .map(([dateStr, groupEntries]) => ({
        date: dateStr,
        entries: groupEntries,
        dateObj: new Date(dateStr),
      }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  };

  const groupedEntries = groupEntriesByDay(filteredEntries);

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

  const lastCategoryPress = useRef(0);

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
        onPress={() => {
          const now = Date.now();
          if (now - lastCategoryPress.current < 300) {
            setSelectedCategory('all'); // Double tap → All
          } else {
            setSelectedCategory(item.key);
          }
          lastCategoryPress.current = now;
        }}
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

  // Get day label (Today, Yesterday, or full date)
  const getDayLabel = (dateObj: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return formatHeaderDate(dateObj);
  };

  const handleDayPress = (group: DayGroup) => {
    navigation.navigate('DayDetail', {
      date: group.date,
      entries: group.entries.map(e => e.id),
    });
  };

  const renderDayGroup = useCallback(({ item }: { item: DayGroup }) => {
    const firstEntry = item.entries[0];
    const remainingCount = item.entries.length - 1;
    const cat = CATEGORIES[firstEntry.category];

    return (
      <TouchableOpacity
        style={[styles.dayCard, { backgroundColor: colors.surface }, shadows.sm]}
        activeOpacity={0.7}
        onPress={() => handleDayPress(item)}
      >
        {/* Day header */}
        <View style={styles.dayHeaderRow}>
          <Text style={[styles.dayLabel, { color: colors.text }]}>
            {getDayLabel(item.dateObj)}
          </Text>
          <Text style={[styles.dayCount, { color: colors.textMuted }]}>
            {item.entries.length} {item.entries.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        {/* First entry preview */}
        <View style={[styles.dayPreview, { borderLeftColor: cat.color }]}>
          <Text style={styles.dayPreviewIcon}>{cat.icon}</Text>
          <View style={styles.dayPreviewContent}>
            {firstEntry.title ? (
              <Text style={[styles.dayPreviewTitle, { color: colors.text }]} numberOfLines={1}>
                {firstEntry.title}
              </Text>
            ) : null}
            <Text style={[styles.dayPreviewSummary, { color: colors.textSecondary }]} numberOfLines={1}>
              {firstEntry.summary}
            </Text>
          </View>
          <Text style={[styles.dayPreviewTime, { color: colors.textMuted }]}>
            {formatRelativeTime(firstEntry.createdAt)}
          </Text>
        </View>

        {/* +N more indicator */}
        {remainingCount > 0 && (
          <View style={styles.dayMore}>
            <Text style={[styles.dayMoreText, { color: colors.primary }]}>
              +{remainingCount} more {remainingCount === 1 ? 'note' : 'notes'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors, shadows]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notes</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <FlatList
          data={categoryOptions}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContainer}
        />
      </View>

      {/* Day-grouped entries */}
      {groupedEntries.length > 0 ? (
        <FlatList
          data={groupedEntries}
          renderItem={renderDayGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          onRecord={() => navigation.getParent()?.navigate('Record')}
          onWriteNote={() => navigation.getParent()?.navigate('Home', { screen: 'CreateNote' })}
        />
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  // Category Chips
  categorySection: {
    paddingVertical: spacing.md,
  },
  categoryChipsContainer: {
    paddingHorizontal: spacing.xl,
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
  // Day Cards
  dayCard: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayCount: {
    fontSize: 12,
  },
  // Entry preview
  dayPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
  },
  dayPreviewIcon: {
    fontSize: 18,
    width: 24,
  },
  dayPreviewContent: {
    flex: 1,
    gap: 2,
  },
  dayPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayPreviewSummary: {
    fontSize: 12,
    lineHeight: 16,
  },
  dayPreviewTime: {
    fontSize: 11,
  },
  // +N more
  dayMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dayMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // List
  listContent: {
    paddingBottom: 100,
  },
});
