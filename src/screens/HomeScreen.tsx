// HomeScreen - Redesigned per sketches 001-C, 002-A, 003-A
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  DeviceEventEmitter,
  Platform,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, Category, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime, formatHeaderDate, getGreeting } from '../theme';
import { Entry } from '../types';
import { getEntries, getTodayEntries, deleteEntry, updateEntry } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import AudioPlayer from '../components/AudioPlayer';
import { PinLimitModal } from '../components/PinLimitModal';
import { checkPinLimit, pinEntry, replacePin } from '../utils/pinLimit';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();
  const shadows = createShadows(isDark, colors.primary);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [readyForTitleEntryId, setReadyForTitleEntryId] = useState<string | null>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pendingPinEntry, setPendingPinEntry] = useState<Entry | null>(null);
  const [pinnedForReplace, setPinnedForReplace] = useState<Entry[]>([]);

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

  // Listen for background-processed notes ready for title
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('note-ready-for-title', (data: { entryId: string }) => {
      setReadyForTitleEntryId(data.entryId);
      // Refresh entries list
      getEntries(userId).then(setEntries);
    });
    return () => subscription.remove();
  }, [userId]);

  // Filter entries based on selected category
  const filteredEntries = selectedCategory === 'all'
    ? entries
    : entries.filter(entry => entry.category === selectedCategory);

  // Split into pinned and unpinned
  const pinnedEntries = filteredEntries.filter(e => e.isPinned).slice(0, 3);
  const unpinnedEntries = filteredEntries.filter(e => !e.isPinned).slice(0, 5);

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

  const handleDeleteEntry = useCallback((entry: Entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Close the swipeable when user cancels
            swipeableRefs.current.get(entry.id)?.close();
            swipeableRefs.current.delete(entry.id);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            swipeableRefs.current.delete(entry.id);
            try {
              await deleteEntry(entry.id);
              // Reload entries after delete
              const [allEntries, todayEntries] = await Promise.all([
                getEntries(userId),
                getTodayEntries(userId),
              ]);
              setEntries(allEntries);
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const weekEntries = allEntries.filter(e => e.createdAt >= weekAgo);
              setStats({
                today: todayEntries.length,
                week: weekEntries.length,
                total: allEntries.length,
              });
            } catch (err) {
              console.error('[HomeScreen] Failed to delete entry:', err);
            }
          },
        },
      ]
    );
  }, [userId]);

  const reloadEntries = useCallback(async () => {
    const [allEntries, todayEntries] = await Promise.all([
      getEntries(userId),
      getTodayEntries(userId),
    ]);
    setEntries(allEntries);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = allEntries.filter(e => e.createdAt >= weekAgo);
    setStats({
      today: todayEntries.length,
      week: weekEntries.length,
      total: allEntries.length,
    });
  }, [userId]);

  const handleTogglePin = useCallback(async (entry: Entry) => {
    try {
      // Unpinning is always allowed
      if (entry.isPinned) {
        await updateEntry(entry.id, { isPinned: false });
        if (Platform.OS === 'android') {
          ToastAndroid.show('Unpinned', ToastAndroid.SHORT);
        }
        await reloadEntries();
        return;
      }

      // Check pin limit for pinning
      const pinnedForReplace = checkPinLimit(entries, entry);
      if (pinnedForReplace) {
        // Need to show modal
        setPendingPinEntry(entry);
        setPinnedForReplace(pinnedForReplace);
        setPinModalVisible(true);
        return;
      }

      // Under limit, pin directly
      await pinEntry(entry);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Pinned', ToastAndroid.SHORT);
      }
      await reloadEntries();
    } catch (err) {
      console.error('[HomeScreen] Toggle pin failed:', err);
    }
  }, [entries, userId, reloadEntries]);

  const handleReplacePin = useCallback(async (entryToUnpin: Entry) => {
    if (!pendingPinEntry) return;
    try {
      await replacePin(entryToUnpin, pendingPinEntry);
      setPinModalVisible(false);
      setPendingPinEntry(null);
      setPinnedForReplace([]);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Pinned', ToastAndroid.SHORT);
      }
      await reloadEntries();
    } catch (err) {
      console.error('[HomeScreen] Replace pin failed:', err);
    }
  }, [pendingPinEntry, reloadEntries]);

  const handleCancelPinLimit = useCallback(() => {
    setPinModalVisible(false);
    setPendingPinEntry(null);
    setPinnedForReplace([]);
  }, []);

  // Swipeable ref tracking — close others when one opens
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const closeAllSwipeables = useCallback(() => {
    swipeableRefs.current.forEach(ref => ref?.close());
    swipeableRefs.current.clear();
  }, []);

  const renderRightActions = useCallback((entry: Entry) => {
    return (
      <View
        style={[styles.swipeAction, styles.swipeDelete, { backgroundColor: '#FF3B30' }]}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Delete</Text>
      </View>
    );
  }, []);

  const renderLeftActions = useCallback((entry: Entry) => {
    const isPinned = entry.isPinned;
    return (
      <View
        style={[
          styles.swipeAction,
          styles.swipePin,
          { backgroundColor: isPinned ? '#FF9500' : '#34C759' },
        ]}
      >
        <Text style={styles.swipeActionIcon}>{isPinned ? '📌' : '📍'}</Text>
        <Text style={styles.swipeActionText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
      </View>
    );
  }, []);

  const renderEntry = useCallback(({ item }: { item: Entry }) => {
    const cat = CATEGORIES[item.category];
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        renderLeftActions={() => renderLeftActions(item)}
        onSwipeableRightOpen={() => {
          handleDeleteEntry(item);
        }}
        onSwipeableLeftOpen={() => {
          swipeableRefs.current.delete(item.id);
          handleTogglePin(item);
        }}
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        overshootRight={false}
        overshootLeft={false}
      >
        <TouchableOpacity
          style={[styles.entryCard, { backgroundColor: colors.surface, borderLeftColor: cat.color }, shadows.sm]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreateNote', { entryId: item.id, startViewOnly: true })}
        >
          {/* Main row: icon + content + actions */}
          <View style={styles.entryMainRow}>
            <Text style={styles.entryIcon}>{cat.icon}</Text>
            <View style={styles.entryContent}>
              {item.title ? (
                <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
              ) : null}
              <Text style={[styles.entrySummary, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.summary}
              </Text>
            </View>
            <View style={styles.entryActions}>
              <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
              {item.isPinned && (
                <Text style={styles.entryPinnedIcon}>📌</Text>
              )}
            </View>
          </View>

          {/* Footer: mood + audio player */}
          {(item.mood || item.audioUri) && (
            <View style={styles.entryFooter}>
              {item.mood && (
                <Text style={[styles.entryMood, { color: colors.textMuted }]}>{item.mood}</Text>
              )}
              {item.audioUri && (
                <AudioPlayer audioUri={item.audioUri} compact />
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  }, [colors, shadows, navigation, handleDeleteEntry, renderRightActions, renderLeftActions]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background processing banner */}
      {readyForTitleEntryId && (
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.primary }]}
          onPress={() => {
            navigation.navigate('CreateNote', { entryId: readyForTitleEntryId });
            setReadyForTitleEntryId(null);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.bannerText}>📝 Recording ready — tap to add title</Text>
        </TouchableOpacity>
      )}
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 Pinned</Text>
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
        </View>

        {/* Recent entries - flat list, max 5 */}
        {unpinnedEntries.map(item => (
          <View key={item.id}>
            {renderEntry({ item })}
          </View>
        ))}

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <EmptyState
            onRecord={() => navigation.getParent()?.navigate('Record')}
            onWriteNote={() => navigation.navigate('CreateNote', {})}
          />
        )}
      </ScrollView>

      <PinLimitModal
        visible={pinModalVisible}
        pinnedEntries={pinnedForReplace}
        newEntryTitle={pendingPinEntry?.title || pendingPinEntry?.summary || ''}
        onSelectReplace={handleReplacePin}
        onCancel={handleCancelPinLimit}
      />
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
  // Entry Cards - Compact
  entryCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
  },
  entryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryIcon: {
    fontSize: 20,
    width: 28,
  },
  entryContent: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  entrySummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  entryActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  entryTime: {
    fontSize: 11,
  },
  entryPinnedIcon: {
    fontSize: 12,
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
  entryPinned: {
    fontSize: 11,
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
  // List
  listContent: {
    paddingBottom: 100,
  },
  // Banner
  banner: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Swipe actions
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
  },
  swipeDelete: {
    marginRight: spacing.sm,
  },
  swipePin: {
    marginLeft: spacing.sm,
  },
  swipeActionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
