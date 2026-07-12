// Mhat Tan - Type Definitions
// Category types for entries

export type Category = 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other';

export interface Entry {
  id: string;
  transcript: string;
  category: Category;
  summary: string;
  items: string[];
  mood: string;
  audioUri: string;
  createdAt: Date;
  isPinned: boolean;
  userId: string;
}

export interface CategorizedEntry {
  category: Category;
  summary: string;
  items: string[];
  mood: string;
  date: string;
}

export interface RecordingState {
  isRecording: boolean;
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
