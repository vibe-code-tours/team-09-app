// PinLimitModal - Ask user which pinned entry to replace when limit (3) is reached
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius, createShadows } from '../theme';
import { Entry } from '../types';

interface Props {
  visible: boolean;
  pinnedEntries: Entry[];
  newEntryTitle: string;
  onSelectReplace: (entryToUnpin: Entry) => void;
  onCancel: () => void;
}

export const PinLimitModal: React.FC<Props> = ({
  visible,
  pinnedEntries,
  newEntryTitle,
  onSelectReplace,
  onCancel,
}) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.surface }, shadows.lg]} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="pin" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Pin Limit Reached</Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You can only pin 3 entries. Select one to replace with "{newEntryTitle || 'new entry'}":
          </Text>

          {/* Pinned entries list */}
          {pinnedEntries.map((entry) => {
            const cat = CATEGORIES[entry.category];
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryOption, { backgroundColor: colors.surfaceAlt, borderLeftColor: cat.color }]}
                onPress={() => onSelectReplace(entry)}
                activeOpacity={0.7}
              >
                <Text style={styles.entryIcon}>{cat.icon}</Text>
                <View style={styles.entryContent}>
                  <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
                    {entry.title || entry.summary}
                  </Text>
                </View>
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            );
          })}

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

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
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  entryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    gap: spacing.sm,
  },
  entryIcon: {
    fontSize: 18,
    width: 24,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
