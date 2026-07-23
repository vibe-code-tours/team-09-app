// ElevenLabs Transcription Service
// Calls Cloudflare Worker proxy instead of ElevenLabs directly.
// API key lives server-side — never in the mobile bundle.

import { proxyTranscribeAudio } from './proxyClient';

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  return proxyTranscribeAudio(audioUri);
};
