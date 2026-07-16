// Categorization — delegates to the custom AI service
import { CategorizedEntry } from '../types';
import { categorizeEntryOpenAI } from './categorizationOpenAI';

/**
 * Categorize a transcript using the custom AI provider.
 */
export async function categorizeEntrySmart(
  _userId: string,
  transcript: string
): Promise<CategorizedEntry> {
  return categorizeEntryOpenAI(transcript);
}
