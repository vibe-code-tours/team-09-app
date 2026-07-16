// OpenAI-compatible Categorization Service
import { CategorizedEntry, Category } from '../types';

const API_URL = process.env.EXPO_PUBLIC_OPENAI_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';

export const categorizeEntryOpenAI = async (transcript: string): Promise<CategorizedEntry> => {
  if (!API_URL || !API_KEY) {
    throw new Error(
      'Custom AI not configured. Set EXPO_PUBLIC_OPENAI_API_URL and EXPO_PUBLIC_OPENAI_API_KEY in .env'
    );
  }

  const prompt = `Categorize this Burmese voice entry into ONE category: money, feelings, work, health, ideas, or other.
Return ONLY this JSON: {"category":"...","summary":"brief summary","items":["key points"],"mood":"happy|sad|neutral|excited|stressed|grateful","date":"today or date"}

Entry: "${transcript}"`;

  const url = API_URL.replace(/\/+$/, '') + '/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Custom AI categorization failed (${response.status}): ${errBody}`);
  }

  const result = await response.json();

  const text = result?.choices?.[0]?.message?.content;
  if (!text) {
    console.warn('[Categorization:Custom] Empty response:', JSON.stringify(result));
    return {
      category: 'other',
      summary: transcript.slice(0, 100),
      items: [],
      mood: 'neutral',
      date: 'today',
    };
  }

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      console.warn('[Categorization:Custom] Could not parse response:', text);
      return {
        category: 'other',
        summary: transcript.slice(0, 100),
        items: [],
        mood: 'neutral',
        date: 'today',
      };
    }
  }

  const valid: Category[] = ['money', 'feelings', 'work', 'health', 'ideas', 'other'];
  return {
    category: valid.includes(parsed.category) ? parsed.category : 'other',
    summary: parsed.summary || '',
    items: parsed.items || [],
    mood: parsed.mood || 'neutral',
    date: parsed.date || 'today',
  };
};
