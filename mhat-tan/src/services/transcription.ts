// ElevenLabs Transcription Service — calls Firebase Cloud Function (API key stays server-side)
import * as FileSystem from 'expo-file-system';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../config/firebase';

const functions = getFunctions(app);
const transcribeCallable = httpsCallable<{ audioBase64: string; mimeType: string }, { text: string }>(
  functions,
  'transcribeAudio'
);

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  // Read audio file as base64 — the cloud function handles the ElevenLabs API call
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const result = await transcribeCallable({ audioBase64: base64, mimeType: 'audio/m4a' });
  return result.data.text;
};
