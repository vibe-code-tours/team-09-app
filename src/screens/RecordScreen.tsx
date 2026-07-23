// RecordScreen
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RecordButton } from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createShadows } from '../theme';
import { saveAudioLocally, deleteAudioFile, canSaveRecording } from '../services/audioStorage';
import { transcribeAudio } from '../services/transcription';
import { categorizeEntry } from '../services/categorization';
import { saveEntry } from '../services/storage';
import { Category } from '../types';

// Generate a title from the first few words of the transcript
const generateTitle = (text: string): string => {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length > 0 ? words : 'Voice Note';
};

export const RecordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const { userId } = useAuth();
  const {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    stopPlayback,
    setSaving,
    discardRecording,
    formatDuration,
  } = useRecording();

  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('other');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [hasNavigatedToNote, setHasNavigatedToNote] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Redirection flag
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Refs to avoid stale closures in effects
  const stateRef = useRef(state);
  stateRef.current = state;
  const hasNavigatedRef = useRef(hasNavigatedToNote);
  hasNavigatedRef.current = hasNavigatedToNote;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const categoryRef = useRef(category);
  categoryRef.current = category;
  const permanentUriRef = useRef<string | null>(null);
  const discardedRef = useRef(false);
  const backgroundModeRef = useRef(false);
  const processingCancelledRef = useRef(false);

  // Helper to redirect to unified notepad
  const navigateToCreateNote = (text: string, finalCategory: Category, audioPath: string) => {
    if (hasNavigatedRef.current) return;
    setHasNavigatedToNote(true);

    navigation.navigate('Home', {
      screen: 'CreateNote',
      params: {
        prefilledText: text,
        predictedCategory: finalCategory,
        audioFile: audioPath,
        startViewOnly: true,
      }
    });

    // Reset local states to avoid duplicate triggers and clean up
    setTranscript('');
    setTranscribeError(null);
    setCategory('other');
    setHasNavigatedToNote(false);
    discardRecording();
  };

  // Helper to redirect to unified notepad with an already saved entry
  const navigateToSavedNote = (entryId: string) => {
    if (hasNavigatedRef.current) return;
    setHasNavigatedToNote(true);

    navigation.navigate('Home', {
      screen: 'CreateNote',
      params: {
        entryId: entryId,
        startViewOnly: true,
      }
    });

    // Reset local states to avoid duplicate triggers and clean up
    setTranscript('');
    setTranscribeError(null);
    setCategory('other');
    setHasNavigatedToNote(false);
    discardRecording();
  };

  const handleSaveNote = async (title: string) => {
    if (isSavingNote) return;
    setIsSavingNote(true);
    try {
      const currentTranscript = transcriptRef.current;
      const currentCategory = categoryRef.current;
      const audioUri = permanentUriRef.current || '';

      const newEntryId = await saveEntry(userId, {
        title: title.trim(),
        transcript: currentTranscript.trim(),
        category: currentCategory,
        summary: '',
        mood: 'neutral',
        audioUri,
        audioDuration: 0,
        isPinned: false,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setShowTitleModal(false);
      setTitleInput('');
      permanentUriRef.current = null;
      
      // Navigate to CreateNoteScreen with the saved note
      navigateToSavedNote(newEntryId);
    } catch (err: any) {
      console.error('[RecordScreen] Save failed:', err);
      setTranscribeError(err.message || 'Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSkipTitle = async () => {
    const autoTitle = generateTitle(transcriptRef.current);
    await handleSaveNote(autoTitle);
  };

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  // Reset navigation guard when screen is idle or starting recording
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'recording') {
      setHasNavigatedToNote(false);
      discardedRef.current = false;
      backgroundModeRef.current = false;
    }
  }, [state.status]);

  // Animate playback + action buttons in when recording finishes
  useEffect(() => {
    if (state.status === 'recorded') {
      fadeIn.setValue(0);
      slideUp.setValue(20);
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-transcribe after recording finishes (use refs to avoid stale closures)
      const runTranscribe = async () => {
        const currentUri = stateRef.current.uri;
        if (!currentUri) return;
        setIsTranscribing(true);
        setTranscribeError(null);
        try {
          const permanentUri = await saveAudioLocally(currentUri);
          if (processingCancelledRef.current || (discardedRef.current && !backgroundModeRef.current)) return;

          // Handle storage limit reached
          if (!permanentUri) {
            setTranscribeError('Storage full. Please delete some recordings first.');
            setIsTranscribing(false);
            return;
          }

          permanentUriRef.current = permanentUri;
          const text = await transcribeAudio(permanentUri);
          if (processingCancelledRef.current || (discardedRef.current && !backgroundModeRef.current)) return;
          setTranscript(text);

          // Auto-categorize
          let finalCategory: Category = 'other';
          if (text.trim()) {
            setIsCategorizing(true);
            try {
              const result = await categorizeEntry(text);
              if (processingCancelledRef.current || (discardedRef.current && !backgroundModeRef.current)) return;
              finalCategory = result.category;
              setCategory(finalCategory); // Update category state/ref
            } catch (catErr: any) {
              console.error('[RecordScreen] Categorize failed:', catErr);
            } finally {
              if (!processingCancelledRef.current && !discardedRef.current && !backgroundModeRef.current) setIsCategorizing(false);
            }
          }

          if (processingCancelledRef.current || (discardedRef.current && !backgroundModeRef.current)) return;

          if (backgroundModeRef.current) {
            // Background mode: save entry and emit global event
            const entryId = await saveEntry(userId, {
              title: generateTitle(text),
              transcript: text.trim(),
              category: finalCategory,
              summary: '',
              mood: 'neutral',
              audioUri: permanentUriRef.current || '',
              audioDuration: 0,
              isPinned: false,
            });

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            backgroundModeRef.current = false;
            discardedRef.current = true;

            // Notify the global title modal
            DeviceEventEmitter.emit('note-ready-for-title', { entryId });

            // Clean up local state
            permanentUriRef.current = null;
            setTranscript('');
            setTranscribeError(null);
            setCategory('other');
            setHasNavigatedToNote(false);
            setIsTranscribing(false);
            setIsCategorizing(false);
            discardRecording();
          } else {
            // Normal mode: show title modal locally
            setShowTitleModal(true);
          }
        } catch (err: any) {
          console.error('[RecordScreen] Transcribe failed:', err);
          if (!processingCancelledRef.current && !discardedRef.current) setTranscribeError(err.message || 'Transcription failed');
        } finally {
          if (!discardedRef.current || processingCancelledRef.current) setIsTranscribing(false);
        }
      };

      runTranscribe();
    }
  }, [state.status]);

  const handleRecordPress = async () => {
    try {
      if (state.isRecording) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await stopRecording();
      } else {
        discardedRef.current = false;
        processingCancelledRef.current = false;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await startRecording();
      }
    } catch (err) {
      // Permission denied or other error
    }
  };

  const handlePausePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state.isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const handleDiscard = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If not recording and no uri, just go back
    if (state.status === 'idle') {
      navigation.goBack();
      return;
    }

    // During transcription/categorization, offer Run in Background option
    if (isTranscribing || isCategorizing) {
      Alert.alert(
        'Recording in Progress',
        'Transcription is in progress. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run in Background',
            onPress: async () => {
              backgroundModeRef.current = true;
              navigation.navigate('Home');
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              discardedRef.current = true;
              processingCancelledRef.current = true;
              if (permanentUriRef.current) {
                deleteAudioFile(permanentUriRef.current);
                permanentUriRef.current = null;
              }
              setShowTitleModal(false);
              setTitleInput('');
              setTranscript('');
              setTranscribeError(null);
              setCategory('other');
              setHasNavigatedToNote(false);
              setIsTranscribing(false);
              setIsCategorizing(false);
              discardRecording();
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Discard Recording?',
      'Are you sure you want to delete this recording?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            discardedRef.current = true;
            if (permanentUriRef.current) {
              deleteAudioFile(permanentUriRef.current);
              permanentUriRef.current = null;
            }
            setShowTitleModal(false);
            setTitleInput('');
            setTranscript('');
            setTranscribeError(null);
            setCategory('other');
            setHasNavigatedToNote(false);
            discardRecording();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const isSaving = state.status === 'saving';
  const hasRecording = state.status === 'recorded';
  const isRecording = state.status === 'recording';
  const isPaused = state.isPaused;

  // Status label for the timer area
  let statusLabel = 'Max 60 seconds';
  if (isRecording && isPaused) statusLabel = 'Paused';
  else if (isRecording) statusLabel = 'Recording...';
  else if (isTranscribing) statusLabel = 'Transcribing...';
  else if (isCategorizing) statusLabel = 'Categorizing...';
  else if (hasRecording) statusLabel = 'Recording complete';
  else if (isSaving || isSavingNote) statusLabel = 'Saving...';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleDiscard}
          hitSlop={styles.hitSlop}
          disabled={isSaving}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Record Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={[
          styles.timer,
          { color: isSaving || (isRecording && isPaused) ? colors.textMuted : colors.text },
        ]}>
          {formatDuration(state.duration)}
        </Text>
        <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Record / Pause / Stop Buttons */}
      <View style={styles.buttonContainer}>
        {isSaving || isTranscribing || isCategorizing ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : isRecording ? (
          // Recording active: show pause + stop side by side
          <View style={styles.recordingControls}>
            {/* Pause / Resume */}
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.surface }, shadows.sm]}
              onPress={handlePausePress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>

            {/* Stop */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.stopBtn, { backgroundColor: colors.danger }]}
              onPress={handleRecordPress}
              activeOpacity={0.7}
            >
              <Ionicons name="stop" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          // Idle: show record button
          <RecordButton isRecording={false} onPress={handleRecordPress} />
        )}
      </View>

      {/* Playback + Status (animated in after recording) */}
      {hasRecording && (
        <Animated.View
          style={[
            styles.bottomSection,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {/* Play / Pause */}
          <View style={styles.playbackContainer}>
            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={state.isPlaying ? stopPlayback : playRecording}
              activeOpacity={0.7}
            >
              <Ionicons
                name={state.isPlaying ? 'pause' : 'play'}
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            {isTranscribing || isCategorizing ? (
              <View style={styles.statusLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                  {isTranscribing ? 'Transcribing...' : 'Categorizing...'}
                </Text>
              </View>
            ) : hasNavigatedToNote ? (
              <View style={styles.statusSuccess}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Ready to save!
                </Text>
              </View>
            ) : transcribeError ? (
              <View style={styles.statusError}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={[styles.statusText, { color: colors.danger }]}>
                  {transcribeError}
                </Text>
                <TouchableOpacity onPress={() => {
                  const uri = stateRef.current.uri;
                  if (!uri) return;
                  setIsTranscribing(true);
                  setTranscribeError(null);
                  let finalUri = '';
                  saveAudioLocally(uri)
                    .then(permanentUri => {
                      if (!permanentUri) {
                        throw new Error('Storage full. Delete some recordings first.');
                      }
                      finalUri = permanentUri;
                      return transcribeAudio(permanentUri);
                    })
                    .then(async text => {
                      setTranscript(text);
                      let finalCategory: Category = 'other';
                      try {
                        const result = await categorizeEntry(text);
                        finalCategory = result.category;
                        setCategory(finalCategory);
                      } catch (catErr) {
                        console.error('[RecordScreen] Categorize failed:', catErr);
                      }
                      // Open Title Modal on retry success
                      setShowTitleModal(true);
                    })
                    .catch(err => {
                      setTranscribeError(err.message || 'Transcription failed');
                    })
                    .finally(() => {
                      setIsTranscribing(false);
                    });
                }}>
                  <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Discard button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.discardButton, { borderColor: colors.border }]}
              onPress={handleDiscard}
              activeOpacity={0.7}
            >
              <Text style={[styles.discardText, { color: colors.textSecondary }]}>
                Discard
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Title Modal */}
      <Modal
        visible={showTitleModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Don't allow closing without saving — prompt to skip
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              🎙️ Recording saved!
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
                  handleSaveNote(titleInput);
                }
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalSkipBtn, { borderColor: colors.border }]}
                onPress={handleSkipTitle}
                disabled={isSavingNote}
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
                onPress={() => {
                  if (titleInput.trim()) {
                    handleSaveNote(titleInput);
                  }
                }}
                disabled={!titleInput.trim() || isSavingNote}
                activeOpacity={0.7}
              >
                {isSavingNote ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 28,
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
  },
  timerLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    height: 160,
    justifyContent: 'center',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  bottomSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  playbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  statusLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusError: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 30,
  },
  discardButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
  },
  discardText: {
    fontSize: 16,
  },
  // Modal styles
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
