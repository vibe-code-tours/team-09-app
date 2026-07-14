// ExpenseListScreen — Sketch 005 Variant A: Expense Cards
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';

// ── Navigation types ──────────────────────────────────────
type MoneyStackParamList = {
  MoneyMain: undefined;
  ExpenseList: { category?: string; month?: string } | undefined;
};

// ── Spending entry ────────────────────────────────────────
interface SpendingEntry {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  transcript: string;
  createdAt: Date;
}

// ── Months for filter ─────────────────────────────────────
const MONTHS = [
  { key: '2026-07', label: 'July 2026' },
  { key: '2026-06', label: 'June 2026' },
  { key: '2026-05', label: 'May 2026' },
] as const;

// ── Mock data ─────────────────────────────────────────────
const MOCK_EXPENSES: SpendingEntry[] = [
  { id: '1', categoryKey: 'food', categoryLabel: 'Food & Drinks', categoryIcon: '🍜', categoryColor: '#4CAF50', amount: 3500, transcript: 'Bought lunch at the market — mohinga and tea with colleagues', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', categoryKey: 'transport', categoryLabel: 'Transport', categoryIcon: '🚌', categoryColor: '#2196F3', amount: 800, transcript: 'Bus fare to work this morning', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '3', categoryKey: 'shopping', categoryLabel: 'Shopping', categoryIcon: '🛒', categoryColor: '#FF9800', amount: 8500, transcript: 'Groceries at the night market — rice, vegetables, cooking oil', createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) },
  { id: '4', categoryKey: 'food', categoryLabel: 'Food & Drinks', categoryIcon: '🍜', categoryColor: '#4CAF50', amount: 2500, transcript: 'Shan noodle dinner at the shop near the hotel', createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000) },
  { id: '5', categoryKey: 'food', categoryLabel: 'Food & Drinks', categoryIcon: '🍜', categoryColor: '#4CAF50', amount: 1500, transcript: 'Morning tea and a snack at the stall', createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000) },
  { id: '6', categoryKey: 'transport', categoryLabel: 'Transport', categoryIcon: '🚌', categoryColor: '#2196F3', amount: 800, transcript: 'Bus fare to the office', createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000) },
  { id: '7', categoryKey: 'bills', categoryLabel: 'Bills & Other', categoryIcon: '📱', categoryColor: '#607D8B', amount: 3900, transcript: 'Phone data top-up for the month', createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
];

const formatK = (n: number) => `K ${n.toLocaleString()}`;

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffHr < 1) return 'Just now';
  if (diffHr < 24) {
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `Today, ${time}`;
  }

  const diffDay = Math.floor(diffMs / 86400000);
  if (diffDay === 1) {
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `Yesterday, ${time}`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Component ─────────────────────────────────────────────
export const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MoneyStackParamList, 'ExpenseList'>>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  const initialCategory = route.params?.category;
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0].key);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let result = MOCK_EXPENSES;
    if (selectedCategory) {
      result = result.filter(e => e.categoryKey === selectedCategory);
    }
    return result;
  }, [selectedCategory]);

  const total = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  // Category filter chips (derived from data)
  const categoryChips = useMemo(() => {
    const seen = new Map<string, { label: string; icon: string; color: string }>();
    for (const e of MOCK_EXPENSES) {
      if (!seen.has(e.categoryKey)) {
        seen.set(e.categoryKey, { label: e.categoryLabel, icon: e.categoryIcon, color: e.categoryColor });
      }
    }
    return Array.from(seen.entries()).map(([key, val]) => ({ key, ...val }));
  }, []);

  const renderExpenseCard = ({ item }: { item: SpendingEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
      <View style={[styles.cardBorder, { backgroundColor: item.categoryColor }]} />
      <View style={styles.cardContent}>
        {/* Top: category + amount */}
        <View style={styles.cardTop}>
          <View style={styles.cardCategoryRow}>
            <Text style={styles.cardIcon}>{item.categoryIcon}</Text>
            <Text style={[styles.cardCategory, { color: item.categoryColor }]}>
              {item.categoryLabel}
            </Text>
          </View>
          <Text style={[styles.cardAmount, { color: colors.primary }]}>
            -{formatK(item.amount)}
          </Text>
        </View>

        {/* Transcript quote */}
        <Text style={[styles.cardTranscript, { color: colors.text }]}>
          "{item.transcript}"
        </Text>

        {/* Footer: date + voice badge */}
        <View style={styles.cardFooter}>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            📅 {formatDate(item.createdAt)}
          </Text>
          <Text style={[styles.cardVoice, { color: colors.textMuted }]}>🎙️ Voice</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hitSlop}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Expenses</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Month chips */}
      <View style={styles.chipRow}>
        {MONTHS.map((m) => {
          const isActive = selectedMonth === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedMonth(m.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: isActive ? '#FFF' : colors.textMuted }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category filter chips */}
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: !selectedCategory ? '#4CAF50' : colors.surface,
              borderColor: !selectedCategory ? '#4CAF50' : colors.border,
            },
          ]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, { color: !selectedCategory ? '#FFF' : colors.textMuted }]}>
            All
          </Text>
        </TouchableOpacity>
        {categoryChips.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? cat.color : colors.surface,
                  borderColor: isActive ? cat.color : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(isActive ? null : cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: isActive ? '#FFF' : colors.textMuted }]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total bar */}
      <View style={styles.totalBar}>
        <Text style={[styles.totalAmount, { color: colors.primary }]}>{formatK(total)}</Text>
        <Text style={[styles.totalMeta, { color: colors.textMuted }]}>
          total · {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {/* Expense list */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No expenses for this filter
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', marginLeft: spacing.md },
  headerSpacer: { width: 24 },
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },

  // Chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  // Total
  totalBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  totalAmount: { fontSize: 20, fontWeight: '700' },
  totalMeta: { fontSize: 13 },

  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },

  // Card
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardBorder: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIcon: { fontSize: 16 },
  cardCategory: { fontSize: 13, fontWeight: '600' },
  cardAmount: { fontSize: 14, fontWeight: '700' },

  cardTranscript: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardDate: { fontSize: 12 },
  cardVoice: { fontSize: 12 },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: 14,
    marginTop: spacing.lg,
  },
});
