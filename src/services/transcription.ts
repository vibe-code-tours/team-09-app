// ElevenLabs Transcription Service
const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error('ElevenLabs API key not configured. Set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env');
  }

  const formData = new FormData();
  formData.append('file', { uri: audioUri, type: 'audio/m4a', name: 'recording.m4a' } as any);
  formData.append('model_id', 'scribe_v2');
  formData.append('language_code', 'my');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: formData,
  });

  if (!response.ok) {
    let detail = 'Unknown error';
    try {
      const errBody = await response.json();
      detail = errBody?.detail?.message || errBody?.detail || JSON.stringify(errBody);
    } catch {
      detail = await response.text().catch(() => 'Could not read error body');
    }
    throw new Error(`Transcription failed (${response.status}): ${detail}`);
  }

  const result = await response.json();
  return result.text;
};
