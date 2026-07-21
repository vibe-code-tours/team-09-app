# Mhat Tan — Database Guide

> How the SQLite database works, how the frontend talks to it, what you can query, and how to test it.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup & Initialization](#setup--initialization)
3. [Schema Reference](#schema-reference)
4. [Frontend ↔ Database Connection](#frontend--database-connection)
5. [Data Access Layer (Storage Service)](#data-access-layer-storage-service)
6. [Querying Data](#querying-data)
7. [Full-Text Search (FTS5)](#full-text-search-fts5)
8. [Testing the Database](#testing-the-database)
9. [Common Patterns](#common-patterns)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React Native UI                   │
│  (HomeScreen, RecordScreen, MoneyScreen, etc.)      │
└──────────────────────┬──────────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────────┐
│              Storage Service Layer                   │
│  src/services/storage.ts                            │
│  (saveEntry, getEntries, searchEntries, etc.)       │
└──────────────────────┬──────────────────────────────┘
                       │ calls getDb()
┌──────────────────────▼──────────────────────────────┐
│              Database Module                         │
│  src/db/index.ts                                    │
│  (initDatabase, getDb, closeDatabase)               │
└──────────────────────┬──────────────────────────────┘
                       │ drizzle(sqlite, { schema })
┌──────────────────────▼──────────────────────────────┐
│              Drizzle ORM + expo-sqlite               │
│  src/db/schema.ts                                   │
│  (7 tables, FTS5, indexes, constraints)             │
└──────────────────────┬──────────────────────────────┘
                       │ SQLite
┌──────────────────────▼──────────────────────────────┐
│              mhat-tan.db (local file)                │
│  WAL mode, foreign keys ON                          │
└─────────────────────────────────────────────────────┘
```

**Key principle:** The app is **local-first**. All data lives in SQLite on the device. No network calls for reads — everything is instant.

---

## Setup & Initialization

### First-Time Setup

The database is created automatically on app startup. No manual steps needed.

```tsx
// App.tsx — called once when the app loads
import { initDatabase } from './src/db';

useEffect(() => {
  initDatabase()
    .then(() => setDbReady(true))
    .catch((err) => {
      console.error('[DB] Init failed:', err);
      setDbReady(true); // proceed anyway — screens will show errors
    });
}, []);
```

### What `initDatabase()` Does

1. Opens (or creates) `mhat-tan.db` via `expo-sqlite`
2. Enables **WAL mode** for better concurrent performance
3. Enables **foreign key** enforcement
4. Creates all 7 tables with `CREATE TABLE IF NOT EXISTS`
5. Creates all indexes with `CREATE INDEX IF NOT EXISTS`
6. Creates the FTS5 virtual table + sync triggers

This is idempotent — running it multiple times is safe.

### File Location

The `mhat-tan.db` file is stored in the app's sandboxed SQLite directory:
- **Android:** `/data/data/<package>/databases/mhat-tan.db`
- **iOS:** `<App Sandboxed Dir>/Documents/mhat-tan.db`

You don't need to manage this path — `expo-sqlite` handles it.

---

## Schema Reference

### 7 Tables + 1 FTS5 Virtual Table

| # | Table | Purpose | Key Relationships |
|---|-------|---------|-------------------|
| 1 | `users` | Core user record (Firebase Auth UID) | — |
| 2 | `categories` | Money sub-categories (Food, Transport, etc.) | FK → users |
| 3 | `entries` | Core data unit — one voice recording | FK → users, FK → categories |
| 4 | `expense_items` | Money extracted from entries | FK → entries, FK → categories |
| 5 | `user_settings` | User preferences (1:1 with users) | FK → users |
| 6 | `daily_usage` | Recording count per day (free tier) | FK → users |
| 7 | `corrections` | User overrides of AI predictions | FK → users, FK → entries |
| — | `entries_fts` | Full-text search index | Content = entries |

### Relationships Diagram

```
users ──────────< categories (money sub-categories only)
  │                 │
  │                 └─────────< entries ──────────> entries_fts
  │                    (entry_type: money/feelings/work/health/ideas/other)
  │                               │
  │                               ├─────────< expense_items (only when entry_type=money)
  │                               │
  │                               └─────────< corrections
  │
  ├─────────── 1:1 user_settings
  │
  └─────────< daily_usage
```

### Column Types

| SQL Type | Drizzle Type | Notes |
|----------|-------------|-------|
| `TEXT` | `text()` | Strings, UUIDs, enums (stored as text) |
| `INTEGER` | `integer()` | Booleans (0/1), timestamps (unix seconds), counts |
| `REAL` | `real()` | Confidence scores (0.0–1.0) |

**Booleans** are stored as `INTEGER` (0/1) — Drizzle's `{ mode: 'boolean' }` converts automatically.

**Timestamps** are stored as `INTEGER` (unix seconds) — Drizzle's `{ mode: 'timestamp' }` converts automatically.

### Enum Values

| Column | Allowed Values |
|--------|----------------|
| `entry_type` | `money`, `feelings`, `work`, `health`, `ideas`, `other` |
| `mood` | `happy`, `sad`, `neutral`, `excited`, `stressed`, `grateful` |
| `processing_status` | `pending`, `processing`, `completed`, `failed` |
| `sync_status` | `pending`, `synced`, `failed` |
| `categories.type` | `expense`, `income` |
| `user_settings.theme` | `light`, `dark`, `system` |
| `user_settings.language_code` | `my`, `en` |
| `corrections.field` | `entry_type`, `category`, `mood`, `summary` |

---

## Frontend ↔ Database Connection

### The Three-Layer Architecture

```
Screen Component  →  Storage Service  →  Database Module
     (UI)            (business logic)      (raw queries)
```

**Layer 1: Database Module** (`src/db/index.ts`)
- Owns the SQLite connection
- Exports `initDatabase()`, `getDb()`, `closeDatabase()`
- Does NOT export the raw `db` instance — use `getDb()` instead

**Layer 2: Storage Service** (`src/services/storage.ts`)
- Imports `getDb()` from the database module
- Provides typed CRUD functions
- Maps between Drizzle schema types and app types

**Layer 3: Screen Components** (`src/screens/*.tsx`)
- Import storage functions
- Call them in event handlers or effects
- Display results in React components

### Example: Saving an Entry

```tsx
// RecordScreen.tsx
import { saveEntry } from '../services/storage';

const handleSave = async () => {
  const entryId = await saveEntry(userId, {
    transcript: 'Lunch 60 baht at shan noodle shop',
    category: 'money',
    summary: 'Shan noodle lunch',
    mood: 'neutral',
    audioUri: state.uri,
    audioDuration: state.duration,  // ← seconds from useRecording hook
    isPinned: false,
  });
  console.log('Saved entry:', entryId);
};
```

### Example: Loading Entries on HomeScreen

```tsx
// HomeScreen.tsx
import { getTodayEntries } from '../services/storage';

useEffect(() => {
  if (userId) {
    getTodayEntries(userId).then(setEntries);
  }
}, [userId]);
```

---

## Data Access Layer (Storage Service)

All functions are in `src/services/storage.ts`.

### Entry Operations

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `saveEntry` | `(userId, entry)` | `Promise<string>` | Insert new entry, returns UUID |
| `getEntries` | `(userId)` | `Promise<AppEntry[]>` | All entries, newest first |
| `getTodayEntries` | `(userId)` | `Promise<AppEntry[]>` | Today's entries only |
| `getEntryById` | `(id)` | `Promise<AppEntry \| null>` | Single entry by UUID |
| `updateEntry` | `(id, updates)` | `Promise<void>` | Partial update |
| `deleteEntry` | `(id)` | `Promise<void>` | Soft delete (sets `is_deleted = true`) |
| `searchEntries` | `(userId, query)` | `Promise<AppEntry[]>` | FTS5 full-text search |

### App Entry Type

The storage service maps the DB `Entry` type to a simplified app type:

```typescript
interface Entry {
  id: string;
  transcript: string;
  category: Category;      // 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other'
  summary: string;
  mood: string;
  audioUri: string;         // local file path
  audioDuration: number;    // seconds
  createdAt: Date;
  isPinned: boolean;
  userId: string;
}
```

### Mapping: DB → App

The `toAppEntry()` helper converts Drizzle rows to app types:

| DB Column | App Field | Notes |
|-----------|-----------|-------|
| `entry_type` | `category` | Renamed for clarity |
| `audio_path` | `audioUri` | Renamed for React Native |
| `audio_duration` | `audioDuration` | Direct mapping |
| `created_at` | `createdAt` | INTEGER → Date |
| `is_pinned` | `isPinned` | INTEGER → boolean |

Fields NOT mapped (available via raw query if needed): `edited_transcript`, `predicted_category_id`, `final_category_id`, `category_confidence`, `mood_confidence`, `processing_status`, `sync_status`, `occurred_at`, `timezone`, `is_deleted`.

---

## Querying Data

### Using Drizzle ORM (Recommended)

```typescript
import { getDb } from '../db';
import { entries, categories } from '../db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

const db = getDb();

// Simple select
const rows = await db.select().from(entries).where(
  and(
    eq(entries.userId, userId),
    eq(entries.isDeleted, false)
  )
).orderBy(desc(entries.createdAt));

// Join entries with categories
const rowsWithCategories = await db
  .select({
    entry: entries,
    category: categories,
  })
  .from(entries)
  .leftJoin(categories, eq(entries.predictedCategoryId, categories.id))
  .where(eq(entries.userId, userId));

// Aggregate: count entries by type
const counts = await db
  .select({
    entryType: entries.entryType,
    count: sql<number>`count(*)`,
  })
  .from(entries)
  .where(eq(entries.userId, userId))
  .groupBy(entries.entryType);

// Raw SQL (escape user input!)
const result = await db.all(
  sql`SELECT * FROM entries WHERE user_id = ${userId} LIMIT 10`
);
```

### Direct SQLite Queries (When Needed)

```typescript
import * as SQLite from 'expo-sqlite';

const sqlite = SQLite.openDatabaseSync('mhat-tan.db');

// Direct SQL
const rows = sqlite.getAllSync(
  'SELECT * FROM entries WHERE user_id = ? AND is_deleted = 0',
  [userId]
);

// Parameterized (safe from SQL injection)
sqlite.runSync(
  'INSERT INTO entries (id, user_id, transcript) VALUES (?, ?, ?)',
  [id, userId, transcript]
);
```

### Available Indexes

| Index | Table | Columns | Use For |
|-------|-------|---------|---------|
| `idx_users_phone` | users | `(phone)` | Phone lookup |
| `idx_users_email` | users | `(email)` | Email lookup |
| `idx_categories_user_type` | categories | `(user_id, type)` | Filter categories by expense/income |
| `idx_categories_user_active` | categories | `(user_id, is_active)` | Active categories only |
| `idx_entries_user_created` | entries | `(user_id, created_at)` | Timeline queries |
| `idx_entries_user_type` | entries | `(user_id, entry_type)` | Filter by entry type |
| `idx_entries_user_category` | entries | `(user_id, predicted_category_id)` | Money sub-category filter |
| `idx_entries_user_pinned` | entries | `(user_id, is_pinned)` | Pinned entries |
| `idx_entries_user_deleted` | entries | `(user_id, is_deleted)` | Soft delete filter |
| `idx_entries_user_occurred` | entries | `(user_id, occurred_at)` | Date range queries |
| `idx_expense_items_entry` | expense_items | `(entry_id)` | Items for an entry |
| `idx_expense_items_deleted` | expense_items | `(is_deleted)` | Active items |
| `idx_expense_items_occurred` | expense_items | `(occurred_at)` | Date range |
| `idx_corrections_user` | corrections | `(user_id)` | User's corrections |
| `idx_corrections_entry` | corrections | `(entry_id)` | Corrections for an entry |
| `idx_corrections_field` | corrections | `(field)` | Corrections by type |

---

## Full-Text Search (FTS5)

### How It Works

The `entries_fts` virtual table indexes `transcript`, `edited_transcript`, and `summary` columns. It stays in sync via INSERT/UPDATE/DELETE triggers.

### Searching

```typescript
import { searchEntries } from '../services/storage';

// Search for Burmese text
const results = await searchEntries(userId, 'ဆာတယ်');

// Search for English text
const results = await searchEntries(userId, 'lunch');
```

### FTS5 Query Syntax

FTS5 supports:
- **Simple terms:** `lunch` — matches exact word
- **Phrase:** `"shan noodle"` — matches exact phrase
- **Prefix:** `lunch*` — matches words starting with "lunch"
- **Boolean:** `lunch AND baht` — both terms must match
- **Boolean:** `lunch OR dinner` — either term matches
- **NOT:** `lunch NOT dinner` — "lunch" but not "dinner"

### Example: Search in a Screen

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState<Entry[]>([]);

const handleSearch = async () => {
  if (query.trim()) {
    const found = await searchEntries(userId, query.trim());
    setResults(found);
  }
};
```

---

## Testing the Database

### Method 1: Manual Testing in Expo Dev Client

The easiest way to test is to run the app and interact with it.

```bash
# Start the dev server
npx expo start --android

# Or for web
npx expo start --web
```

Then use the app:
1. Record an entry → check if it saves
2. Go to Home → check if entries appear
3. Search for text → check if FTS5 works
4. Pin/unpin → check if update works
5. Delete → check if soft delete works

### Method 2: Unit Tests with Jest

Create `__tests__/storage.test.ts`:

```typescript
import { initDatabase, getDb, closeDatabase } from '../src/db';
import { saveEntry, getEntries, getEntryById, deleteEntry } from '../src/services/storage';

// Mock expo-sqlite for Jest (or use a test database)
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
    closeAsync: jest.fn(),
  })),
}));

describe('Storage Service', () => {
  const TEST_USER_ID = 'test-user-001';

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should save and retrieve an entry', async () => {
    const entryId = await saveEntry(TEST_USER_ID, {
      transcript: 'Lunch 60 baht',
      category: 'money',
      summary: 'Shan noodle lunch',
      mood: 'neutral',
      audioUri: '/path/to/audio.m4a',
      audioDuration: 15,
      isPinned: false,
    });

    expect(entryId).toBeDefined();
    expect(typeof entryId).toBe('string');

    const entry = await getEntryById(entryId);
    expect(entry).not.toBeNull();
    expect(entry!.transcript).toBe('Lunch 60 baht');
    expect(entry!.category).toBe('money');
    expect(entry!.audioDuration).toBe(15);
  });

  it('should return entries newest first', async () => {
    const entries = await getEntries(TEST_USER_ID);
    expect(entries.length).toBeGreaterThan(0);

    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].createdAt.getTime())
        .toBeGreaterThanOrEqual(entries[i].createdAt.getTime());
    }
  });

  it('should soft delete an entry', async () => {
    const entryId = await saveEntry(TEST_USER_ID, {
      transcript: 'Test delete',
      category: 'other',
      summary: 'Delete me',
      mood: 'neutral',
      audioUri: '/path/to/audio.m4a',
      audioDuration: 5,
      isPinned: false,
    });

    await deleteEntry(entryId);

    const entries = await getEntries(TEST_USER_ID);
    const deleted = entries.find(e => e.id === entryId);
    expect(deleted).toBeUndefined();
  });
});
```

### Method 3: SQLite Browser (External Tool)

For debugging, you can pull the database file and inspect it:

```bash
# Android — pull the database file
adb run-as com.mhattan cp databases/mhat-tan.db /sdcard/
adb pull /sdcard/mhat-tan.db

# Open in DB Browser for SQLite
# https://sqlitebrowser.org/
```

Then run queries directly:

```sql
-- Count entries by type
SELECT entry_type, COUNT(*) as count
FROM entries
WHERE is_deleted = 0
GROUP BY entry_type;

-- Search FTS5
SELECT e.* FROM entries e
JOIN entries_fts f ON e.rowid = f.rowid
WHERE entries_fts MATCH 'lunch';

-- Today's entries
SELECT * FROM entries
WHERE date(created_at, 'unixepoch', 'localtime') = date('now', 'localtime')
ORDER BY created_at DESC;

-- Check expense items
SELECT e.transcript, ei.description, ei.amount, ei.currency
FROM entries e
JOIN expense_items ei ON e.id = ei.entry_id
WHERE e.entry_type = 'money' AND ei.is_deleted = 0;
```

### Method 4: Console Logging

Add temporary logging in `initDatabase()` to verify tables exist:

```typescript
// In src/db/index.ts — initDatabase()
const tables = await sqlite.getAllAsync<{ name: string }>(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log('[DB] Tables:', tables.map(t => t.name));
// Expected: [corrections, categories, daily_usage, entries, expense_items, users, user_settings]
```

---

## Common Patterns

### Pattern: Save Entry After Recording

```tsx
// In RecordScreen.tsx
import { saveEntry } from '../services/storage';

const handleSave = async () => {
  const entryId = await saveEntry(userId, {
    transcript: categorizedResult.transcript,
    category: categorizedResult.category,
    summary: categorizedResult.summary,
    mood: categorizedResult.mood,
    audioUri: state.uri,
    audioDuration: state.duration,
    isPinned: false,
  });
  discardRecording();
  navigation.goBack();
};
```

### Pattern: Load and Display Timeline

```tsx
// In HomeScreen.tsx
import { getTodayEntries } from '../services/storage';

const [entries, setEntries] = useState<Entry[]>([]);

useEffect(() => {
  if (userId) {
    getTodayEntries(userId).then(setEntries);
  }
}, [userId]);

// Render
<FlatList
  data={entries}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <EntryCard entry={item} />}
/>
```

### Pattern: Search with Debounce

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState<Entry[]>([]);
const debounceRef = useRef<ReturnType<typeof setTimeout>>();

const handleSearch = (text: string) => {
  setQuery(text);
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(async () => {
    if (text.trim().length >= 2) {
      const found = await searchEntries(userId, text.trim());
      setResults(found);
    } else {
      setResults([]);
    }
  }, 300);
};
```

### Pattern: Pin/Unpin Entry

```tsx
import { updateEntry } from '../services/storage';

const togglePin = async (entry: Entry) => {
  await updateEntry(entry.id, { isPinned: !entry.isPinned });
  // Refresh the list
  const updated = await getEntries(userId);
  setEntries(updated);
};
```

### Pattern: Track Daily Usage

```typescript
import { getDb } from '../db';
import { dailyUsage } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const canRecord = async (userId: string): Promise<boolean> => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const id = `${userId}_${today}`;

  const rows = await db
    .select()
    .from(dailyUsage)
    .where(eq(dailyUsage.id, id))
    .limit(1);

  const count = rows[0]?.recordingCount ?? 0;
  return count < 10; // Free tier: 10 recordings/day
};
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `database is locked` | Enable WAL mode (already done in `initDatabase`) |
| `foreign key constraint failed` | Ensure parent record exists before inserting child |
| `CHECK constraint failed` | Value not in allowed enum — check the constraint |
| `unique constraint failed` | Duplicate entry — check `(user_id, name, type)` on categories |
| Tables empty after restart | Check `initDatabase()` is called before any queries |
| FTS5 returns nothing | Ensure triggers are created — check `entries_fts_insert` trigger |
| App crashes on startup | Check `initDatabase()` error handler — it logs to console |

---

**Document Version:** 1.0
**Last Updated:** 2026-07-14
**Related:** [mhat-tan-database-schema-v1.md](./mhat-tan-database-schema-v1.md)
