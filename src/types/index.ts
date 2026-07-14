// Mhat Tan - Type Definitions
// Category types for entries

export type Category = 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other';

/**
 * App-facing entry type — simplified view of the DB schema.
 * Maps to/from Drizzle's `Entry` type in src/db/schema.ts.
 */
export interface Entry {
  id: string;
  transcript: string;
  category: Category;
  summary: string;
  mood: string;
  audioUri: string;
  audioDuration: number; // seconds — recording length
  createdAt: Date;
  isPinned: boolean;
  userId: string;
}

/**
 * Result from AI categorization service.
 */
export interface CategorizedEntry {
  category: Category;
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
  money: { icon: '💰', label: 'Money', color: '#4CAF50' },
  feelings: { icon: '😊', label: 'Feelings', color: '#E91E63' },
  work: { icon: '💼', label: 'Work', color: '#2196F3' },
  health: { icon: '🏥', label: 'Health', color: '#FF9800' },
  ideas: { icon: '💡', label: 'Ideas', color: '#9C27B0' },
  other: { icon: '📝', label: 'Other', color: '#607D8B' },
} as const;
