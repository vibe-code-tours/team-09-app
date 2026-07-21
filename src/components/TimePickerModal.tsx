// TimePickerModal — Scrollable hour/minute picker for reminder settings
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';

interface Props {
  visible: boolean;
  time: string; // "HH:MM" format
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export const TimePickerModal: React.FC<Props> = ({
  visible,
  time,
  onConfirm,
  onCancel,
}) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  const safeTime = time || '20:00';
  const [h, m] = safeTime.split(':').map(Number);
  const [selectedHour, setSelectedHour] = useState(h ?? 20);
  const [selectedMinute, setSelectedMinute] = useState(m ?? 0);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Sync selection when time prop changes
  useEffect(() => {
    const safe = time || '20:00';
    const [newH, newM] = safe.split(':').map(Number);
    setSelectedHour(newH ?? 20);
    setSelectedMinute(newM ?? 0);
  }, [time]);

  // Scroll to selected values when modal opens
  useEffect(() => {
    if (visible) {
      // Small delay to ensure ScrollView is laid out
      const timer = setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: selectedHour * 44, animated: false });
        const minuteIndex = MINUTES.indexOf(selectedMinute);
        minuteScrollRef.current?.scrollTo({ y: minuteIndex * 44, animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, selectedHour, selectedMinute]);

  const handleConfirm = () => {
    const hh = (selectedHour ?? 0).toString().padStart(2, '0');
    const mm = (selectedMinute ?? 0).toString().padStart(2, '0');
    onConfirm(`${hh}:${mm}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface }, shadows.lg]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              Set Reminder Time
            </Text>
          </View>

          {/* Picker columns */}
          <View style={styles.pickerRow}>
            {/* Hours */}
            <View style={styles.column}>
              <Text style={[styles.columnLabel, { color: colors.textMuted }]}>
                Hour
              </Text>
              <View style={[styles.scrollContainer, { borderColor: colors.border }]}>
                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedHour(hour)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          { color: selectedHour === hour ? '#FFF' : colors.text },
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Separator */}
            <Text style={[styles.separator, { color: colors.text }]}>:</Text>

            {/* Minutes */}
            <View style={styles.column}>
              <Text style={[styles.columnLabel, { color: colors.textMuted }]}>
                Minute
              </Text>
              <View style={[styles.scrollContainer, { borderColor: colors.border }]}>
                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          {
                            color:
                              selectedMinute === minute ? '#FFF' : colors.text,
                          },
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Preview */}
          <Text style={[styles.preview, { color: colors.textMuted }]}>
            {formatTime(selectedHour, selectedMinute)}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>Set</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Helpers ──────────────────────────────────────────────────
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  column: {
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  scrollContainer: {
    width: 80,
    height: 132,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  pickerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  preview: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
