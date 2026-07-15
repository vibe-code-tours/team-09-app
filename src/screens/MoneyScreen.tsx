// MoneyScreen — Sketch 004 Variant B: Category Breakdown
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getMoneyEntries, type MoneyEntry } from '../services/storage';

// ── Navigation types ──────────────────────────────────────
type MoneyStackParamList = {
  MoneyMain: undefined;
  ExpenseList: { category?: string; month?: string } | undefined;
};

// ── Category breakdown config ─────────────────────────────
const SPEND_CATEGORIES = [
  { key: 'food',     label: 'Food & Drinks', icon: '🍜', color: '#4CAF50' },
  { key: 'transport', label: 'Transport',    icon: '🚌', color: '#2196F3' },
  { key: 'shopping', label: 'Shopping',      icon: '🛒', color: '#FF9800' },
  { key: 'bills',    label: 'Bills & Other', icon: '📱', color: '#607D8B' },
] as const;

const formatK = (n: number) => `K ${n.toLocaleString()}`;

// ── Component ─────────────────────────────────────────────
export const MoneyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MoneyStackParamList>>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const { userId } = useAuth();

  const [moneyEntries, setMoneyEntries] = useState<MoneyEntry[]>([]);

  // Load money entries from database
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadEntries = async () => {
        try {
          const entries = await getMoneyEntries(userId);
          if (!cancelled) setMoneyEntries(entries);
        } catch (err) {
          console.error('[MoneyScreen] Failed to load money entries:', err);
        }
      };
      loadEntries();
      return () => { cancelled = true; };
    }, [userId])
  );

  // Aggregate by category (for now, all entries go to "other" since we don't have category assignment on expense items)
  const categoryTotals = React.useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const cat of SPEND_CATEGORIES) {
      map[cat.key] = { total: 0, count: 0 };
    }
    // TODO: When expense_items have final_category_id, map to categories
    // For now, treat all as "bills & other"
    for (const entry of moneyEntries) {
      map['bills'].total += entry.amount;
      map['bills'].count += 1;
    }
    return map;
  }, [moneyEntries]);

  const grandTotal = React.useMemo(
    () => moneyEntries.reduce((sum, e) => sum + e.amount, 0),
    [moneyEntries],
  );

  const recentEntries = moneyEntries.slice(0, 3);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>💰 Money</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{currentMonth}</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="bar-chart" size={18} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month total */}
        <View style={styles.totalSection}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Spent</Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>{formatK(grandTotal)}</Text>
          <Text style={[styles.totalCount, { color: colors.textMuted }]}>
            {moneyEntries.length} {moneyEntries.length === 1 ? 'entry' : 'entries'} this month
          </Text>
        </View>

        {/* Category breakdown grid */}
        <View style={styles.categoryGrid}>
          {SPEND_CATEGORIES.map((cat) => {
            const data = categoryTotals[cat.key];
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryCard, { backgroundColor: colors.surface }, shadows.sm]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ExpenseList', { category: cat.key })}
              >
                <View style={[styles.categoryCardTop, { borderTopColor: cat.color }]} />
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>{cat.label}</Text>
                <Text style={[styles.categoryAmount, { color: cat.color }]}>
                  {formatK(data.total)}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                  {data.count} {data.count === 1 ? 'entry' : 'entries'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent list */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>Recent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.recentList, { backgroundColor: colors.surface }, shadows.sm]}>
            {recentEntries.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Ionicons name="receipt-outline" size={32} color={colors.border} />
                <Text style={[styles.emptyRecentText, { color: colors.textMuted }]}>
                  No expenses recorded yet
                </Text>
              </View>
            ) : (
              recentEntries.map((entry, i) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.recentItem,
                    i < recentEntries.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ExpenseList')}
                >
                  <View style={[styles.recentDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                      {entry.summary || entry.description}
                    </Text>
                    <Text style={[styles.recentMeta, { color: colors.textMuted }]}>
                      {entry.description}
                    </Text>
                  </View>
                  <Text style={[styles.recentAmount, { color: colors.primary }]}>
                    -{formatK(entry.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

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
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: spacing.xs },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scrollContent: { paddingTop: spacing.xl },

  // Total
  totalSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 32, fontWeight: '700', marginTop: spacing.xs },
  totalCount: { fontSize: 14, marginTop: 2 },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  categoryCard: {
    width: '47.5%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  categoryCardTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopWidth: 3,
  },
  categoryIcon: { fontSize: 20, marginBottom: spacing.sm },
  categoryLabel: { fontSize: 12 },
  categoryAmount: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  categoryCount: { fontSize: 12, marginTop: 2 },

  // Recent
  recentSection: { paddingHorizontal: spacing.xl },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: { fontSize: 16, fontWeight: '600' },
  seeAll: { fontSize: 14, fontWeight: '500' },

  recentList: { borderRadius: radius.lg, overflow: 'hidden' },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '500' },
  recentMeta: { fontSize: 12, marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: '600' },

  // Empty
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyRecentText: {
    fontSize: 14,
    marginTop: spacing.md,
  },
});
