// SettingsScreen — Sketch 006 Variant A: iOS Grouped Cards
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { ThemeMode } from "../theme/ThemeContext";
import { spacing, radius, createShadows } from "../theme";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "../services/notification";
import { clearAllData } from "../services/storage";
import { TimePickerModal } from "../components/TimePickerModal";

// ── Theme options ─────────────────────────────────────────
const THEME_OPTIONS: { key: ThemeMode; icon: string; label: string }[] = [
  { key: "light", icon: "☀️", label: "Light" },
  { key: "system", icon: "💻", label: "System" },
  { key: "dark", icon: "🌙", label: "Dark" },
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
  <View
    style={[
      styles.row,
      !last && { borderBottomColor: colors.border, borderBottomWidth: 1 },
    ]}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <TouchableOpacity
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.success : colors.border },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.toggleKnob,
          { transform: [{ translateX: value ? 20 : 0 }] },
        ]}
      />
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
    style={[
      styles.row,
      !last && { borderBottomColor: colors.border, borderBottomWidth: 1 },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View>
        <Text
          style={[
            styles.rowTitle,
            { color: danger ? colors.danger : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {rightLabel ? (
      <Text style={[styles.rowRightLabel, { color: colors.textMuted }]}>
        {rightLabel}
      </Text>
    ) : (
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

// ── Component ─────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const { theme, isDark, mode, setMode } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("12:32");
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load reminder settings on mount
  useEffect(() => {
    loadReminderSettings();
  }, []);

  const loadReminderSettings = async () => {
    // TODO: Load from user_settings in DB when service is ready
    // For now, use defaults and schedule notification
    const enabled = true;
    const time = "12:32";
    setReminderEnabled(enabled);
    setReminderTime(time);

    // Schedule notification if enabled
    if (enabled) {
      const [h, m] = time.split(":").map(Number);
      await scheduleDailyReminder(h, m);
    }
  };

  const handleToggleReminder = async () => {
    if (!reminderEnabled) {
      // Enabling
      const granted = await requestNotificationPermission();
      if (granted) {
        const [h, m] = reminderTime.split(":").map(Number);
        await scheduleDailyReminder(h, m);
        setReminderEnabled(true);
        // TODO: Save to DB
      } else {
        Alert.alert(
          "Notifications Blocked",
          "Please enable notifications in your device Settings to receive reminders.",
          [{ text: "OK" }],
        );
      }
    } else {
      // Disabling
      await cancelDailyReminder();
      setReminderEnabled(false);
      // TODO: Save to DB
    }
  };

  const handleTimePress = () => {
    setShowTimePicker(true);
  };

  const handleTimeChange = async (time: string) => {
    setReminderTime(time);
    if (reminderEnabled) {
      const [h, m] = time.split(":").map(Number);
      await cancelDailyReminder();
      await scheduleDailyReminder(h, m);
      // TODO: Save to DB
    }
  };

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleClearAllData = () => {
    // Step 1: Warn about irreversibility
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all entries, recordings, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            // Step 2: Double-confirm
            Alert.alert(
              "Are you sure?",
              "All your voice recordings, notes, and preferences will be permanently deleted.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Everything",
                  style: "destructive",
                  onPress: performClearAllData,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const performClearAllData = async () => {
    try {
      await clearAllData();
      // Reset local state to defaults
      setReminderEnabled(false);
      setReminderTime("20:00");
      setMode("system");
      Alert.alert("Done", "All data has been cleared.");
    } catch (err) {
      console.error('[SettingsScreen] Clear all data failed:', err);
      Alert.alert("Error", "Failed to clear data. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            shadows.sm,
          ]}
        >
          {/* Theme picker */}
          <View
            style={[
              styles.row,
              { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🎨</Text>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Theme
              </Text>
            </View>
          </View>
          <View style={styles.themeSegmentRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeSegBtn,
                  mode === opt.key && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                ]}
                onPress={() => setMode(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.themeSegText,
                    {
                      color: mode === opt.key ? colors.text : colors.textMuted,
                    },
                  ]}
                >
                  {opt.icon} {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section: Notifications */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            shadows.sm,
          ]}
        >
          <ToggleRow
            icon="🔔"
            title="Daily Reminders"
            subtitle="Remind to record entries"
            value={reminderEnabled}
            onToggle={handleToggleReminder}
            colors={colors}
            shadows={shadows}
          />
          {reminderEnabled && (
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={handleTimePress}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>⏰</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    Reminder Time
                  </Text>
                  <Text
                    style={[styles.rowSubtitle, { color: colors.textMuted }]}
                  >
                    {formatTime(reminderTime)}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
          <ToggleRow
            icon="📊"
            title="Weekly Summary"
            subtitle="Weekly activity digest every Sunday"
            value={false}
            onToggle={() => {}}
            colors={colors}
            shadows={shadows}
            last
          />
        </View>

        {/* Section: Data & Storage */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          DATA & STORAGE
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            shadows.sm,
          ]}
        >
          <TappableRow
            icon="🗑️"
            title="Clear All Data"
            danger
            onPress={handleClearAllData}
            colors={colors}
            last
          />
        </View>

        {/* Section: About */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          ABOUT
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            shadows.sm,
          ]}
        >
          <TappableRow
            icon="ℹ️"
            title="Version"
            rightLabel="1.0.0"
            colors={colors}
          />
          <TappableRow
            icon="⭐"
            title="Rate Mhat Tan"
            onPress={() =>
              Linking.openURL("https://github.com/vibe-code-tours/team-09-app")
            }
            colors={colors}
            last
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker}
        time={reminderTime}
        onConfirm={(newTime) => {
          setShowTimePicker(false);
          handleTimeChange(newTime);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Scroll
  scrollContent: { paddingTop: spacing.xl },

  // Section
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  rowIcon: { fontSize: 18 },
  rowTitle: { fontSize: 14, fontWeight: "500" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowRightLabel: { fontSize: 13 },

  // Toggle
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
  },

  // Theme segment
  themeSegmentRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomColor: "rgba(0,0,0,0.05)",
    borderBottomWidth: 1,
  },
  themeSegBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeSegText: { fontSize: 13, fontWeight: "500" },
});
