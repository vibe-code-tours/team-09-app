// BackgroundTitleModal — Global title prompt for background-processed recordings
// Listens for 'note-ready-for-title' events and shows a modal wherever the user is.
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { updateEntry, getEntryById } from '../services/storage';
import { createShadows } from '../theme';

// Generate a title from the first few words of text
const generateTitle = (text: string): string => {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length > 0 ? words : 'Voice Note';
};

interface Props {
  navigationRef: React.MutableRefObject<NavigationContainerRef<any> | null>;
}

export const BackgroundTitleModal: React.FC<Props> = ({ navigationRef }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  const [visible, setVisible] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ref to batch rapid events — only handle the last one
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'note-ready-for-title',
      async (data: { entryId: string }) => {
        // If already showing a modal, queue the next one after dismissal
        if (isHandlingRef.current || visible) {
          console.log('[BackgroundTitleModal] Already showing, skipping:', data.entryId);
          return;
        }

        isHandlingRef.current = true;
        setEntryId(data.entryId);

        // Load entry to get transcript for skip functionality
        try {
          const entry = await getEntryById(data.entryId);
          if (entry) {
            setTranscript(entry.transcript);
          }
        } catch (err) {
          console.error('[BackgroundTitleModal] Failed to load entry:', err);
        }

        setTitleInput('');
        setVisible(true);
      }
    );

    return () => subscription.remove();
  }, []);

  const handleSave = async () => {
    if (isSaving || !entryId) return;
    const title = titleInput.trim();
    if (!title) return;

    setIsSaving(true);
    try {
      await updateEntry(entryId, { title });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setVisible(false);
      setEntryId(null);
      setTranscript('');
      setTitleInput('');
      isHandlingRef.current = false;

      // Navigate to CreateNoteScreen so user can view/edit
      setTimeout(() => {
        navigationRef.current?.navigate('Home', {
          screen: 'CreateNote',
          params: { entryId, startViewOnly: true },
        });
      }, 300);
    } catch (err: any) {
      console.error('[BackgroundTitleModal] Save failed:', err);
      Alert.alert('Error', 'Failed to save title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (isSaving || !entryId) return;
    const autoTitle = generateTitle(transcript);

    setIsSaving(true);
    try {
      await updateEntry(entryId, { title: autoTitle });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setVisible(false);
      setEntryId(null);
      setTranscript('');
      setTitleInput('');
      isHandlingRef.current = false;

      // Navigate to CreateNoteScreen
      setTimeout(() => {
        navigationRef.current?.navigate('Home', {
          screen: 'CreateNote',
          params: { entryId, startViewOnly: true },
        });
      }, 300);
    } catch (err: any) {
      console.error('[BackgroundTitleModal] Skip failed:', err);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Don't allow closing without saving
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }, shadows.lg]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            🎙️ Recording ready!
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
            Give your note a title
          </Text>

          <TextInput
            style={[
              styles.modalInput,
              {
                color: colors.text,
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter title..."
            placeholderTextColor={colors.textMuted}
            value={titleInput}
            onChangeText={setTitleInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (titleInput.trim()) {
                handleSave();
              }
            }}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalSkipBtn, { borderColor: colors.border }]}
              onPress={handleSkip}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalSkipText, { color: colors.textSecondary }]}>
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSaveBtn,
                {
                  backgroundColor: titleInput.trim() ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSave}
              disabled={!titleInput.trim() || isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>Save Note</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSkipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
