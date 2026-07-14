// Mhat Tan - Type Definitions
// Re-exports from theme for convenience
import { Category as ThemeCategory } from '../theme';
export { CATEGORIES } from '../theme';
export type Category = ThemeCategory;

export interface Entry {
  id: string;
  transcript: string;
  category: ThemeCategory;
  summary: string;
  items: string[];
  mood: string;
  audioUri: string;
  createdAt: Date;
  isPinned: boolean;
  userId: string;
}

export interface CategorizedEntry {
  category: ThemeCategory;
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
