// AudioPlayer - Reusable audio player with play/pause, seek slider, and time display
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

  const seekTo = async (millis: number) => {
    const sound = soundRef.current;
    if (!sound) return;

    try {
      await sound.setPositionAsync(Math.max(0, Math.min(millis, duration)));
    } catch (error) {
      console.error('Error seeking:', error);
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

  // Full mode for CreateNote screen — with seek slider
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
          size={22}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Progress section */}
      <View style={styles.progressSection}>
        {/* Time labels */}
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
            -{formatTime(duration - position)}
          </Text>
        </View>

        {/* Seek slider */}
        <View style={[styles.sliderTrack, { backgroundColor: theme.colors.border }]}>
          {/* Filled progress */}
          <View
            style={[
              styles.sliderFill,
              { width: `${progress * 100}%`, backgroundColor: theme.colors.primary },
            ]}
          />
          {/* Touchable overlay for seeking */}
          <SeekBar
            progress={progress}
            onSeek={(ratio) => seekTo(ratio * duration)}
            trackColor={theme.colors.border}
            fillColor={theme.colors.primary}
          />
        </View>

        {/* Duration label */}
        <Text style={[styles.durationText, { color: theme.colors.textMuted }]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

// ── SeekBar — custom touch seek slider ──────────────────────────
function SeekBar({
  progress,
  onSeek,
  trackColor,
  fillColor,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
  trackColor: string;
  fillColor: string;
}) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const handleLayout = useCallback((event: any) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const handleTouchEnd = useCallback(
    (event: any) => {
      if (trackWidth <= 0) return;
      const { locationX } = event.nativeEvent;
      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      onSeek(ratio);
    },
    [trackWidth, onSeek]
  );

  return (
    <View
      ref={trackRef}
      style={styles.sliderContainer}
      onLayout={handleLayout}
      onTouchEnd={handleTouchEnd}
    >
      {/* Thumb */}
      <View
        style={[
          styles.sliderThumb,
          {
            left: `${progress * 100}%`,
            backgroundColor: fillColor,
            borderColor: trackColor,
          },
        ]}
      />
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timeText: {
    fontSize: 12,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 3,
  },
  sliderContainer: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 18,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    position: 'absolute',
    top: 1,
    marginLeft: -8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  durationText: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  // Compact mode
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
