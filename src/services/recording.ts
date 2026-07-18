// Recording service — pure audio functions (no React state)
import { Audio } from 'expo-av';

/**
 * Request microphone permission and configure audio mode for recording.
 * Returns the permission status string.
 */
export const requestRecordingPermission = async (): Promise<string> => {
  const { status } = await Audio.requestPermissionsAsync();
  return status;
};

/**
 * Set audio mode for recording (iOS silent mode support).
 */
export const setRecordingMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
};

/**
 * Reset audio mode after recording stops.
 */
export const resetAudioMode = async () => {
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
};

/**
 * Recording preset optimized for speech-to-text.
 * Mono (instead of stereo) cuts file size ~50% while
 * keeping quality sufficient for accurate transcription.
 */
const SPEECH_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 96000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm;codecs=opus',
    bitsPerSecond: 64000,
  },
};

/**
 * Start a new recording optimized for speech-to-text.
 * Returns the Audio.Recording instance.
 */
export const createRecording = async (): Promise<Audio.Recording> => {
  const { recording } = await Audio.Recording.createAsync(
    SPEECH_RECORDING_OPTIONS
  );
  return recording;
};

/**
 * Stop and unload a recording. Returns the local URI of the audio file.
 */
export const stopRecordingAsync = async (recording: Audio.Recording): Promise<string | null> => {
  await recording.stopAndUnloadAsync();
  return recording.getURI();
};

/**
 * Pause an active recording.
 */
export const pauseRecordingAsync = async (recording: Audio.Recording) => {
  await recording.pauseAsync();
};

/**
 * Resume a paused recording.
 */
export const resumeRecordingAsync = async (recording: Audio.Recording) => {
  await recording.startAsync();
};

/**
 * Play an audio file from a URI. Returns the Sound instance.
 */
export const playAudio = async (uri: string): Promise<Audio.Sound> => {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true }
  );
  return sound;
};

/**
 * Stop playback of a Sound instance.
 */
export const stopAudio = async (sound: Audio.Sound) => {
  await sound.stopAsync();
};

/**
 * Unload a Sound instance to free resources.
 */
export const unloadAudio = async (sound: Audio.Sound) => {
  await sound.unloadAsync();
};
