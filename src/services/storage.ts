// SQLite Storage Service (Drizzle ORM)
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { getDb } from '../db';
import { entries, userSettings, weeklySummaries, type NewEntry, type Entry } from '../db/schema';
import { Entry as AppEntry, Category, WeeklySummary } from '../types';
import { clearAllRecordings } from './audioStorage';
import { cancelDailyReminder } from './notification';

// =============================================================================
// Helpers — map between Drizzle schema types and app types
// =============================================================================

function toAppEntry(row: Entry): AppEntry {
  return {
    id: row.id,
    transcript: row.transcript,
    category: (row.entryType as Category) || 'other',
    title: row.title || '',
    summary: row.summary || '',
    mood: row.mood || 'neutral',
    audioUri: row.audioPath,
    audioDuration: row.audioDuration,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    isPinned: row.isPinned,
    userId: row.userId,
  };
}

// =============================================================================
// CRUD operations
// =============================================================================

/**
 * Save a new entry to SQLite.
 * Returns the generated entry ID.
 */
export const saveEntry = async (
  userId: string,
  entry: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<string> => {
  const db = getDb();
  const id = Crypto.randomUUID();
  const now = new Date();

  const newEntry: NewEntry = {
    id,
    userId,
    entryType: entry.category,
    title: entry.title || null,
    transcript: entry.transcript,
    mood: entry.mood,
    summary: entry.summary,
    audioPath: entry.audioUri,
    audioDuration: entry.audioDuration,
    occurredAt: now,
    isPinned: entry.isPinned ?? false,
    processingStatus: 'completed',
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(entries).values(newEntry);
  return id;
};

/**
 * Get all entries for a user, newest first.
 */
export const getEntries = async (userId: string): Promise<AppEntry[]> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), eq(entries.isDeleted, false)))
    .orderBy(desc(entries.createdAt));

  return rows.map(toAppEntry);
};

/**
 * Get today's entries for a user.
 */
export const getTodayEntries = async (userId: string): Promise<AppEntry[]> => {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        eq(entries.isDeleted, false),
        gte(entries.occurredAt, today)
      )
    )
    .orderBy(desc(entries.createdAt));

  return rows.map(toAppEntry);
};

/**
 * Get a single entry by ID.
 */
export const getEntryById = async (id: string): Promise<AppEntry | null> => {
  const db = getDb();
  const rows = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
  return rows.length > 0 ? toAppEntry(rows[0]) : null;
};

/**
 * Update an entry.
 */
export const updateEntry = async (
  id: string,
  updates: Partial<Omit<AppEntry, 'id' | 'createdAt'>>
): Promise<void> => {
  const db = getDb();
  const now = new Date();

  await db
    .update(entries)
    .set({
      ...(updates.category && { entryType: updates.category }),
      ...(updates.title !== undefined && { title: updates.title || null }),
      ...(updates.transcript && { transcript: updates.transcript }),
      ...(updates.mood && { mood: updates.mood }),
      ...(updates.summary && { summary: updates.summary }),
      ...(updates.audioUri && { audioPath: updates.audioUri }),
      ...(updates.isPinned !== undefined && { isPinned: updates.isPinned }),
      updatedAt: now,
    })
    .where(eq(entries.id, id));
};

/**
 * Soft delete an entry.
 */
export const deleteEntry = async (id: string): Promise<void> => {
  const db = getDb();
  await db
    .update(entries)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(entries.id, id));
};

/**
 * Search entries using FTS5 full-text search.
 */
export const searchEntries = async (
  userId: string,
  query: string
): Promise<AppEntry[]> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        eq(entries.isDeleted, false),
        sql`entries.id IN (
          SELECT uuid FROM entries_fts WHERE entries_fts MATCH ${query}
        )`
      )
    )
    .orderBy(desc(entries.createdAt));

  return rows.map(toAppEntry);
};

// =============================================================================
// Clear all data
// =============================================================================

/**
 * Delete all entries, user settings, audio files, and cancel notifications.
 * This is a destructive operation — cannot be undone.
 */
export const clearAllData = async (): Promise<{
  entriesDeleted: number;
  settingsDeleted: number;
  recordingsDeleted: number;
}> => {
  const db = getDb();

  // Delete all entries
  const entryResult = await db.delete(entries);
  const entriesDeleted = entryResult.changes ?? 0;

  // Delete all user settings
  const settingsResult = await db.delete(userSettings);
  const settingsDeleted = settingsResult.changes ?? 0;

  // Delete all audio files
  const recordingsDeleted = clearAllRecordings();

  // Cancel any scheduled notifications
  await cancelDailyReminder();

  console.log(
    `[Storage] ClearAllData: ${entriesDeleted} entries, ${settingsDeleted} settings, ${recordingsDeleted} recordings`
  );

  return { entriesDeleted, settingsDeleted, recordingsDeleted };
};

// =============================================================================
// User settings
// =============================================================================

/**
 * Get user settings by userId.
 */
export const getUserSettings = async (userId: string) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Save or update user settings.
 */
export const saveUserSettings = async (
  userId: string,
  settings: Partial<{
    languageCode: 'my' | 'en';
    currency: string;
    autoTranscribe: boolean;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    reminderTime: string;
    weeklySummary: boolean;
    weeklySummaryLanguage: 'my' | 'en';
  }>
): Promise<void> => {
  const db = getDb();
  const now = new Date();
  const existing = await getUserSettings(userId);

  if (existing) {
    await db
      .update(userSettings)
      .set({ ...settings, updatedAt: now })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      languageCode: settings.languageCode ?? 'my',
      currency: settings.currency ?? 'MMK',
      autoTranscribe: settings.autoTranscribe ?? true,
      theme: settings.theme ?? 'system',
      notifications: settings.notifications ?? true,
      reminderTime: settings.reminderTime ?? '20:00',
      weeklySummary: settings.weeklySummary ?? false,
      weeklySummaryLanguage: settings.weeklySummaryLanguage ?? 'my',
      createdAt: now,
      updatedAt: now,
    });
  }
};

// =============================================================================
// Weekly entries query
// =============================================================================

/**
 * Get entries within a date range for a user, oldest first (for weekly summary).
 */
export const getEntriesForDateRange = async (
  userId: string,
  start: Date,
  end: Date
): Promise<AppEntry[]> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        eq(entries.isDeleted, false),
        gte(entries.occurredAt, start),
        lte(entries.occurredAt, end)
      )
    )
    .orderBy(entries.occurredAt);

  return rows.map(toAppEntry);
};

// =============================================================================
// Weekly summaries cache
// =============================================================================

/**
 * Get cached weekly summary for a given week start date.
 */
export const getWeeklySummary = async (
  userId: string,
  weekStart: Date
): Promise<WeeklySummary | null> => {
  const db = getDb();
  const rows = await db
    .select()
    .from(weeklySummaries)
    .where(
      and(
        eq(weeklySummaries.userId, userId),
        eq(weeklySummaries.weekStart, weekStart)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    userId: row.userId,
    weekStart: new Date(row.weekStart),
    weekEnd: new Date(row.weekEnd),
    summaryMy: row.summaryMy || '',
    summaryEn: row.summaryEn || '',
    categoryBreakdown: row.categoryBreakdown ? JSON.parse(row.categoryBreakdown) : {},
    moodTrend: row.moodTrend ? JSON.parse(row.moodTrend) : [],
    entryCount: row.entryCount,
    totalDuration: row.totalDuration,
    language: (row.language as 'my' | 'en') || 'my',
    createdAt: new Date(row.createdAt),
  };
};

/**
 * Save or replace a weekly summary cache entry.
 */
export const saveWeeklySummaryRecord = async (
  summary: Omit<WeeklySummary, 'id' | 'createdAt'>
): Promise<void> => {
  const db = getDb();
  const now = new Date();

  // Delete existing summary for this week if any
  await db
    .delete(weeklySummaries)
    .where(
      and(
        eq(weeklySummaries.userId, summary.userId),
        eq(weeklySummaries.weekStart, summary.weekStart)
      )
    );

  await db.insert(weeklySummaries).values({
    id: Crypto.randomUUID(),
    userId: summary.userId,
    weekStart: summary.weekStart,
    weekEnd: summary.weekEnd,
    summaryMy: summary.summaryMy || null,
    summaryEn: summary.summaryEn || null,
    categoryBreakdown: JSON.stringify(summary.categoryBreakdown),
    moodTrend: JSON.stringify(summary.moodTrend),
    entryCount: summary.entryCount,
    totalDuration: summary.totalDuration,
    language: summary.language,
    createdAt: now,
  });
};
