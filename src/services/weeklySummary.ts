// Weekly Summary AI Service
// Calls Cloudflare Worker proxy instead of the AI API directly.
// API key lives server-side — never in the mobile bundle.

import { proxyWeeklySummary } from './proxyClient';
import { Category } from '../types';

/**
 * Compute the Monday 00:00 → Sunday 23:59 week containing a reference date.
 */
export function getWeekForDate(referenceDate: Date): { start: Date; end: Date } {
  const day = referenceDate.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

/**
 * Compute the current week's Monday 00:00 and Sunday 23:59.
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  return getWeekForDate(new Date());
}

/**
 * Format a date range as a human-readable string.
 * Appends the year when the week starts in a year other than the current one,
 * so past-year ranges (e.g. "Dec 29 – Jan 4, 2025") stay unambiguous.
 */
export function formatWeekRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString('en-US', opts);
  const e = end.toLocaleDateString('en-US', opts);
  const range = `${s} – ${e}`;
  const startYear = start.getFullYear();
  if (startYear !== new Date().getFullYear()) {
    return `${range}, ${startYear}`;
  }
  return range;
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
  // Map entries to the format expected by the worker proxy
  const proxyEntries = entries.map((e) => ({
    date: e.occurredAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    category: e.category,
    mood: e.mood,
    summary: e.summary,
  }));

  const result = await proxyWeeklySummary(proxyEntries);
  const validCategories: Category[] = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];

  const categoryBreakdown: Record<Category, number> = {
    feelings: 0, work: 0, health: 0, ideas: 0, money: 0, other: 0,
  };
  if (result.categoryBreakdown && typeof result.categoryBreakdown === 'object') {
    for (const key of validCategories) {
      categoryBreakdown[key] = result.categoryBreakdown[key] || 0;
    }
  }

  return {
    summaryMy: result.summaryMy || '',
    summaryEn: result.summaryEn || '',
    categoryBreakdown,
    moodTrend: Array.isArray(result.moodTrend) ? result.moodTrend : [],
  };
};
