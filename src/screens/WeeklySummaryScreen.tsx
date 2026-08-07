// WeeklySummaryScreen — AI-generated weekly digest
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows, CATEGORIES } from '../theme';
import { Category, WeeklySummary, CATEGORIES as CATEGORIES_MAP } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getEntriesForDateRange,
  getUserSettings,
  getWeeklySummary,
  saveWeeklySummaryRecord,
} from '../services/storage';
import { generateWeeklySummary, getCurrentWeek, formatWeekRange } from '../services/weeklySummary';

// ── Mood emoji map ────────────────────────────────────────
const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  excited: '🤩',
  stressed: '😰',
  grateful: '🙏',
};

// ── Component ─────────────────────────────────────────────
export const WeeklySummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const { user } = useAuth();

  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [weeklyLanguage, setWeeklyLanguage] = useState<'my' | 'en'>('my');

  const week = getCurrentWeek();
  const weekRange = formatWeekRange(week.start, week.end);

  // Load or generate summary
  const loadSummary = useCallback(async (forceRegenerate = false) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Check cache first (skip if forcing regeneration)
      if (!forceRegenerate) {
        const cached = await getWeeklySummary(user.id, week.start);
        if (cached) {
          setSummary(cached);
          setLoaded(true);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch entries for this week
      const entries = await getEntriesForDateRange(user.id, week.start, week.end);
      if (entries.length === 0) {
        setSummary(null);
        setLoaded(true);
        setLoading(false);
        return;
      }

      // 3. Get user language preference
      const settings = await getUserSettings(user.id);
      const language = settings?.weeklySummaryLanguage === 'en' ? 'en' : 'my';

      // 4. Generate AI summary
      const result = await generateWeeklySummary(
        entries.map((e) => ({
          transcript: e.transcript,
          category: e.category,
          summary: e.summary,
          mood: e.mood,
          occurredAt: e.createdAt,
        }))
      );

      // 5. Compute total duration
      const totalDuration = entries.reduce((sum, e) => sum + e.audioDuration, 0);

      // 6. Build and cache summary
      const newSummary: WeeklySummary = {
        id: '',
        userId: user.id,
        weekStart: week.start,
        weekEnd: week.end,
        summaryMy: result.summaryMy,
        summaryEn: result.summaryEn,
        categoryBreakdown: result.categoryBreakdown,
        moodTrend: result.moodTrend,
        entryCount: entries.length,
        totalDuration,
        language,
        createdAt: new Date(),
      };

      await saveWeeklySummaryRecord(newSummary);
      setSummary({ ...newSummary, id: 'generated' });
      setLoaded(true);
    } catch (err) {
      console.error('[WeeklySummary] Failed to generate:', err);
      Alert.alert('Error', 'Failed to generate weekly summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, week.start, week.end]);

  // Auto-load on first render
  React.useEffect(() => {
    const init = async () => {
      if (!user) return;
      const settings = await getUserSettings(user.id);
      if (settings?.weeklySummaryLanguage) {
        setWeeklyLanguage(settings.weeklySummaryLanguage as 'my' | 'en');
      }
      if (!loaded && !loading) {
        loadSummary();
      }
    };
    init();
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Weekly Summary
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Week range */}
        <Text style={[styles.weekRange, { color: colors.textMuted }]}>
          📅 {weekRange}
        </Text>

        {loading ? (
          // Loading state
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Generating your weekly summary...
            </Text>
          </View>
        ) : !summary ? (
          // Empty state
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No entries this week
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Start recording voice entries to see your weekly summary here.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
                {weeklyLanguage === 'my' ? '📋 အနှစ်ချုပ် (Myanmar)' : '📋 Summary (English)'}
              </Text>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                {(weeklyLanguage === 'my' ? summary.summaryMy : summary.summaryEn).trim()}
              </Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={styles.statIcon}>📝</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {summary.entryCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Entries
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDuration(summary.totalDuration)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Recorded
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={styles.statIcon}>🎭</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {getTopMood(summary.moodTrend)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Top Mood
                </Text>
              </View>
            </View>

            {/* Category breakdown */}
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
                📊 Categories
              </Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(summary.categoryBreakdown) as Category[])
                  .filter((cat) => summary.categoryBreakdown[cat] > 0)
                  .sort((a, b) => summary.categoryBreakdown[b] - summary.categoryBreakdown[a])
                  .map((cat) => (
                    <View key={cat} style={styles.categoryChip}>
                      <Text style={styles.categoryEmoji}>
                        {CATEGORIES_MAP[cat].icon}
                      </Text>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {CATEGORIES_MAP[cat].label}
                      </Text>
                      <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                        {summary.categoryBreakdown[cat]}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Mood trend */}
            {summary.moodTrend.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
                <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
                  🎭 Mood Trend
                </Text>
                <View style={styles.moodRow}>
                  {summary.moodTrend.map((item, idx) => (
                    <View key={idx} style={styles.moodItem}>
                      <Text style={styles.moodEmoji}>
                        {MOOD_EMOJI[item.mood] || '😐'}
                      </Text>
                      <Text style={[styles.moodDay, { color: colors.textMuted }]}>
                        {item.date}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Regenerate button */}
            <TouchableOpacity
              style={[styles.regenerateBtn, { backgroundColor: colors.primary }]}
              onPress={() => loadSummary(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.regenerateText}>Regenerate Summary</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Helpers ───────────────────────────────────────────────
function getTopMood(moodTrend: { date: string; mood: string }[]): string {
  if (moodTrend.length === 0) return '—';
  const counts: Record<string, number> = {};
  for (const item of moodTrend) {
    counts[item.mood] = (counts[item.mood] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return `${MOOD_EMOJI[top[0]] || '😐'} ${top[0]}`;
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },

  // Content
  content: { padding: spacing.xl },
  weekRange: { fontSize: 14, textAlign: 'center', marginBottom: spacing.xl },

  // Loading
  loadingContainer: { alignItems: 'center', marginTop: spacing.xxxl * 2, gap: spacing.md },
  loadingText: { fontSize: 14 },

  // Empty
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Cards
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  summaryText: { fontSize: 15, lineHeight: 30 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11 },

  // Categories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  categoryEmoji: { fontSize: 14 },
  categoryName: { fontSize: 13, fontWeight: '500' },
  categoryCount: { fontSize: 12, fontWeight: '600' },

  // Mood
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  moodItem: { alignItems: 'center', gap: spacing.xs },
  moodEmoji: { fontSize: 24 },
  moodDay: { fontSize: 11 },

  // Regenerate
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  regenerateText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
