// SettingsScreen — Sketch 006 Variant A: iOS Grouped Cards
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';

// ── Theme options ─────────────────────────────────────────
const THEME_OPTIONS: { key: ThemeMode; icon: string; label: string }[] = [
  { key: 'light', icon: '☀️', label: 'Light' },
  { key: 'system', icon: '💻', label: 'System' },
  { key: 'dark', icon: '🌙', label: 'Dark' },
];

// ── Toggle Row ────────────────────────────────────────────
const ToggleRow: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
  colors: any;
  shadows: any;
  last?: boolean;
}> = ({ icon, title, subtitle, value, onToggle, colors, shadows, last }) => (
  <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
    </View>
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: value ? colors.success : colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.toggleKnob, { transform: [{ translateX: value ? 20 : 0 }] }]} />
    </TouchableOpacity>
  </View>
);

// ── Tappable Row ──────────────────────────────────────────
const TappableRow: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  colors: any;
  last?: boolean;
  danger?: boolean;
  rightLabel?: string;
}> = ({ icon, title, subtitle, onPress, colors, last, danger, rightLabel }) => (
  <TouchableOpacity
    style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View>
        <Text style={[styles.rowTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
    </View>
    {rightLabel ? (
      <Text style={[styles.rowRightLabel, { color: colors.textMuted }]}>{rightLabel}</Text>
    ) : (
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

// ── Component ─────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark, mode, setMode } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hitSlop}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>KA</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Khin Aye</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>khin.aye@email.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {/* Section: Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }, shadows.sm]}>
          {/* Theme picker */}
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🎨</Text>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
            </View>
          </View>
          <View style={styles.themeSegmentRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.themeSegBtn, mode === opt.key && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 2, elevation: 1 }]}
                onPress={() => setMode(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.themeSegText, { color: mode === opt.key ? colors.text : colors.textMuted }]}>
                  {opt.icon} {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Text size */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔤</Text>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Text Size</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>A</Text>
              <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.sliderFill, { backgroundColor: colors.primary }]} />
                <View style={[styles.sliderThumb, { backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.sliderLabelLarge, { color: colors.textMuted }]}>A</Text>
            </View>
          </View>
        </View>

        {/* Section: Notifications */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>NOTIFICATIONS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <ToggleRow
            icon="🔔"
            title="Daily Reminders"
            subtitle="Remind to record entries"
            value={true}
            onToggle={() => {}}
            colors={colors}
            shadows={shadows}
          />
          <ToggleRow
            icon="📊"
            title="Weekly Summary"
            subtitle="Spending report every Sunday"
            value={false}
            onToggle={() => {}}
            colors={colors}
            shadows={shadows}
            last
          />
        </View>

        {/* Section: Data & Storage */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DATA & STORAGE</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <TappableRow icon="☁️" title="Cloud Backup" colors={colors} />
          <TappableRow icon="📥" title="Export Data" colors={colors} />
          <TappableRow
            icon="🗑️"
            title="Clear All Data"
            danger
            onPress={() => Alert.alert('Clear Data', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive' },
            ])}
            colors={colors}
            last
          />
        </View>

        {/* Section: About */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <TappableRow icon="ℹ️" title="Version" rightLabel="1.0.0" colors={colors} />
          <TappableRow icon="⭐" title="Rate Mhat Tan" colors={colors} last />
        </View>

        {/* Sign Out */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }, shadows.sm, { marginTop: spacing.xl }]}>
          <TappableRow
            icon="🚪"
            title="Sign Out"
            danger
            onPress={() => Alert.alert('Sign Out', 'Are you sure?')}
            colors={colors}
            last
          />
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', marginLeft: spacing.md },
  headerSpacer: { width: 24 },
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },

  // Scroll
  scrollContent: { paddingTop: spacing.xl },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: spacing.lg },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileEmail: { fontSize: 13, marginTop: 2 },

  // Section
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowIcon: { fontSize: 18 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowRightLabel: { fontSize: 13 },

  // Toggle
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },

  // Theme segment
  themeSegmentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
  },
  themeSegBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSegText: { fontSize: 13, fontWeight: '500' },

  // Slider
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sliderLabel: { fontSize: 12 },
  sliderLabelLarge: { fontSize: 16 },
  sliderTrack: {
    width: 80,
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: { width: '50%', height: '100%', borderRadius: 2 },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -6,
    left: 33,
  },
});
