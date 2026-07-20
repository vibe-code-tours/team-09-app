import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, unique, check } from 'drizzle-orm/sqlite-core';

// =============================================================================
// 1. users
// =============================================================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  phone: text('phone').unique(),
  email: text('email').unique(),
  displayName: text('display_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// =============================================================================
// 2. entries (core data unit)
// =============================================================================

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title'), // AI-generated short title (optional)
  entryType: text('entry_type').notNull(), // feelings, work, health, ideas, other
  transcript: text('transcript').notNull(),
  editedTranscript: text('edited_transcript'),
  mood: text('mood'), // happy, sad, neutral, excited, stressed, grateful
  moodConfidence: real('mood_confidence'),
  summary: text('summary'),
  categoryConfidence: real('category_confidence'),
  processingStatus: text('processing_status').notNull().default('pending'),
  audioPath: text('audio_path').notNull(),
  audioDuration: integer('audio_duration').notNull(), // seconds
  occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(),
  timezone: text('timezone').notNull().default('Asia/Yangon'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (t) => [
  check('entries_entry_type_check', sql`${t.entryType} IN ('feelings', 'work', 'health', 'ideas', 'money', 'other')`),
  check('entries_mood_check', sql`${t.mood} IN ('happy', 'sad', 'neutral', 'excited', 'stressed', 'grateful')`),
  check('entries_processing_status_check', sql`${t.processingStatus} IN ('pending', 'processing', 'completed', 'failed')`),
  check('entries_sync_status_check', sql`${t.syncStatus} IN ('pending', 'synced', 'failed')`),
]);

// =============================================================================
// 3. user_settings (1:1 with users)
// =============================================================================

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  languageCode: text('language_code').notNull().default('my'),
  currency: text('currency').notNull().default('MMK'),
  autoTranscribe: integer('auto_transcribe', { mode: 'boolean' }).notNull().default(true),
  theme: text('theme').notNull().default('system'), // light, dark, system
  notifications: integer('notifications', { mode: 'boolean' }).notNull().default(true),
  reminderTime: text('reminder_time').notNull().default('20:00'), // HH:MM format
  weeklySummary: integer('weekly_summary', { mode: 'boolean' }).notNull().default(false),
  weeklySummaryLanguage: text('weekly_summary_language').notNull().default('my'), // 'my' or 'en'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (t) => [
  check('user_settings_language_code_check', sql`${t.languageCode} IN ('my', 'en')`),
  check('user_settings_theme_check', sql`${t.theme} IN ('light', 'dark', 'system')`),
  check('user_settings_weekly_summary_language_check', sql`${t.weeklySummaryLanguage} IN ('my', 'en')`),
]);

// =============================================================================
// 4. daily_usage (free tier enforcement)
// =============================================================================

export const dailyUsage = sqliteTable('daily_usage', {
  id: text('id').primaryKey(), // Format: {user_id}_{date}
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  recordingCount: integer('recording_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (t) => [
  unique('daily_usage_user_id_date_unique').on(t.userId, t.date),
]);

// =============================================================================
// 5. corrections (write-once audit log)
// =============================================================================

export const corrections = sqliteTable('corrections', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  entryId: text('entry_id')
    .notNull()
    .references(() => entries.id),
  field: text('field').notNull(), // entry_type, mood, summary
  aiValue: text('ai_value').notNull(),
  aiConfidence: real('ai_confidence'),
  userValue: text('user_value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (t) => [
  check('corrections_field_check', sql`${t.field} IN ('entry_type', 'mood', 'summary')`),
]);

// =============================================================================
// 6. weekly_summaries (cached AI-generated weekly digests)
// =============================================================================

export const weeklySummaries = sqliteTable('weekly_summaries', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  weekStart: integer('week_start', { mode: 'timestamp' }).notNull(),
  weekEnd: integer('week_end', { mode: 'timestamp' }).notNull(),
  summaryMy: text('summary_my'),
  summaryEn: text('summary_en'),
  categoryBreakdown: text('category_breakdown'), // JSON string
  moodTrend: text('mood_trend'), // JSON string
  entryCount: integer('entry_count').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0), // seconds
  language: text('language').notNull().default('my'), // 'my' or 'en'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// =============================================================================
// TypeScript types (inferred from schema)
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;

export type DailyUsage = typeof dailyUsage.$inferSelect;
export type NewDailyUsage = typeof dailyUsage.$inferInsert;

export type Correction = typeof corrections.$inferSelect;
export type NewCorrection = typeof corrections.$inferInsert;

export type WeeklySummaryRecord = typeof weeklySummaries.$inferSelect;
export type NewWeeklySummaryRecord = typeof weeklySummaries.$inferInsert;

// =============================================================================
// Constants (matching V1 spec)
// =============================================================================

export const ENTRY_TYPES = ['feelings', 'work', 'health', 'ideas', 'money', 'other'] as const;
export const MOODS = ['happy', 'sad', 'neutral', 'excited', 'stressed', 'grateful'] as const;
export const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export const SYNC_STATUSES = ['pending', 'synced', 'failed'] as const;
export const THEMES = ['light', 'dark', 'system'] as const;
export const LANGUAGE_CODES = ['my', 'en'] as const;
export const CORRECTION_FIELDS = ['entry_type', 'mood', 'summary'] as const;
