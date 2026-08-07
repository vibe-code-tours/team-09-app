// RecordScreen
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { createShadows, spacing, radius } from '../theme';
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

// Moods allowed by the entries_mood_check DB constraint.
const VALID_MOODS = ['happy', 'sad', 'neutral', 'excited', 'stressed', 'grateful'] as const;
const normalizeMood = (mood: string | undefined | null): string =>
  mood && (VALID_MOODS as readonly string[]).includes(mood) ? mood : 'neutral';

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
  const [mood, setMood] = useState<string>('neutral');
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
  const moodRef = useRef(mood);
  moodRef.current = mood;
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
    setMood('neutral');
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
    setMood('neutral');
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
        mood: moodRef.current,
        audioUri,
        audioDuration: stateRef.current.duration,
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
          let finalMood: string = 'neutral';
          if (text.trim()) {
            setIsCategorizing(true);
            try {
              const result = await categorizeEntry(text);
              if (processingCancelledRef.current || (discardedRef.current && !backgroundModeRef.current)) return;
              finalCategory = result.category;
              finalMood = normalizeMood(result.mood);
              setCategory(finalCategory); // Update category state/ref
              setMood(finalMood); // Update mood state/ref
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
              mood: finalMood,
              audioUri: permanentUriRef.current || '',
              audioDuration: stateRef.current.duration,
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
            setMood('neutral');
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
            setMood('neutral');
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
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
        <View style={[styles.buttonContainer, (isTranscribing || isCategorizing) && styles.buttonContainerCompact]}>
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
                          setMood(normalizeMood(result.mood));
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
      </ScrollView>

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
  screenScroll: {
    flex: 1,
  },
  screenScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
    paddingVertical: spacing.xxl,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
  },
  timerLabel: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    minHeight: 140,
    justifyContent: 'center',
  },
  buttonContainerCompact: {
    minHeight: 64,
    paddingVertical: spacing.md,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
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
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  playbackContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl + spacing.sm,
  },
  statusLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusError: {
    alignItems: 'center',
    gap: spacing.sm,
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
    paddingHorizontal: spacing.xxxl + spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  discardButton: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
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
    paddingHorizontal: spacing.xxxl,
  },
  modalContent: {
    width: '100%',
    borderRadius: radius.xl,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
