// HomeScreen - Redesigned per sketches 001-C, 002-A, 003-A
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, Category, spacing, radius, createShadows } from '../theme';
import { formatRelativeTime, formatHeaderDate, getGreeting } from '../theme';
import { Entry } from '../types';
import { listRecordings } from '../services/audioStorage';

type RootStackParamList = {
  HomeMain: undefined;
  Record: undefined;
};

interface HomeScreenProps {
  // Props can be added here as needed
}

// Mock data for visual verification
const MOCK_ENTRIES: Entry[] = [
  {
    id: '1',
    transcript: '',
    category: 'money',
    summary: 'Bought lunch at the market — 3,500 kyat for mohinga and tea',
    items: [],
    mood: '😊 Content',
    audioUri: '',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPinned: true,
    userId: 'mock',
  },
  {
    id: '2',
    transcript: '',
    category: 'work',
    summary: 'Finished the database schema review with the team',
    items: [],
    mood: '💪 Productive',
    audioUri: '',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isPinned: false,
    userId: 'mock',
  },
  {
    id: '3',
    transcript: '',
    category: 'feelings',
    summary: 'Called family back home. Miss them but feeling grateful.',
    items: [],
    mood: '🥰 Grateful',
    audioUri: '',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isPinned: false,
    userId: 'mock',
  },
  {
    id: '4',
    transcript: '',
    category: 'health',
    summary: 'Morning run around the park — 2km in 15 minutes, getting faster.',
    items: [],
    mood: '🏃 Energized',
    audioUri: '',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    isPinned: false,
    userId: 'mock',
  },
];

// Stats (would come from database in production)
const STATS = { today: 3, week: 12, total: 47 };

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  const [entries] = useState<Entry[]>(MOCK_ENTRIES);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [recordings, setRecordings] = useState<Array<{ name: string; uri: string; size: number }>>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Reload recordings every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      listRecordings().then(setRecordings);
      // Cleanup playback on blur
      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingUri(null);
      };
    }, [])
  );

  const handlePlayRecording = async (uri: string) => {
    try {
      // If something is playing, stop it first
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If tapping the same recording, just stop (toggle off)
      if (playingUri === uri) {
        setPlayingUri(null);
        return;
      }

      // Play the new recording
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingUri(uri);

      // When playback finishes, reset state
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingUri(null);
          soundRef.current = null;
        }
      });
    } catch (err) {
      setPlayingUri(null);
    }
  };

  // Filter entries based on selected category
  const filteredEntries = selectedCategory === 'all'
    ? entries
    : entries.filter(entry => entry.category === selectedCategory);

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
        onPress={() => {/* navigate to detail */}}
      >
        {/* Header: icon + category + time */}
        <View style={styles.entryHeader}>
          <View style={styles.entryCategoryRow}>
            <Text style={styles.entryIcon}>{cat.icon}</Text>
            <Text style={[styles.entryCategory, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={[styles.entryTime, { color: colors.textMuted }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {/* Summary */}
        <Text style={[styles.entrySummary, { color: colors.text }]} numberOfLines={2}>
          {item.summary}
        </Text>

        {/* Footer: mood + pinned */}
        <View style={styles.entryFooter}>
          <Text style={[styles.entryMood, { color: colors.textMuted }]}>{item.mood}</Text>
          {item.isPinned && (
            <Text style={[styles.entryPinned, { color: colors.accent }]}>⭐ Pinned</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [colors, shadows]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No entries yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Tap the mic to record your first entry
      </Text>
    </View>
  ), [colors]);

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
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Metric Cards */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={[styles.metricNumber, { color: colors.primary }]}>{STATS.today}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Today</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardHighlight, shadows.primary]}>
                <Text style={[styles.metricNumber, styles.metricNumberWhite]}>{STATS.week}</Text>
                <Text style={[styles.metricLabel, styles.metricLabelWhite]}>This Week</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={[styles.metricNumber, { color: colors.primary }]}>{STATS.total}</Text>
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

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
              <TouchableOpacity>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>

            {/* Saved Recordings */}
            {recordings.length > 0 && (
              <View style={styles.recordingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
                  🎙️ Saved Recordings ({recordings.length})
                </Text>
                {recordings.map((rec) => {
                  const isPlaying = playingUri === rec.uri;
                  return (
                    <TouchableOpacity
                      key={rec.name}
                      style={[styles.recordingItem, { backgroundColor: colors.surface, borderLeftColor: isPlaying ? colors.danger : colors.primary }, shadows.sm]}
                      onPress={() => handlePlayRecording(rec.uri)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={isPlaying ? 'pause' : 'mic'} size={18} color={isPlaying ? colors.danger : colors.primary} />
                      <View style={styles.recordingInfo}>
                        <Text style={[styles.recordingName, { color: colors.text }]} numberOfLines={1}>
                          {rec.name}
                        </Text>
                        <Text style={[styles.recordingSize, { color: colors.textMuted }]}>
                          {(rec.size / 1024).toFixed(1)} KB
                        </Text>
                      </View>
                      <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={28} color={isPlaying ? colors.danger : colors.primary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
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
  // Section Header
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
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
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
  entryTime: {
    fontSize: 12,
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
  // Saved Recordings
  recordingsSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    gap: spacing.md,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordingSize: {
    fontSize: 12,
    marginTop: 2,
  },
});
