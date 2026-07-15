// ExpenseListScreen — Sketch 005 Variant A: Expense Cards
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getMoneyEntries, type MoneyEntry } from '../services/storage';

// ── Navigation types ──────────────────────────────────────
type MoneyStackParamList = {
  MoneyMain: undefined;
  ExpenseList: { category?: string; month?: string } | undefined;
};

// ── Months for filter ─────────────────────────────────────
const MONTHS = [
  { key: '2026-07', label: 'July 2026' },
  { key: '2026-06', label: 'June 2026' },
  { key: '2026-05', label: 'May 2026' },
] as const;

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
  const { userId } = useAuth();

  const initialCategory = route.params?.category;
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0].key);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [allExpenses, setAllExpenses] = useState<MoneyEntry[]>([]);

  // Load money entries from database
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadEntries = async () => {
        try {
          const entries = await getMoneyEntries(userId);
          if (!cancelled) setAllExpenses(entries);
        } catch (err) {
          console.error('[ExpenseListScreen] Failed to load expenses:', err);
        }
      };
      loadEntries();
      return () => { cancelled = true; };
    }, [userId])
  );

  // Filter expenses by category and month
  const filteredExpenses = useMemo(() => {
    let result = allExpenses;

    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      result = result.filter(e => {
        const d = e.createdAt;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    return result;
  }, [allExpenses, selectedMonth]);

  const total = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  const renderExpenseCard = ({ item }: { item: MoneyEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
      <View style={[styles.cardBorder, { backgroundColor: colors.primary }]} />
      <View style={styles.cardContent}>
        {/* Top: category + amount */}
        <View style={styles.cardTop}>
          <View style={styles.cardCategoryRow}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={[styles.cardCategory, { color: colors.primary }]}>
              {item.description}
            </Text>
          </View>
          <Text style={[styles.cardAmount, { color: colors.primary }]}>
            -{formatK(item.amount)}
          </Text>
        </View>

        {/* Transcript quote */}
        {item.summary ? (
          <Text style={[styles.cardTranscript, { color: colors.text }]}>
            "{item.summary}"
          </Text>
        ) : null}

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
