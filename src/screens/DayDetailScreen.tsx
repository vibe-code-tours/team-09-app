// DayDetailScreen - All entries for a specific day
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime, formatHeaderDate } from '../theme';
import { Entry } from '../types';
import { getEntries, getEntryById, deleteEntry, updateEntry } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';
import { PinLimitModal } from '../components/PinLimitModal';
import { checkPinLimit, pinEntry, replacePin } from '../utils/pinLimit';

type RouteParams = {
  date: string;
  entries: string[];
};

export const DayDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();
  const shadows = createShadows(isDark, colors.primary);

  const { date, entries: entryIds } = route.params as RouteParams;
  const dateObj = new Date(date);

  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pendingPinEntry, setPendingPinEntry] = useState<Entry | null>(null);
  const [pinnedForReplace, setPinnedForReplace] = useState<Entry[]>([]);

  // Load entries by IDs + all entries for pin limit check
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadEntries = async () => {
        try {
          const [loaded, allLoaded] = await Promise.all([
            Promise.all(entryIds.map(id => getEntryById(id))),
            getEntries(userId),
          ]);
          if (cancelled) return;
          setDayEntries(loaded.filter(Boolean) as Entry[]);
          setAllEntries(allLoaded);
        } catch (err) {
          console.error('[DayDetailScreen] Failed to load entries:', err);
        }
      };

      loadEntries();
      return () => { cancelled = true; };
    }, [entryIds, userId])
  );

  const handleDeleteEntry = useCallback((entry: Entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
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
              setDayEntries(prev => prev.filter(e => e.id !== entry.id));
            } catch (err) {
              console.error('[DayDetailScreen] Failed to delete entry:', err);
            }
          },
        },
      ]
    );
  }, []);

  const reloadEntries = useCallback(async () => {
    const [loaded, allLoaded] = await Promise.all([
      Promise.all(entryIds.map(id => getEntryById(id))),
      getEntries(userId),
    ]);
    setDayEntries(loaded.filter(Boolean) as Entry[]);
    setAllEntries(allLoaded);
  }, [entryIds, userId]);

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
      const needsReplace = checkPinLimit(allEntries, entry);
      if (needsReplace) {
        setPendingPinEntry(entry);
        setPinnedForReplace(needsReplace);
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
      console.error('[DayDetailScreen] Toggle pin failed:', err);
    }
  }, [allEntries, entryIds, userId, reloadEntries]);

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
      console.error('[DayDetailScreen] Replace pin failed:', err);
    }
  }, [pendingPinEntry, reloadEntries]);

  const handleCancelPinLimit = useCallback(() => {
    setPinModalVisible(false);
    setPendingPinEntry(null);
    setPinnedForReplace([]);
    // Close any open swipeables
    swipeableRefs.current.forEach(ref => ref?.close());
    swipeableRefs.current.clear();
  }, []);

  const renderRightActions = useCallback((entry: Entry) => (
    <View style={[styles.swipeAction, styles.swipeDelete, { backgroundColor: '#FF3B30' }]}>
      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>Delete</Text>
    </View>
  ), []);

  const renderLeftActions = useCallback((entry: Entry) => (
    <View
      style={[
        styles.swipeAction,
        styles.swipePin,
        { backgroundColor: entry.isPinned ? '#FF9500' : '#34C759' },
      ]}
    >
      <Text style={styles.swipeActionIcon}>{entry.isPinned ? '📌' : '📍'}</Text>
      <Text style={styles.swipeActionText}>{entry.isPinned ? 'Unpin' : 'Pin'}</Text>
    </View>
  ), []);

  const renderEntry = useCallback((entry: Entry) => {
    const cat = CATEGORIES[entry.category];
    return (
      <Swipeable
        key={`${entry.id}-${entry.isPinned}`}
        renderRightActions={() => renderRightActions(entry)}
        renderLeftActions={() => renderLeftActions(entry)}
        onSwipeableRightOpen={() => handleDeleteEntry(entry)}
        onSwipeableLeftOpen={() => {
          swipeableRefs.current.delete(entry.id);
          handleTogglePin(entry);
        }}
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(entry.id, ref);
          else swipeableRefs.current.delete(entry.id);
        }}
        overshootRight={false}
        overshootLeft={false}
      >
        <TouchableOpacity
          style={[styles.entryCard, { backgroundColor: colors.surface, borderLeftColor: cat.color }, shadows.sm]}
          activeOpacity={0.7}
          onPress={() => navigation.getParent()?.navigate('Home', {
            screen: 'CreateNote',
            params: { entryId: entry.id, startViewOnly: true },
          })}
        >
          <View style={styles.entryMainRow}>
            <Text style={styles.entryIcon}>{cat.icon}</Text>
            <View style={styles.entryContent}>
              {entry.title ? (
                <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
                  {entry.title}
                </Text>
              ) : null}
              <Text style={[styles.entrySummary, { color: colors.textSecondary }]} numberOfLines={2}>
                {entry.summary}
              </Text>
            </View>
            <View style={styles.entryActions}>
              <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                {formatRelativeTime(entry.createdAt)}
              </Text>
              {entry.isPinned && (
                <Text style={styles.entryPinnedIcon}>📌</Text>
              )}
            </View>
          </View>

          {(entry.mood || entry.audioUri) && (
            <View style={styles.entryFooter}>
              {entry.mood && (
                <Text style={[styles.entryMood, { color: colors.textMuted }]}>{entry.mood}</Text>
              )}
              {entry.audioUri && (
                <AudioPlayer audioUri={entry.audioUri} compact />
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  }, [colors, shadows, navigation, handleDeleteEntry, renderRightActions, renderLeftActions]);

  // Get day label
  const getDayLabel = (): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return formatHeaderDate(dateObj);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getDayLabel()}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Entries list */}
      {dayEntries.length > 0 ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {dayEntries.map(entry => (
            <View key={entry.id}>
              {renderEntry(entry)}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No entries for this day</Text>
        </View>
      )}

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Entry Cards
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
  // List
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
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
