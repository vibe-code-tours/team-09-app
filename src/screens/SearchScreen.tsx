// SearchScreen.tsx — Sketch 009 Variant A: Card Results
// Tab-integrated search with date-grouped cards, category tags, voice badges

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, CATEGORIES, Category } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Types ──────────────────────────────────────────────────
interface SearchEntry {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  amount?: string;       // e.g. "12,000 Kyat"
  mood?: string;         // e.g. "😊 Happy"
  isVoice: boolean;
  date: Date;
}

// ── Mock Data ──────────────────────────────────────────────
const MOCK_ENTRIES: SearchEntry[] = [
  {
    id: '1',
    title: 'Lunch at Shawarma Palace',
    excerpt: '"ordered chicken shawarma with extra garlic sauce"',
    category: 'money',
    amount: '12,000 Kyat',
    isVoice: true,
    date: new Date(2026, 6, 13, 9, 41),
  },
  {
    id: '2',
    title: 'Feeling great after workout',
    excerpt: '"had an amazing morning run, feeling energized and ready for the day"',
    category: 'feelings',
    mood: '😊 Happy',
    isVoice: true,
    date: new Date(2026, 6, 13, 7, 30),
  },
  {
    id: '3',
    title: 'Sprint planning meeting notes',
    excerpt: '"discussed Q3 roadmap, assigned tasks for next sprint"',
    category: 'work',
    isVoice: true,
    date: new Date(2026, 6, 12, 14, 0),
  },
  {
    id: '4',
    title: 'Uber to downtown',
    excerpt: '"took an uber from office to downtown meeting"',
    category: 'money',
    amount: '8,500 Kyat',
    isVoice: true,
    date: new Date(2026, 6, 12, 13, 15),
  },
  {
    id: '5',
    title: 'Morning run 5km',
    excerpt: '"completed 5km in 32 minutes, felt energetic"',
    category: 'health',
    isVoice: false,
    date: new Date(2026, 6, 10, 6, 30),
  },
  {
    id: '6',
    title: 'App feature idea: mood tracker',
    excerpt: '"add a quick mood check-in on the home screen"',
    category: 'ideas',
    isVoice: false,
    date: new Date(2026, 6, 10, 11, 0),
  },
  {
    id: '7',
    title: 'Grocery shopping at City Mart',
    excerpt: '"bought rice, vegetables, chicken, and cooking oil"',
    category: 'money',
    amount: '45,000 Kyat',
    isVoice: true,
    date: new Date(2026, 6, 10, 11, 0),
  },
  {
    id: '8',
    title: 'Stressed about deadline',
    excerpt: '"need to focus and finish the report by Friday"',
    category: 'feelings',
    mood: '😰 Anxious',
    isVoice: true,
    date: new Date(2026, 6, 9, 16, 0),
  },
  {
    id: '9',
    title: 'Coffee at Starbucks',
    excerpt: '"iced americano, working on design mockups"',
    category: 'money',
    amount: '8,500 Kyat',
    isVoice: true,
    date: new Date(2026, 6, 8, 10, 0),
  },
];

// ── Filter tabs ────────────────────────────────────────────
const FILTERS: { key: string; label: string; icon?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'money', label: 'Money', icon: '💰' },
  { key: 'feelings', label: 'Feelings', icon: '💗' },
  { key: 'work', label: 'Work', icon: '💼' },
  { key: 'health', label: 'Health', icon: '🏃' },
  { key: 'ideas', label: 'Ideas', icon: '💡' },
];

// ── Helpers ────────────────────────────────────────────────
function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Older';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── SearchScreen ───────────────────────────────────────────
export function SearchScreen() {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter + search
  const filteredEntries = useMemo(() => {
    let entries = MOCK_ENTRIES;

    // Category filter
    if (activeFilter !== 'all') {
      entries = entries.filter(e => e.category === activeFilter);
    }

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      entries = entries.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [query, activeFilter]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, SearchEntry[]> = {};
    filteredEntries.forEach(entry => {
      const group = getDateGroup(entry.date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const groupKeys = Object.keys(groupedEntries);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.surfaceAlt : '#F5F5F5', borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="What are you looking for?"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.voiceBtn}>
            <Text style={{ fontSize: 18 }}>🎤</Text>
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isActive ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {f.icon ? `${f.icon} ${f.label}` : f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {groupKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Try a different search term or filter
            </Text>
          </View>
        ) : (
          groupKeys.map(groupKey => (
            <View key={groupKey} style={styles.resultGroup}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{groupKey}</Text>
                <Text style={[styles.groupCount, { color: colors.textMuted }]}>
                  {groupedEntries[groupKey].length} {groupedEntries[groupKey].length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>

              {groupedEntries[groupKey].map(entry => {
                const cat = CATEGORIES[entry.category];
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    {/* Category Icon */}
                    <View style={[styles.entryIcon, { backgroundColor: cat.color + '20' }]}>
                      <Text style={styles.entryIconText}>{cat.icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.entryContent}>
                      <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={[styles.entryExcerpt, { color: colors.textMuted }]} numberOfLines={1}>
                        {entry.excerpt}
                      </Text>
                      <View style={styles.entryMeta}>
                        {/* Category Tag */}
                        <View style={[styles.categoryTag, { backgroundColor: cat.color + '20' }]}>
                          <Text style={[styles.categoryTagText, { color: cat.color }]}>{cat.label}</Text>
                        </View>

                        {/* Amount or Mood */}
                        {entry.amount && (
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{entry.amount}</Text>
                        )}
                        {entry.mood && (
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{entry.mood}</Text>
                        )}

                        {/* Voice Badge */}
                        {entry.isVoice && (
                          <View style={styles.voiceBadge}>
                            <Text style={styles.voiceBadgeText}>🎙️</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  voiceBtn: {
    padding: 2,
  },
  pillsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.lg,
  },
  resultGroup: {
    marginBottom: spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 11,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIconText: {
    fontSize: 16,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryExcerpt: {
    fontSize: 12,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 11,
  },
  voiceBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voiceBadgeText: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 13,
  },
});
