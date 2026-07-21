// Weekly Summary AI Service
import { Category } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_VIBE_CODE_API_KEY;
const BASE_URL = process.env.EXPO_PUBLIC_VIBE_CODE_BASE_URL || 'https://proxy.vibecode.tours/v1';
const MODEL = process.env.EXPO_PUBLIC_VIBE_CODE_MODEL || 'mimo-v2.5-pro';

/**
 * Compute the current week's Monday 00:00 and Sunday 23:59.
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

/**
 * Format a date range as a human-readable string.
 */
export function formatWeekRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString('en-US', opts);
  const e = end.toLocaleDateString('en-US', opts);
  return `${s} – ${e}`;
}

interface WeeklySummaryInput {
  transcript: string;
  category: string;
  summary: string;
  mood: string;
  occurredAt: Date;
}

interface WeeklySummaryResult {
  summaryMy: string;
  summaryEn: string;
  categoryBreakdown: Record<Category, number>;
  moodTrend: { date: string; mood: string }[];
}

/**
 * Generate an AI-powered weekly summary from the week's entries.
 * Returns both Burmese and English summaries plus stats.
 */
export const generateWeeklySummary = async (
  entries: WeeklySummaryInput[]
): Promise<WeeklySummaryResult> => {
  if (!API_KEY) {
    throw new Error('Custom AI API key not configured. Set EXPO_PUBLIC_VIBE_CODE_API_KEY in .env');
  }

  // Build entry summaries for the prompt
  const entrySummaries = entries.map((e, i) => {
    const date = e.occurredAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${i + 1}. [${date}] Category: ${e.category} | Mood: ${e.mood} | Summary: ${e.summary}`;
  }).join('\n');

  const prompt = `You are a weekly journal summarizer for a Burmese speaker using a voice diary app.

Here are this week's voice entries:
${entrySummaries}

Generate a weekly summary. Return JSON with:
{
  "summaryMy": "Weekly summary in Burmese (မြန်မာ). Write naturally as if talking to the user about their week. 2-3 paragraphs.",
  "summaryEn": "Weekly summary in English. Write naturally as if talking to the user about their week. 2-3 paragraphs.",
  "categoryBreakdown": { "feelings": 0, "work": 0, "health": 0, "ideas": 0, "money": 0, "other": 0 },
  "moodTrend": [{ "date": "Mon", "mood": "happy" }]
}

Requirements:
- summaryMy MUST be in Burmese (မြန်မာဘာသာ)
- summaryEn MUST be in English
- Both summaries should highlight themes, patterns, and notable moments
- categoryBreakdown: count entries per category
- moodTrend: one entry per day that has entries, using day name (Mon, Tue, etc.)`;

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
    throw new Error(`Weekly summary failed (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;

  if (!text) {
    console.warn('[WeeklySummary] Empty response:', JSON.stringify(result));
    return {
      summaryMy: 'ဒီအပတ်အတွက် အကျဉ်းချုပ် ရရှိမှာ မဟုတ်ပါ။',
      summaryEn: 'No summary available for this week.',
      categoryBreakdown: { feelings: 0, work: 0, health: 0, ideas: 0, money: 0, other: 0 },
      moodTrend: [],
    };
  }

  const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

  const validCategories: Category[] = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];
  const categoryBreakdown: Record<Category, number> = {
    feelings: 0, work: 0, health: 0, ideas: 0, money: 0, other: 0,
  };
  if (parsed.categoryBreakdown && typeof parsed.categoryBreakdown === 'object') {
    for (const key of validCategories) {
      categoryBreakdown[key] = parsed.categoryBreakdown[key] || 0;
    }
  }

  return {
    summaryMy: parsed.summaryMy || '',
    summaryEn: parsed.summaryEn || '',
    categoryBreakdown,
    moodTrend: Array.isArray(parsed.moodTrend) ? parsed.moodTrend : [],
  };
};
