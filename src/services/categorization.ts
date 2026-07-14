// Gemini Categorization Service
import { CategorizedEntry, Category } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
  const prompt = `Categorize this entry into: money, feelings, work, health, ideas, or other.
Return JSON: { "category": "...", "summary": "English summary", "items": ["item1"], "mood": "mood", "date": "today" }
Entry: "${transcript}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const result = await response.json();
  const text = result.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

  const valid: Category[] = ['money', 'feelings', 'work', 'health', 'ideas', 'other'];
  return {
    category: valid.includes(parsed.category) ? parsed.category : 'other',
    summary: parsed.summary || '',
    items: parsed.items || [],
    mood: parsed.mood || 'neutral',
    date: parsed.date || 'today',
  };
};
