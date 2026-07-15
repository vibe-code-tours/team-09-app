// RecordScreen
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  ActivityIndicator,
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
    }
  }, [state.status]);

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
    if (!state.uri) return;
    setSaving();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Step 1: Save audio to permanent local storage
      const permanentUri = await saveAudioLocally(state.uri);

      // Step 2: Transcribe audio (ElevenLabs)
      const transcript = await transcribeAudio(permanentUri);

      // Step 3: Categorize transcript (Gemini)
      const categorized = await categorizeEntry(transcript);

      // Step 4: Save entry to SQLite database
      await saveEntry(userId, {
        transcript,
        category: categorized.category,
        summary: categorized.summary,
        mood: categorized.mood,
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
  else if (hasRecording) statusLabel = 'Recording complete';
  else if (isSaving) statusLabel = 'Processing...';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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

          {/* Discard + Save */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.discardButton,
                { borderColor: colors.border },
              ]}
              onPress={handleDiscard}
              activeOpacity={0.7}
            >
              <Text style={[styles.discardText, { color: colors.textSecondary }]}>
                Discard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={styles.saveText}>Save Entry</Text>
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
});
