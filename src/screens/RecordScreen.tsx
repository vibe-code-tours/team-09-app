// RecordScreen
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RecordButton } from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';
import { useTheme } from '../theme/ThemeContext';
import { createShadows } from '../theme';
import { saveAudioLocally } from '../services/audioStorage';
import { transcribeAudio } from '../services/transcription';
import { categorizeEntry } from '../services/categorization';
import { saveEntry } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, Category } from '../types';

export const RecordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { userId } = useAuth();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
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
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('neutral');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const categorizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

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

      // Auto-transcribe after recording finishes
      handleTranscribe();
    }
  }, [state.status]);

  const handleTranscribe = async () => {
    if (!state.uri || isTranscribing) return;
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const permanentUri = await saveAudioLocally(state.uri);
      const text = await transcribeAudio(permanentUri);
      setTranscript(text);
      // Auto-categorize after transcription
      handleCategorize(text);
    } catch (err: any) {
      console.error('[RecordScreen] Transcribe failed:', err);
      setTranscribeError(err.message || 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCategorize = async (text: string) => {
    if (!text.trim()) return;
    setIsCategorizing(true);
    try {
      const result = await categorizeEntry(text);
      setCategory(result.category);
      setSummary(result.summary);
      setMood(result.mood);
    } catch (err: any) {
      console.error('[RecordScreen] Categorize failed:', err);
      // Keep defaults on failure
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
    // Debounce re-categorization on edit
    if (categorizeTimerRef.current) clearTimeout(categorizeTimerRef.current);
    categorizeTimerRef.current = setTimeout(() => {
      handleCategorize(text);
    }, 1000);
  };

  const handleRecordPress = async () => {
    try {
      if (state.isRecording) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await stopRecording();
      } else {
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

  const handleSave = async () => {
    if (!state.uri || !transcript.trim()) return;
    setSaving();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Step 1: Save audio to permanent local storage
      const permanentUri = await saveAudioLocally(state.uri);

      // Step 2: Save entry to SQLite database (category already from local state)
      await saveEntry(userId, {
        transcript,
        category,
        summary,
        mood,
        audioUri: permanentUri,
        audioDuration: state.duration,
        isPinned: false,
      });

      Alert.alert(
        'Saved!',
        `Your entry has been recorded and categorized.`,
        [
          {
            text: 'OK',
            onPress: () => {
              discardRecording();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err) {
      console.error('[RecordScreen] Save failed:', err);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
      discardRecording();
    }
  };

  const handleDiscard = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (categorizeTimerRef.current) clearTimeout(categorizeTimerRef.current);
    setTranscript('');
    setTranscribeError(null);
    setCategory('other');
    setSummary('');
    setMood('neutral');
    discardRecording();
    navigation.goBack();
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
  else if (hasRecording && transcript) statusLabel = 'Ready to save';
  else if (hasRecording) statusLabel = 'Recording complete';
  else if (isSaving) statusLabel = 'Saving...';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (categorizeTimerRef.current) clearTimeout(categorizeTimerRef.current);
            setTranscript('');
            setTranscribeError(null);
            setCategory('other');
            setSummary('');
            setMood('neutral');
            navigation.goBack();
          }}
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

      {/* Playback + Actions (animated in after recording) */}
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

          {/* Scrollable content: category + transcript + actions */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {/* Category Badge */}
            {isCategorizing ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.categoryLoadingText, { color: colors.textMuted }]}>
                  Categorizing...
                </Text>
              </View>
            ) : (
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORIES[category].color + '15', borderColor: CATEGORIES[category].color + '30' }]}>
                <Text style={styles.categoryIcon}>{CATEGORIES[category].icon}</Text>
                <Text style={[styles.categoryLabel, { color: CATEGORIES[category].color }]}>
                  {CATEGORIES[category].label}
                </Text>
              </View>
            )}

            {/* Editable Transcript */}
            <View style={[styles.transcriptBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isTranscribing ? (
                <View style={styles.transcriptLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.transcriptLoadingText, { color: colors.textMuted }]}>
                    Transcribing...
                  </Text>
                </View>
              ) : transcribeError ? (
                <View style={styles.transcriptError}>
                  <Text style={[styles.transcriptErrorText, { color: colors.danger }]}>
                    {transcribeError}
                  </Text>
                  <TouchableOpacity onPress={handleTranscribe}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.transcriptInput, { color: colors.text }]}
                  value={transcript}
                  onChangeText={handleTranscriptChange}
                  multiline
                  placeholder="Your transcript will appear here..."
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
              )}
            </View>

            {/* Discard + Save */}
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
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: transcript.trim() ? colors.primary : colors.textMuted }]}
                onPress={handleSave}
                disabled={!transcript.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.saveText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  saveButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 25,
  },
  saveText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  categoryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  categoryLoadingText: {
    fontSize: 13,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
  },
  transcriptInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
  },
  transcriptLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 100,
  },
  transcriptLoadingText: {
    fontSize: 14,
  },
  transcriptError: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  transcriptErrorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
