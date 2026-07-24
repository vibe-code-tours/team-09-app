// AI Categorization Service
// Calls Cloudflare Worker proxy instead of the AI API directly.
// API key lives server-side — never in the mobile bundle.

import { proxyCategorizeEntry } from './proxyClient';
import { CategorizedEntry, Category } from '../types';

export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
  const result = await proxyCategorizeEntry(transcript);

  const valid: Category[] = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];

  return {
    category: valid.includes(result.category as Category) ? (result.category as Category) : 'other',
    title: result.title || transcript.slice(0, 30),
    summary: result.summary || '',
    items: result.items || [],
    mood: result.mood || 'neutral',
    date: result.date || 'today',
  };
};
