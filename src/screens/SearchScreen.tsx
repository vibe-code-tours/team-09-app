// SearchScreen — Full-text search with filters, recent searches, and HomeScreen-aligned cards

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  DeviceEventEmitter,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, CATEGORIES, Category, createShadows, formatRelativeTime, MOOD_EMOJI } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Entry } from '../types';
import { getEntries, searchEntries } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';
import { Skeleton } from '../components/Skeleton';

// ── Constants ──────────────────────────────────────────────
const RECENT_SEARCHES_KEY = '@mhat_tan_recent_searches';
const MAX_RECENT_SEARCHES = 10;

const DATE_RANGE_OPTIONS = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
] as const;

// ── Helpers ────────────────────────────────────────────────
function getDateRange(key: string): { start: Date; end: Date } | null {
  const now = new Date();
  if (key === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (key === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  return null;
}

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

async function loadRecentSearches(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveRecentSearch(query: string): Promise<string[]> {
  try {
    const recent = await loadRecentSearches();
    const filtered = recent.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

async function removeRecentSearch(query: string): Promise<string[]> {
  try {
    const recent = await loadRecentSearches();
    const updated = recent.filter(q => q !== query);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// ── SearchScreen ───────────────────────────────────────────
export function SearchScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();

  // Search state
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [activeDateRange, setActiveDateRange] = useState('all');

  // Data state
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [searchResults, setSearchResults] = useState<Entry[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Double-tap detection for category chips
  const lastCategoryPress = useRef(0);

  // Audio re-render keys (force AudioPlayer refresh after deletion)
  const [audioKeys, setAudioKeys] = useState<Record<string, number>>({});

  // Listen for audio-deleted events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('audio-deleted', (data: { uri: string }) => {
      setAudioKeys(prev => ({
        ...prev,
        [data.uri]: (prev[data.uri] || 0) + 1,
      }));
    });
    return () => subscription.remove();
  }, []);

  // Load entries and recent searches on focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        if (cancelled) return;
        setIsLoadingAll(true);
        try {
          const [entries, recent] = await Promise.all([
            getEntries(userId),
            loadRecentSearches(),
          ]);
          if (!cancelled) {
            setAllEntries(entries);
            setRecentSearches(recent);
          }
        } catch (err) {
          console.error('[SearchScreen] Failed to load data:', err);
        } finally {
          if (!cancelled) setIsLoadingAll(false);
        }
      };

      loadData();
      return () => { cancelled = true; };
    }, [])
  );

  // Build filter object for searchEntries
  const buildFilters = useCallback(() => {
    const filters: {
      category?: Category;
      dateRange?: { start: Date; end: Date };
    } = {};

    if (activeCategory !== 'all') {
      filters.category = activeCategory as Category;
    }
    const dateRange = getDateRange(activeDateRange);
    if (dateRange) {
      filters.dateRange = dateRange;
    }

    return filters;
  }, [activeCategory, activeDateRange]);

  // Debounced search when query or filters change
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
        const results = await searchEntries(userId, query.trim(), buildFilters());
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
  }, [query, userId, buildFilters]);

  // Handle search submit (save to recent)
  const handleSubmitSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    const updated = await saveRecentSearch(trimmed);
    setRecentSearches(updated);
  }, [query]);

  // Handle recent search tap
  const handleRecentSearchTap = useCallback((term: string) => {
    setQuery(term);
    setIsSearchFocused(false);
    inputRef.current?.blur();
  }, []);

  // Handle recent search remove
  const handleRemoveRecent = useCallback(async (term: string) => {
    const updated = await removeRecentSearch(term);
    setRecentSearches(updated);
  }, []);

  // Apply category + date range filters on browse (no query)
  const filteredBrowseEntries = allEntries.filter(e => {
    if (activeCategory !== 'all' && e.category !== activeCategory) return false;
    if (activeDateRange !== 'all') {
      const range = getDateRange(activeDateRange);
      if (range && (e.createdAt < range.start || e.createdAt > range.end)) return false;
    }
    return true;
  });

  // Determine display entries
  const displayEntries = searchResults !== null ? searchResults : filteredBrowseEntries;

  // Group by date
  const groupedEntries: Record<string, Entry[]> = {};
  displayEntries.forEach(entry => {
    const group = getDateGroup(entry.createdAt);
    if (!groupedEntries[group]) groupedEntries[group] = [];
    groupedEntries[group].push(entry);
  });

  const groupKeys = Object.keys(groupedEntries);
  const totalResults = displayEntries.length;
  const isFiltered = activeCategory !== 'all' || activeDateRange !== 'all';
  const isBrowsing = searchResults === null;
  const showRecentSearches = isSearchFocused && !query.trim() && recentSearches.length > 0;

  // Skeleton result cards while searching or on first focus load
  const renderSearchSkeleton = (cardCount: number) => (
    <View style={styles.resultsContent}>
      {Array.from({ length: cardCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.entryCard,
            { backgroundColor: colors.surface, borderLeftColor: 'transparent' },
            shadows.sm,
          ]}
        >
          <View style={styles.entryMainRow}>
            <Skeleton width={36} height={36} borderRadius={radius.sm} />
            <View style={styles.entryContent}>
              <Skeleton width="70%" height={14} />
              <Skeleton width={56} height={18} borderRadius={radius.sm} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.surfaceAlt : '#F5F5F5', borderColor: isSearchFocused ? colors.primary : colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search entries..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSubmitSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: activeCategory === 'all' ? colors.primary : colors.surface,
                borderColor: activeCategory === 'all' ? colors.primary : colors.border,
              },
              shadows.sm,
            ]}
            onPress={() => {
              const now = Date.now();
              if (now - lastCategoryPress.current < 300) {
                setActiveCategory('all');
              }
              lastCategoryPress.current = now;
            }}
          >
            <Text style={[styles.chipIcon]}>📋</Text>
            <Text style={[styles.chipLabel, { color: activeCategory === 'all' ? '#FFFFFF' : colors.text }]}>
              All
            </Text>
          </TouchableOpacity>
          {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, value]) => {
            const isActive = activeCategory === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? value.color : colors.surface,
                    borderColor: isActive ? value.color : colors.border,
                  },
                  shadows.sm,
                ]}
                onPress={() => {
                  const now = Date.now();
                  if (now - lastCategoryPress.current < 300) {
                    setActiveCategory('all');
                  } else {
                    setActiveCategory(key);
                  }
                  lastCategoryPress.current = now;
                }}
              >
                <Text style={styles.chipIcon}>{value.icon}</Text>
                <Text style={[styles.chipLabel, { color: isActive ? '#FFFFFF' : colors.text }]}>
                  {value.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date Range Segmented Control */}
        <View style={styles.dateRangeRow}>
          {DATE_RANGE_OPTIONS.map(d => {
            const isActive = activeDateRange === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.dateRangeBtn,
                  {
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveDateRange(d.key)}
              >
                <Text style={[styles.dateRangeText, { color: isActive ? '#FFFFFF' : colors.text }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Result Count */}
        {(query.trim() || isFiltered) && !isSearchFocused && (
          <View style={styles.resultCountRow}>
            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {isSearching ? 'Searching...' : `${totalResults} ${totalResults === 1 ? 'result' : 'results'}`}
              {query.trim() ? ` for "${query.trim()}"` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Recent Searches Dropdown */}
      {showRecentSearches && (
        <View style={[styles.recentDropdown, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.textMuted }]}>Recent Searches</Text>
            <TouchableOpacity onPress={async () => {
              await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
              setRecentSearches([]);
            }}>
              <Text style={[styles.recentClear, { color: colors.primary }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term, i) => (
            <View key={`${term}-${i}`} style={styles.recentItem}>
              <TouchableOpacity
                style={styles.recentItemLeft}
                onPress={() => handleRecentSearchTap(term)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.recentItemText, { color: colors.text }]}>{term}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveRecent(term)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Results */}
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {isLoadingAll ? renderSearchSkeleton(4) : isSearching ? renderSearchSkeleton(4) : groupKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {query.trim() ? 'Try a different search term or filter' : 'Record your first entry to get started'}
            </Text>
          </View>
        ) : (
          groupKeys.map(groupKey => (
            <View key={groupKey}>
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{groupKey}</Text>
                <Text style={[styles.groupCount, { color: colors.textMuted }]}>
                  {groupedEntries[groupKey].length} {groupedEntries[groupKey].length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>

              {/* Entry Cards — HomeScreen-aligned */}
              {groupedEntries[groupKey].map(entry => {
                const cat = CATEGORIES[entry.category];
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.entryCard, { backgroundColor: colors.surface, borderLeftColor: cat.color }, shadows.sm]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CreateNote', { entryId: entry.id, startViewOnly: true })}
                  >
                    {/* Main row: icon + content + time */}
                    <View style={styles.entryMainRow}>
                      <View style={[styles.entryIconBg, { backgroundColor: cat.color + '20' }]}>
                        <Text style={styles.entryIconText}>{cat.icon}</Text>
                      </View>
                      <View style={styles.entryContent}>
                        {entry.title ? (
                          <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
                            {entry.title}
                          </Text>
                        ) : null}
                        <View style={[styles.categoryTag, { backgroundColor: cat.color + '20' }]}>
                          <Text style={[styles.categoryTagText, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                      </View>
                      <View style={styles.entryActions}>
                        <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                          {formatRelativeTime(entry.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Footer: mood + audio player */}
                    {(entry.mood || entry.audioUri) && (
                      <View style={styles.entryFooter}>
                        {entry.mood && (
                          <Text style={[styles.entryMood, { color: colors.textMuted }]}>
                            {MOOD_EMOJI[entry.mood] || '😐'} {entry.mood}
                          </Text>
                        )}
                        {entry.audioUri && (
                          <AudioPlayer key={audioKeys[entry.audioUri] || 0} audioUri={entry.audioUri} compact />
                        )}
                      </View>
                    )}
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
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  // Filter Rows
  filterRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Date Range
  dateRangeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dateRangeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Result Count
  resultCountRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Recent Searches
  recentDropdown: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentClear: {
    fontSize: 13,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  recentItemText: {
    fontSize: 14,
  },
  // Results
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.xl,
  },
  // Group Headers
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 12,
  },
  // Entry Card — HomeScreen-aligned
  entryCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
  },
  entryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryIconBg: {
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
    gap: spacing.xs,
  },
  entryTitle: {
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
  entryActions: {
    alignItems: 'flex-end',
  },
  entryTime: {
    fontSize: 11,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.lg + spacing.sm,
  },
  entryMood: {
    fontSize: 11,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
  },
});
