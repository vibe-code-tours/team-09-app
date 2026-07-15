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

    -- 2. categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      name_en TEXT,
      name_my TEXT,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      icon TEXT,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name, type)
    );

    CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_categories_user_active ON categories(user_id, is_active);

    -- 3. entries
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      entry_type TEXT NOT NULL CHECK(entry_type IN ('money', 'feelings', 'work', 'health', 'ideas', 'other')),
      transcript TEXT NOT NULL,
      edited_transcript TEXT,
      predicted_category_id TEXT REFERENCES categories(id),
      final_category_id TEXT REFERENCES categories(id),
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
    CREATE INDEX IF NOT EXISTS idx_entries_user_category ON entries(user_id, predicted_category_id);
    CREATE INDEX IF NOT EXISTS idx_entries_user_pinned ON entries(user_id, is_pinned);
    CREATE INDEX IF NOT EXISTS idx_entries_user_deleted ON entries(user_id, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_entries_user_occurred ON entries(user_id, occurred_at);

    -- 4. expense_items
    CREATE TABLE IF NOT EXISTS expense_items (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL REFERENCES entries(id),
      final_category_id TEXT REFERENCES categories(id),
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      occurred_at INTEGER NOT NULL,
      receipt_path TEXT,
      receipt_size INTEGER,
      receipt_type TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_expense_items_entry ON expense_items(entry_id);
    CREATE INDEX IF NOT EXISTS idx_expense_items_deleted ON expense_items(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_expense_items_occurred ON expense_items(occurred_at);

    -- 5. user_settings
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

    -- 6. daily_usage
    CREATE TABLE IF NOT EXISTS daily_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      recording_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    -- 7. corrections
    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      entry_id TEXT NOT NULL REFERENCES entries(id),
      field TEXT NOT NULL CHECK(field IN ('entry_type', 'category', 'mood', 'summary')),
      ai_value TEXT NOT NULL,
      ai_confidence REAL,
      user_value TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_corrections_user ON corrections(user_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_entry ON corrections(entry_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_field ON corrections(field);
  `);

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
