---
title: Mhat Tan — V1 Database Schema (Final)
version: 1.0
date: 2026-07-13
status: Final
---

# Mhat Tan — V1 Database Schema (Final)

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | SQLite | Local-first storage, zero config |
| **ORM** | Drizzle ORM | Type-safe queries, migrations |
| **Search** | FTS5 | Full-text search for Burmese text |
| **Auth** | Firebase Auth | Phone/Google/Apple sign-in |
| **Cloud** | Firebase Firestore | Optional sync (V2+) |
| **AI** | Gemini API | STT, categorization, mood detection |

---

## V1 Scope

### ✅ IN SCOPE (30-40 jobs)

- Expense tracking with receipt photos
- Income tracking (manual)
- Category management
- Dashboard summary
- Full-text search

### ❌ OUT OF SCOPE (V2+)

- Budget tracking (monthly_budgets, savings_goals)
- Multi-device sync
- Recurring transactions
- Advanced analytics
- AI-powered insights

---

## Tables

---

### 1. `users`

Core user record. Supports multiple auth providers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | Firebase Auth UID |
| `phone` | string | UNIQUE, NULLABLE | Phone in E.164 format |
| `email` | string | UNIQUE, NULLABLE | Email address |
| `display_name` | string | NULLABLE | Optional display name |
| `created_at` | timestamp | NOT NULL | Account creation (UTC) |
| `updated_at` | timestamp | NOT NULL | Last update (UTC) |

**Indexes:**
- `idx_users_phone` — UNIQUE on `(phone)`
- `idx_users_email` — UNIQUE on `(email)`

---

### 2. `categories`

User-defined expense/income categories. Supports localizable names.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | UUID v4 |
| `user_id` | string | FK → users, NOT NULL | Owner |
| `name` | string | NOT NULL | Display name (e.g. "Ăn uống") |
| `name_vi` | string | NULLABLE | Vietnamese translation |
| `name_en` | string | NULLABLE | English translation |
| `name_my` | string | NULLABLE | Burmese translation |
| `type` | enum | NOT NULL | 'expense' or 'income' |
| `icon` | string | NULLABLE | Emoji or icon identifier |
| `color` | string | NULLABLE | Hex color code |
| `sort_order` | integer | NOT NULL, DEFAULT 0 | Display order |
| `is_active` | boolean | NOT NULL, DEFAULT true | Soft disable |
| `is_deleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `created_at` | timestamp | NOT NULL | UTC creation time |
| `updated_at` | timestamp | NOT NULL | UTC last update |

**Unique constraint:** `(user_id, name, type)` — prevents duplicate category names per user

**Indexes:**
- `idx_categories_user_type` — `(user_id, type)` — filter by type
- `idx_categories_user_active` — `(user_id, is_active)` — active categories only

**Design notes:**
- Category names are stored per language to support localization without JOINs
- `name` is the primary display name; translation columns are optional fallbacks
- Unique constraint on `(user_id, name, type)` prevents duplicates

---

### 3. `entries`

The core data unit. Each row is one voice recording and its metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | UUID v4 |
| `user_id` | string | FK → users, NOT NULL | Owner |
| `transcript` | text | NOT NULL | Raw Burmese text from STT |
| `edited_transcript` | text | NULLABLE | User's final version |
| `predicted_category_id` | string | FK → categories, NULLABLE | AI-assigned category |
| `final_category_id` | string | FK → categories, NULLABLE | User override (or same as predicted) |
| `mood` | enum | NULLABLE | Detected mood |
| `mood_confidence` | real | NULLABLE | AI confidence for mood (0.0 - 1.0) |
| `summary` | text | NULLABLE | AI-generated summary |
| `category_confidence` | real | NULLABLE | AI confidence for category (0.0 - 1.0) |
| `processing_status` | enum | NOT NULL, DEFAULT 'pending' | AI processing state |
| `audio_path` | string | NOT NULL | Local file path |
| `audio_duration` | integer | NOT NULL | Duration in seconds |
| `occurred_at` | timestamp | NOT NULL | When the event actually happened |
| `timezone` | string | NOT NULL | IANA timezone (e.g. `Asia/Yangon`) |
| `is_pinned` | boolean | NOT NULL, DEFAULT false | User favourited |
| `is_deleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `sync_status` | enum | NOT NULL, DEFAULT 'pending' | Sync state |
| `created_at` | timestamp | NOT NULL | UTC insertion time |
| `updated_at` | timestamp | NOT NULL | UTC last update |

**Enum values:**

| Column | Allowed Values |
|--------|----------------|
| `mood` | `happy`, `sad`, `neutral`, `excited`, `stressed`, `grateful` |
| `processing_status` | `pending`, `processing`, `completed`, `failed` |
| `sync_status` | `pending`, `synced`, `failed` |

**Indexes:**
- `idx_entries_user_created` — `(user_id, created_at)` — timeline queries
- `idx_entries_user_category` — `(user_id, predicted_category_id)` — category filter
- `idx_entries_user_pinned` — `(user_id, is_pinned)` — pinned entries
- `idx_entries_user_deleted` — `(user_id, is_deleted)` — soft delete filter
- `idx_entries_user_occurred` — `(user_id, occurred_at)` — date range queries

**Design notes:**
- `predicted_category_id` — AI's initial prediction (immutable audit trail)
- `final_category_id` — User's confirmed choice (NULL = use predicted)
- `category_confidence` — AI confidence score (0.0 = uncertain, 1.0 = certain)
- `mood_confidence` — AI confidence score for mood detection
- `processing_status` — tracks async AI processing (STT → categorize → summarize)
- `occurred_at` — when the event actually happened (user may record yesterday's expense today)

---

### 4. `expense_items`

Money extracted from entries. One entry can have zero or many expense items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | UUID v4 |
| `entry_id` | string | FK → entries, NOT NULL | Parent entry |
| `final_category_id` | string | FK → categories, NULLABLE | Spending category |
| `description` | string | NOT NULL | What the money was for |
| `amount` | integer | NOT NULL | Minor units (pyas/cents) |
| `currency` | string | NOT NULL | ISO 4217 code (MMK, USD, THB) |
| `occurred_at` | timestamp | NOT NULL | When expense happened |
| `receipt_path` | string | NULLABLE | Local file path to receipt |
| `receipt_size` | integer | NULLABLE | File size in bytes |
| `receipt_type` | string | NULLABLE | MIME type (image/jpeg, image/png) |
| `is_deleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `created_at` | timestamp | NOT NULL | UTC insertion time |
| `updated_at` | timestamp | NOT NULL | UTC last update |

**Indexes:**
- `idx_expense_items_entry` — `(entry_id)` — lookup by entry
- `idx_expense_items_deleted` — `(is_deleted)` — filter soft-deleted items
- `idx_expense_items_occurred` — `(occurred_at)` — date range queries

**Cascade policy:**
- Hard deletes: FK delete cascade on `entry_id`
- Soft deletes: App propagates `is_deleted = true` to child items

**Design notes:**
- `amount` stored as integer to avoid floating-point errors
- `occurred_at` — when the expense actually happened (not insertion time)
- `receipt_*` columns enable file validation and cleanup
- Max receipt size: 5MB (enforced at app layer)
- Allowed receipt types: `image/jpeg`, `image/png`, `image/heic`

---

### 5. `user_settings`

User preferences. One-to-one with users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | string | PK, FK → users | 1:1 with users |
| `language_code` | string | NOT NULL, DEFAULT 'vi' | IETF language tag |
| `currency` | string | NOT NULL, DEFAULT 'MMK' | Default ISO 4217 |
| `auto_transcribe` | boolean | NOT NULL, DEFAULT true | Auto-transcribe |
| `theme` | enum | NOT NULL, DEFAULT 'system' | App theme |
| `notifications` | boolean | NOT NULL, DEFAULT true | Push notifications |
| `created_at` | timestamp | NOT NULL | Setup timestamp |
| `updated_at` | timestamp | NOT NULL | Last modification |

**Enum values:**

| Column | Allowed Values |
|--------|----------------|
| `language_code` | `vi`, `en`, `my`, `th`, `zh` |
| `theme` | `light`, `dark`, `system` |

---

### 6. `daily_usage`

Tracks daily recording count for free tier enforcement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | Format: `{user_id}_{date}` |
| `user_id` | string | FK → users, NOT NULL | |
| `date` | date | NOT NULL | Usage date (local timezone) |
| `recording_count` | integer | NOT NULL, DEFAULT 0 | Recordings used today |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Unique constraint:** `(user_id, date)`

---

### 7. `corrections`

Logs user overrides of AI predictions. Write-once audit log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | string | PK | UUID v4 |
| `user_id` | string | FK → users, NOT NULL | Who corrected |
| `entry_id` | string | FK → entries, NOT NULL | Which entry |
| `field` | enum | NOT NULL | Which AI field |
| `ai_value` | string | NOT NULL | AI prediction |
| `ai_confidence` | real | NULLABLE | AI's confidence when it made prediction |
| `user_value` | string | NOT NULL | User's correction |
| `created_at` | timestamp | NOT NULL | When corrected |

**Enum values:**

| Column | Allowed Values |
|--------|----------------|
| `field` | `category`, `mood`, `summary` |

**Indexes:**
- `idx_corrections_user` — `(user_id)`
- `idx_corrections_entry` — `(entry_id)`
- `idx_corrections_field` — `(field)`

**Design notes:**
- `ai_confidence` stores the AI's confidence at time of prediction
- Enables analysis: "When confidence < 0.7, users correct 80% of predictions"

---

## Full-Text Search (FTS5)

```sql
CREATE VIRTUAL TABLE entries_fts USING fts5(
    transcript,
    edited_transcript,
    summary,
    content='entries',
    content_rowid='rowid'
);
```

**Triggers:**

```sql
-- After INSERT
CREATE TRIGGER entries_fts_insert AFTER INSERT ON entries BEGIN
    INSERT INTO entries_fts(rowid, transcript, edited_transcript, summary)
    VALUES (new.rowid, new.transcript, new.edited_transcript, new.summary);
END;

-- After UPDATE
CREATE TRIGGER entries_fts_update AFTER UPDATE ON entries BEGIN
    DELETE FROM entries_fts WHERE rowid = old.rowid;
    INSERT INTO entries_fts(rowid, transcript, edited_transcript, summary)
    VALUES (new.rowid, new.transcript, new.edited_transcript, new.summary);
END;

-- After DELETE
CREATE TRIGGER entries_fts_delete AFTER DELETE ON entries BEGIN
    DELETE FROM entries_fts WHERE rowid = old.rowid;
END;
```

---

## Relationships

```
users ──────────< categories
  │                 │
  │                 └─────────< entries ──────────> entries_fts
  │                               │
  │                               ├─────────< expense_items
  │                               │
  │                               └─────────< corrections
  │
  ├─────────── 1:1 user_settings
  │
  └─────────< daily_usage
```

---

## V1 Fixes Applied

### Original 5 Issues (Fixed)

| Issue | Status | Fix |
|-------|--------|-----|
| **Missing `created_at`** | ✅ Fixed | Added to all tables |
| **Category duplication risk** | ✅ Fixed | Unique constraint on `(user_id, name, type)` |
| **Receipt file issues** | ✅ Fixed | Added `receipt_path`, `receipt_size`, `receipt_type` columns |
| **No soft delete** | ✅ Fixed | Added `is_deleted` to all relevant tables |
| **No backup mechanism** | ✅ Documented | See Backup Strategy below |

### ChatGPT 4 High Priority Items (Implemented)

| Item | Status | Implementation |
|------|--------|----------------|
| **Rename category fields** | ✅ Fixed | `predicted_category_id` + `final_category_id` |
| **Add `occurred_at`** | ✅ Fixed | Added to `entries` and `expense_items` |
| **Add AI confidence** | ✅ Fixed | `category_confidence` + `mood_confidence` |
| **Add processing status** | ✅ Fixed | `processing_status` enum (pending/processing/completed/failed) |

---

## Backup Strategy (V1)

SQLite is a single file — backup is simple but must be done manually.

### Manual Backup (V1)

```bash
# Copy database file
cp mhat-tan.db mhat-tan-backup-$(date +%Y%m%d).db

# Or use SQLite's backup command
sqlite3 mhat-tan.db ".backup 'mhat-tan-backup.db'"
```

### Automated Backup (V2+)

- **Option 1:** Firebase Firestore sync
- **Option 2:** iCloud/Google Drive auto-backup
- **Option 3:** Export to JSON + cloud storage

---

## Migration Path

```
V1 (SQLite) → V2 (PostgreSQL) → V3 (PostgreSQL + AI)
```

**When to migrate:**
- Need multi-device sync → V2
- Need multi-user support → V2
- Need advanced analytics → V3

---

## Schema Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-13 | Initial V1 schema with 5 fixes applied |
| 1.1 | 2026-07-13 | Added 4 high priority items from ChatGPT review |

---

**Document Version:** 1.1
**Last Updated:** 2026-07-13
**Author:** @heinthaw-dev
