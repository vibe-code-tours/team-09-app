// Gemini Categorization Service
import { CategorizedEntry, Category } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  const prompt = `Categorize this Burmese voice entry into: feelings, work, health, ideas, money, or other.
Generate a short title (max 5 words) that captures the main topic.
Return JSON: { "category": "...", "title": "short title", "summary": "English summary", "items": ["item1"], "mood": "mood", "date": "today" }
Entry: "${transcript}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Categorization failed (${response.status}): ${errBody}`);
  }

  const result = await response.json();

  // Validate response structure — handle safety blocks or empty responses
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.warn('[Categorization] Empty or blocked response:', JSON.stringify(result));
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
