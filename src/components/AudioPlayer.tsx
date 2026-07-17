// AudioPlayer - Reusable audio player with play/pause, progress bar, and time display
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme';

interface AudioPlayerProps {
  audioUri: string;
  compact?: boolean;
  autoPlay?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export default function AudioPlayer({
  audioUri,
  compact = false,
  autoPlay = false,
  onPlaybackStatusUpdate,
}: AudioPlayerProps) {
  const { theme } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const onPlaybackStatusUpdateInternal = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
    onPlaybackStatusUpdate?.(status);
  }, [onPlaybackStatusUpdate]);

  useEffect(() => {
    let cancelled = false;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: autoPlay },
          onPlaybackStatusUpdateInternal
        );
        if (!cancelled) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [audioUri, autoPlay, onPlaybackStatusUpdateInternal]);

  const togglePlayback = async () => {
    const sound = soundRef.current;
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  // Compact mode for HomeScreen entry cards
  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
        ]}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={14}
          color={theme.colors.primary}
        />
        {duration > 0 && (
          <Text style={[styles.compactTime, { color: theme.colors.textMuted }]}>
            {formatTime(duration)}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Full mode for CreateNote screen
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
      {/* Play/Pause button */}
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Progress section */}
      <View style={styles.progressSection}>
        {/* Progress bar */}
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: theme.colors.primary },
            ]}
          />
        </View>

        {/* Time display */}
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
            -{formatTime(duration - position)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  compactTime: {
    fontSize: 11,
    marginLeft: spacing.xs,
  },
});
