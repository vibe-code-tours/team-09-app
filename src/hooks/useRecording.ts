// Custom hook for audio recording
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { RecordingState } from '../types';
import {
  requestRecordingPermission,
  setRecordingMode,
  resetAudioMode,
  createRecording,
  stopRecordingAsync,
  pauseRecordingAsync,
  resumeRecordingAsync,
  playAudio,
  stopAudio,
  unloadAudio,
} from '../services/recording';

const MAX_DURATION = 60;

export const useRecording = () => {
  const [state, setState] = useState<RecordingState>({
    status: 'idle',
    isRecording: false,
    isPaused: false,
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

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 1;
        if (newDuration >= MAX_DURATION) { stopRecording(); return prev; }
        return { ...prev, duration: newDuration };
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    const permission = await requestRecordingPermission();
    if (permission !== 'granted') throw new Error('Permission denied');

    await setRecordingMode();
    const recording = await createRecording();
    recordingRef.current = recording;
    setState(prev => ({ ...prev, status: 'recording', isRecording: true, isPaused: false, duration: 0 }));
    startTimer();
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return null;
    clearTimer();
    const uri = await stopRecordingAsync(recordingRef.current);
    await resetAudioMode();
    recordingRef.current = null;
    setState(prev => ({ ...prev, status: 'recorded', isRecording: false, isPaused: false, uri }));
    return uri;
  };

  const pauseRecording = async () => {
    if (!recordingRef.current) return;
    clearTimer();
    await pauseRecordingAsync(recordingRef.current);
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeRecording = async () => {
    if (!recordingRef.current) return;
    await resumeRecordingAsync(recordingRef.current);
    setState(prev => ({ ...prev, isPaused: false }));
    startTimer();
  };

  const playRecording = async () => {
    if (!state.uri) return;
    if (soundRef.current) await unloadAudio(soundRef.current);
    const sound = await playAudio(state.uri);
    soundRef.current = sound;
    setState(prev => ({ ...prev, isPlaying: true }));
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setState(prev => ({ ...prev, isPlaying: false }));
    });
  };

  const stopPlayback = async () => {
    if (soundRef.current) { await stopAudio(soundRef.current); setState(prev => ({ ...prev, isPlaying: false })); }
  };

  const setSaving = () => {
    setState(prev => ({ ...prev, status: 'saving' }));
  };

  const discardRecording = async () => {
    clearTimer();
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    if (soundRef.current) { await unloadAudio(soundRef.current); soundRef.current = null; }
    await resetAudioMode();
    setState({ status: 'idle', isRecording: false, isPaused: false, isPlaying: false, duration: 0, uri: null });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
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
  };
};
