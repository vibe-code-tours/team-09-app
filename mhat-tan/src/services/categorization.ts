// Gemini Categorization Service — calls Firebase Cloud Function (API key stays server-side)
import { CategorizedEntry, Category } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../config/firebase';

interface CategorizeResult {
  category: string;
  summary: string;
  items: string[];
  mood: string;
  date: string;
}

const functions = getFunctions(app);
const categorizeCallable = httpsCallable<{ transcript: string }, CategorizeResult>(
  functions,
  'categorizeEntry'
);

export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
  const result = await categorizeCallable({ transcript });
  const data = result.data;

  const valid: Category[] = ['money', 'feelings', 'work', 'health', 'ideas', 'other'];
  return {
    category: valid.includes(data.category as Category) ? (data.category as Category) : 'other',
    summary: data.summary || '',
    items: data.items || [],
    mood: data.mood || 'neutral',
    date: data.date || 'today',
  };
};
