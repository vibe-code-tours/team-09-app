// Cloudflare Worker Proxy Client
// Sends requests to your Cloudflare Worker, which holds API keys server-side.
// The worker URL should be set in your .env as EXPO_PUBLIC_WORKER_URL.

import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || '';
const PROXY_SECRET = process.env.EXPO_PUBLIC_PROXY_SECRET || '';

function getWorkerUrl(): string {
  if (!WORKER_URL) {
    throw new Error(
      'Worker URL not configured. Set EXPO_PUBLIC_WORKER_URL in .env (e.g. https://mhat-tan-worker.your-name.workers.dev)'
    );
  }
  return WORKER_URL.replace(/\/$/, '');
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (PROXY_SECRET) {
    headers['X-Proxy-Secret'] = PROXY_SECRET;
  }
  return headers;
}

/**
 * Call the /transcribe endpoint on the Cloudflare Worker.
 * Reads the audio file as base64, sends to worker, worker proxies to ElevenLabs.
 */
export const proxyTranscribeAudio = async (audioUri: string): Promise<string> => {
  const baseUrl = getWorkerUrl();

  // Read audio file as base64
  const audioBase64 = await readAsStringAsync(audioUri, {
    encoding: EncodingType.Base64,
  });

  const mimeType = audioUri.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';

  const response = await fetch(`${baseUrl}/transcribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Transcription failed (${response.status})`);
  }

  const result = await response.json();
  return result.text as string;
};

/**
 * Call the /categorize endpoint on the Cloudflare Worker.
 * Sends transcript text, worker proxies to the AI API.
 */
export const proxyCategorizeEntry = async (transcript: string): Promise<{
  category: string;
  title: string;
  summary: string;
  items: string[];
  mood: string;
  date: string;
}> => {
  const baseUrl = getWorkerUrl();

  const response = await fetch(`${baseUrl}/categorize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Categorization failed (${response.status})`);
  }

  const result = await response.json();
  return result as {
    category: string;
    title: string;
    summary: string;
    items: string[];
    mood: string;
    date: string;
  };
};

/**
 * Call the /weekly-summary endpoint on the Cloudflare Worker.
 * Sends entries data, worker proxies to the AI API.
 */
export const proxyWeeklySummary = async (entries: Array<{
  date: string;
  category: string;
  mood: string;
  summary: string;
}>): Promise<{
  summaryMy: string;
  summaryEn: string;
  categoryBreakdown: Record<string, number>;
  moodTrend: Array<{ date: string; mood: string }>;
}> => {
  const baseUrl = getWorkerUrl();

  const response = await fetch(`${baseUrl}/weekly-summary`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ entries }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Weekly summary failed (${response.status})`);
  }

  const result = await response.json();
  return result as {
    summaryMy: string;
    summaryEn: string;
    categoryBreakdown: Record<string, number>;
    moodTrend: Array<{ date: string; mood: string }>;
  };
};
