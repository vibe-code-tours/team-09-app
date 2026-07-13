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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RecordButton } from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';
import { useTheme } from '../theme/ThemeContext';

export const RecordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const {
    state,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    discardRecording,
    formatDuration,
  } = useRecording();

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  // Animate playback + action buttons in when recording finishes
  useEffect(() => {
    if (state.uri && !state.isRecording) {
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
  }, [state.uri, state.isRecording]);

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
      // Permission denied or other error — useRecording throws
    }
  };

  const handleSave = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved!', 'Entry saved successfully', [
      {
        text: 'OK',
        onPress: () => {
          discardRecording();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDiscard = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    discardRecording();
    navigation.goBack();
  };

  const hasRecording = state.uri && !state.isRecording;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hitSlop}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Record Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timer, { color: colors.text }]}>
          {formatDuration(state.duration)}
        </Text>
        <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
          {state.isRecording ? 'Recording...' : 'Max 60 seconds'}
        </Text>
      </View>

      {/* Record Button */}
      <View style={styles.buttonContainer}>
        <RecordButton isRecording={state.isRecording} onPress={handleRecordPress} />
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
