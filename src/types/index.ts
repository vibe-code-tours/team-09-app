// Mhat Tan - Type Definitions
// Category types for entries

export type Category = 'feelings' | 'work' | 'health' | 'ideas' | 'money' | 'other';

/**
 * App-facing entry type — simplified view of the DB schema.
 * Maps to/from Drizzle's `Entry` type in src/db/schema.ts.
 */
export interface Entry {
  id: string;
  transcript: string;
  category: Category;
  title: string;
  summary: string;
  mood: string;
  audioUri: string;
  audioDuration: number; // seconds — recording length
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  userId: string;
}

/**
 * Result from AI categorization service.
 */
export interface CategorizedEntry {
  category: Category;
  title: string;
  summary: string;
  items: string[];
  mood: string;
  date: string;
}

export type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'saving';

export interface RecordingState {
  status: RecordingStatus;
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  duration: number;
  uri: string | null;
}

export const CATEGORIES = {
  feelings: { icon: '😊', label: 'Feelings', color: '#E91E63' },
  work: { icon: '💼', label: 'Work', color: '#2196F3' },
  health: { icon: '🏥', label: 'Health', color: '#FF9800' },
  ideas: { icon: '💡', label: 'Ideas', color: '#9C27B0' },
  money: { icon: '💰', label: 'Money', color: '#4CAF50' },
  other: { icon: '📝', label: 'Other', color: '#607D8B' },
} as const;

/**
 * AI-generated weekly summary with stats.
 */
export interface WeeklySummary {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  summaryMy: string;
  summaryEn: string;
  categoryBreakdown: Record<Category, number>;
  moodTrend: { date: string; mood: string }[];
  entryCount: number;
  totalDuration: number; // seconds
  language: 'my' | 'en';
  createdAt: Date;
}
