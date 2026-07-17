import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Database name
const DB_NAME = 'mhat-tan.db';

// Initialize SQLite database
const sqlite = SQLite.openDatabaseSync(DB_NAME);

// Create Drizzle ORM instance
const db = drizzle(sqlite, { schema });

// =============================================================================
// Database initialization
// =============================================================================

/**
 * Initialize database schema.
 * Call this once on app startup.
 */
export async function initDatabase(): Promise<void> {
  // Enable WAL mode for better performance
  await sqlite.execAsync('PRAGMA journal_mode = WAL;');
  await sqlite.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables using raw SQL (Drizzle doesn't auto-create tables in expo-sqlite)
  await sqlite.execAsync(`
    -- 1. users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      display_name TEXT,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 2. entries (core data unit)
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('feelings', 'work', 'health', 'ideas', 'money', 'other')),
      transcript TEXT NOT NULL,
      edited_transcript TEXT,
      mood TEXT CHECK(mood IN ('happy', 'sad', 'neutral', 'excited', 'stressed', 'grateful')),
      mood_confidence REAL,
      summary TEXT,
      category_confidence REAL,
      processing_status TEXT NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')),
      audio_path TEXT NOT NULL,
      audio_duration INTEGER NOT NULL,
      occurred_at INTEGER NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'Asia/Yangon',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'failed')),
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_entries_user_type ON entries(user_id, entry_type);
    CREATE INDEX IF NOT EXISTS idx_entries_user_pinned ON entries(user_id, is_pinned);
    CREATE INDEX IF NOT EXISTS idx_entries_user_deleted ON entries(user_id, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_entries_user_occurred ON entries(user_id, occurred_at);

    -- 3. user_settings
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      language_code TEXT NOT NULL DEFAULT 'my' CHECK(language_code IN ('my', 'en')),
      currency TEXT NOT NULL DEFAULT 'MMK',
      auto_transcribe INTEGER NOT NULL DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('light', 'dark', 'system')),
      notifications INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. daily_usage
    CREATE TABLE IF NOT EXISTS daily_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      recording_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    -- 5. corrections
    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      entry_id TEXT NOT NULL REFERENCES entries(id),
      field TEXT NOT NULL CHECK(field IN ('entry_type', 'mood', 'summary')),
      ai_value TEXT NOT NULL,
      ai_confidence REAL,
      user_value TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_corrections_user ON corrections(user_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_entry ON corrections(entry_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_field ON corrections(field);
  `);

  // Migration: add title column if missing (for existing databases)
  try {
    await sqlite.execAsync('ALTER TABLE entries ADD COLUMN title TEXT');
  } catch {
    // Column already exists — safe to ignore
  }

  // Create FTS5 virtual table for full-text search
  // Uses a uuid TEXT column to store the entry's UUID (entries.id is TEXT, not integer rowid)
  await sqlite.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      uuid,
      transcript,
      edited_transcript,
      summary
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS entries_fts_insert AFTER INSERT ON entries BEGIN
      INSERT INTO entries_fts(uuid, transcript, edited_transcript, summary)
      VALUES (new.id, new.transcript, new.edited_transcript, new.summary);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_fts_update AFTER UPDATE ON entries BEGIN
      DELETE FROM entries_fts WHERE uuid = old.id;
      INSERT INTO entries_fts(uuid, transcript, edited_transcript, summary)
      VALUES (new.id, new.transcript, new.edited_transcript, new.summary);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_fts_delete AFTER DELETE ON entries BEGIN
      DELETE FROM entries_fts WHERE uuid = old.id;
    END;
  `);

  console.log('[DB] Database initialized successfully');
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Get the database instance.
 * Use this for all database operations.
 */
export function getDb() {
  return db;
}

/**
 * Close database connection.
 * Call this on app shutdown.
 */
export async function closeDatabase(): Promise<void> {
  await sqlite.closeAsync();
  console.log('[DB] Database closed');
}
