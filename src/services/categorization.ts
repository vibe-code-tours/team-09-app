// Custom AI Categorization Service (OpenAI-compatible proxy)
import { CategorizedEntry, Category } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_VIBE_CODE_API_KEY;
const BASE_URL = process.env.EXPO_PUBLIC_VIBE_CODE_BASE_URL || 'https://proxy.vibecode.tours/v1';
const MODEL = process.env.EXPO_PUBLIC_VIBE_CODE_MODEL || 'mimo-v2.5-pro';

export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
  if (!API_KEY) {
    throw new Error('Custom AI API key not configured. Set EXPO_PUBLIC_VIBE_CODE_API_KEY in .env');
  }

  const prompt = `Categorize this Burmese voice entry into: feelings, work, health, ideas, money, or other.
Generate a short title (max 5 words) that captures the main topic.
Return JSON: { "category": "...", "title": "short title", "summary": "English summary", "items": ["item1"], "mood": "mood", "date": "today" }
Entry: "${transcript}"`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Categorization failed (${response.status}): ${errBody}`);
  }

  const result = await response.json();

  // Validate response structure — handle empty or malformed responses
  const text = result?.choices?.[0]?.message?.content;
  if (!text) {
    console.warn('[Categorization] Empty response:', JSON.stringify(result));
    // Return a safe default instead of crashing
    return {
      category: 'other',
      title: transcript.slice(0, 30),
      summary: transcript.slice(0, 100),
      items: [],
      mood: 'neutral',
      date: 'today',
    };
  }

  const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

  const valid: Category[] = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];
  return {
    category: valid.includes(parsed.category) ? parsed.category : 'other',
    title: parsed.title || transcript.slice(0, 30),
    summary: parsed.summary || '',
    items: parsed.items || [],
    mood: parsed.mood || 'neutral',
    date: parsed.date || 'today',
  };
};
