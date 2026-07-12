// Custom hook for audio recording
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { RecordingState } from '../types';

const MAX_DURATION = 60;

export const useRecording = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    duration: 0,
    uri: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setState(prev => ({ ...prev, isRecording: true, duration: 0 }));

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 1;
        if (newDuration >= MAX_DURATION) { stopRecording(); return prev; }
        return { ...prev, duration: newDuration };
      });
    }, 1000);
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    recordingRef.current = null;
    setState(prev => ({ ...prev, isRecording: false, uri }));
    return uri;
  };

  const playRecording = async () => {
    if (!state.uri) return;
    if (soundRef.current) await soundRef.current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: state.uri }, { shouldPlay: true });
    soundRef.current = sound;
    setState(prev => ({ ...prev, isPlaying: true }));
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setState(prev => ({ ...prev, isPlaying: false }));
    });
  };

  const stopPlayback = async () => {
    if (soundRef.current) { await soundRef.current.stopAsync(); setState(prev => ({ ...prev, isPlaying: false })); }
  };

  const discardRecording = async () => {
    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    setState({ isRecording: false, isPlaying: false, duration: 0, uri: null });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { state, startRecording, stopRecording, playRecording, stopPlayback, discardRecording, formatDuration };
};
