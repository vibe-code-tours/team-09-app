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
import { saveEntry, updateEntry } from '../services/storage';
import { Category } from '../types';

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

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  // Reset navigation guard when screen is idle or starting recording
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'recording') {
      setHasNavigatedToNote(false);
      discardedRef.current = false;
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
          if (discardedRef.current) return;

          // Handle storage limit reached
          if (!permanentUri) {
            setTranscribeError('Storage full. Please delete some recordings first.');
            setIsTranscribing(false);
            return;
          }

          permanentUriRef.current = permanentUri;
          const text = await transcribeAudio(permanentUri);
          if (discardedRef.current) return;
          setTranscript(text);

          // Auto-categorize
          if (!text.trim()) return;
          setIsCategorizing(true);
          let finalCategory: Category = 'other';
          try {
            const result = await categorizeEntry(text);
            if (discardedRef.current) return;
            finalCategory = result.category;
          } catch (catErr: any) {
            console.error('[RecordScreen] Categorize failed:', catErr);
          } finally {
            if (!discardedRef.current) setIsCategorizing(false);
          }

          if (discardedRef.current) return;

          // Redirect directly to CreateNote screen
          navigateToCreateNote(text, finalCategory, permanentUri);
        } catch (err: any) {
          console.error('[RecordScreen] Transcribe failed:', err);
          if (!discardedRef.current) setTranscribeError(err.message || 'Transcription failed');
        } finally {
          if (!discardedRef.current) setIsTranscribing(false);
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

  // Generate a title from the first few words of the transcript
  const generateTitle = (text: string): string => {
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.length > 0 ? words : 'Voice Note';
  };

  // Process and save in background — runs after user navigates away
  const processInBackground = async (audioUri: string) => {
    try {
      const permanentUri = await saveAudioLocally(audioUri);
      if (!permanentUri) {
        console.warn('[RecordScreen] Background save failed: storage full');
        return;
      }

      // Save note immediately with empty title so it appears on HomeScreen
      const entryId = await saveEntry(userId, {
        title: '',
        transcript: '',
        category: 'other',
        summary: '',
        mood: 'neutral',
        audioUri: permanentUri,
        audioDuration: 0,
        isPinned: false,
      });

      // Transcribe
      const text = await transcribeAudio(permanentUri);
      if (!text.trim()) return;

      // Categorize
      let finalCategory: Category = 'other';
      try {
        const result = await categorizeEntry(text);
        finalCategory = result.category;
      } catch {
        // Use default category
      }

      // Update the note with transcript and category
      await updateEntry(entryId, {
        transcript: text.trim(),
        category: finalCategory,
      });

      // Notify HomeScreen that a note is ready for title
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('note-ready-for-title', { entryId });
      console.log('[RecordScreen] Background processing completed:', entryId);
    } catch (err) {
      console.error('[RecordScreen] Background save failed:', err);
    }
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
  else if (isSaving) statusLabel = 'Saving...';

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
        {isSaving ? (
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
                      } catch (catErr) {
                        console.error('[RecordScreen] Categorize failed:', catErr);
                      }
                      navigateToCreateNote(text, finalCategory, finalUri);
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
});
