// SearchScreen.tsx — Sketch 009 Variant A: Card Results
// Tab-integrated search with date-grouped cards, category tags, voice badges

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, CATEGORIES, Category } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Entry } from '../types';
import { getEntries, searchEntries } from '../services/storage';
import { useAuth } from '../context/AuthContext';

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

// ── SearchScreen ───────────────────────────────────────────
export function SearchScreen() {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [searchResults, setSearchResults] = useState<Entry[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load all entries on screen focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadEntries = async () => {
        try {
          const entries = await getEntries(userId);
          if (!cancelled) setAllEntries(entries);
        } catch (err) {
          console.error('[SearchScreen] Failed to load entries:', err);
        }
      };

      loadEntries();
      return () => { cancelled = true; };
    }, [])
  );

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchEntries(userId, query.trim());
        if (!cancelled) setSearchResults(results);
      } catch (err) {
        console.error('[SearchScreen] Search failed:', err);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, userId]);

  // Determine which entries to display
  const displayEntries = searchResults !== null ? searchResults : allEntries;

  // Apply category filter client-side
  const filteredEntries = activeFilter === 'all'
    ? displayEntries
    : displayEntries.filter(e => e.category === activeFilter);

  // Group by date
  const groupedEntries: Record<string, Entry[]> = {};
  filteredEntries.forEach(entry => {
    const group = getDateGroup(entry.createdAt);
    if (!groupedEntries[group]) groupedEntries[group] = [];
    groupedEntries[group].push(entry);
  });

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
        {isSearching ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Searching...</Text>
          </View>
        ) : groupKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {query.trim() ? 'Try a different search term or filter' : 'Record your first entry to get started'}
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
                        {entry.summary || 'Untitled entry'}
                      </Text>
                      <Text style={[styles.entryExcerpt, { color: colors.textMuted }]} numberOfLines={1}>
                        {entry.transcript ? `"${entry.transcript}"` : 'No transcript'}
                      </Text>
                      <View style={styles.entryMeta}>
                        {/* Category Tag */}
                        <View style={[styles.categoryTag, { backgroundColor: cat.color + '20' }]}>
                          <Text style={[styles.categoryTagText, { color: cat.color }]}>{cat.label}</Text>
                        </View>

                        {/* Mood */}
                        {entry.mood && (
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{entry.mood}</Text>
                        )}

                        {/* Voice Badge */}
                        <View style={styles.voiceBadge}>
                          <Text style={styles.voiceBadgeText}>🎙️</Text>
                        </View>
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
