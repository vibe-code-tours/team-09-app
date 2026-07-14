// SQLite Storage Service (Drizzle ORM)
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { entries, type NewEntry, type Entry } from '../db/schema';
import { Entry as AppEntry, Category } from '../types';

// =============================================================================
// Helpers — map between Drizzle schema types and app types
// =============================================================================

function toAppEntry(row: Entry): AppEntry {
  return {
    id: row.id,
    transcript: row.transcript,
    category: (row.entryType as Category) || 'other',
    summary: row.summary || '',
    items: [], // expense_items loaded separately if needed
    mood: row.mood || 'neutral',
    audioUri: row.audioPath,
    createdAt: new Date(row.createdAt),
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
  entry: Omit<AppEntry, 'id' | 'createdAt'>
): Promise<string> => {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const newEntry: NewEntry = {
    id,
    userId,
    entryType: entry.category,
    transcript: entry.transcript,
    mood: entry.mood,
    summary: entry.summary,
    audioPath: entry.audioUri,
    audioDuration: 0, // TODO: pass duration from recording
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
          SELECT id FROM entries_fts WHERE entries_fts MATCH ${query}
        )`
      )
    )
    .orderBy(desc(entries.createdAt));

  return rows.map(toAppEntry);
};
