<!-- refreshed: 2026-07-17 -->
# Architecture

**Analysis Date:** 2026-07-17

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Layer                          │
│  React Navigation 7: Bottom Tabs + Native Stack              │
│  App.tsx → Tab Navigator → Stack Navigators per tab           │
├──────────────────┬──────────────────┬───────────────────────┤
│   Home Stack     │  Record Screen   │  Settings/ Search      │
│  [screens/Home]  │  [screens/Record]│  [screens/Search]      │
│  [screens/CreateNote]               │  [screens/Settings]    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Context & State Layer                      │
│  ThemeProvider (src/theme/ThemeContext.tsx)                   │
│  AuthProvider (src/context/AuthContext.tsx)                   │
│  Local useState/useRef in components                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Services Layer (src/services/)                              │
│  ┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ Transcription │ │ Categorization   │ │ Storage          │ │
│  │ (ElevenLabs)  │ │ (Gemini)         │ │ (SQLite/Drizzle)│ │
│  └──────────────┘ └──────────────────┘ └──────────────────┘ │
│  ┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ Recording     │ │ Audio Storage    │ │ Auth             │ │
│  │ (expo-av)     │ │ (expo-file-sys)  │ │ (Firebase)       │ │
│  └──────────────┘ └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Layer                                                  │
│  SQLite (expo-sqlite) + Drizzle ORM                          │
│  Tables: users, entries, user_settings, daily_usage,         │
│          corrections, entries_fts (virtual)                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  External APIs                                               │
│  - ElevenLabs Scribe v2 (Transcription)                      │
│  - Gemini 2.0 Flash (Categorization)                         │
│  - Firebase Auth (Google Sign-In, optional)                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` (Root) | Theme + Auth provider setup, DB initialization | `App.tsx` |
| `AppContent` | Waits for DB and auth, renders NavigationContainer | `App.tsx:193-221` |
| `MainTabs` | Bottom tab navigator with 4 tabs, manages bottom sheet | `App.tsx:41-191` |
| `HomeStack` | Stack navigator for Home and CreateNote screens | `App.tsx:24-31` |
| `SettingsStack` | Stack navigator for Settings screens | `App.tsx:33-39` |
| `HomeScreen` | Displays timeline of entries, stats, category filters | `src/screens/HomeScreen.tsx` |
| `RecordScreen` | Audio recording UI, auto-transcription and categorization | `src/screens/RecordScreen.tsx` |
| `CreateNoteScreen` | Note editor with autosave, markdown support, category selection | `src/screens/CreateNoteScreen.tsx` |
| `SearchScreen` | Full-text search across all entries using FTS5 | `src/screens/SearchScreen.tsx` |
| `SettingsScreen` | User settings and app configuration | `src/screens/SettingsScreen.tsx` |
| `EntryCard` | Renders individual entry with category icon, title, summary | `src/components/EntryCard.tsx` |
| `RecordButton` | Animated record button with mic icon | `src/components/RecordButton.tsx` |
| `ElevatedTabBar` | Custom bottom tab bar with elevated center record button | `src/components/ElevatedTabBar.tsx` |
| `AudioPlayer` | Plays audio files with playback controls | `src/components/AudioPlayer.tsx` |
| `EmptyState` | Shows empty state when no entries exist | `src/components/EmptyState.tsx` |
| `useRecording` | Manages audio recording lifecycle (record/pause/play/stop) | `src/hooks/useRecording.ts` |
| `transcribeAudio` | Transcribes Burmese audio via ElevenLabs Scribe v2 | `src/services/transcription.ts` |
| `categorizeEntry` | Categorizes transcript into mood/category via Gemini | `src/services/categorization.ts` |
| `storage` | CRUD operations for entries in SQLite via Drizzle ORM | `src/services/storage.ts` |
| `recording` | Pure audio functions (start/stop/pause playback) | `src/services/recording.ts` |
| `audioStorage` | Persists audio files to local filesystem | `src/services/audioStorage.ts` |
| `auth` | Firebase Auth + Google Sign-In integration | `src/services/auth.ts` |
| `db` | SQLite database initialization, migrations, connection | `src/db/index.ts` |
| `schema` | Drizzle ORM schema definitions (5 tables + FTS5 virtual) | `src/db/schema.ts` |
| `ThemeProvider` | Manages light/dark/system theme selection | `src/theme/ThemeContext.tsx` |
| `AuthProvider` | Manages auth state, creates local or Firebase user | `src/context/AuthContext.tsx` |

## Pattern Overview

**Overall:** Local-first architecture with service-oriented design

**Key Characteristics:**
- Local-first data persistence in SQLite (offline-capable)
- Service layer abstracts external APIs (ElevenLabs, Gemini, Firebase)
- No global state library; local component state + context providers
- React Navigation for screen management with nested navigators
- Strict TypeScript with interfaces defined in types directory
- Async operations handled via Promises with error boundaries in context

## Layers

**Presentation Layer:**
- Purpose: UI components, screens, and user interactions
- Location: `src/screens/`, `src/components/`
- Contains: React functional components using StyleSheet.create()
- Depends on: Context (Theme, Auth), Services (via hooks)
- Used by: Navigation system

**Context Layer:**
- Purpose: Global app state (theme, auth) using React Context
- Location: `src/theme/ThemeContext.tsx`, `src/context/AuthContext.tsx`
- Contains: ThemeContext, AuthContext, useTheme, useAuth hooks
- Depends on: Services, Database
- Used by: All screens and components

**Service Layer:**
- Purpose: Business logic and external API integration
- Location: `src/services/`
- Contains: transcription, categorization, storage, recording, auth, audioStorage
- Depends on: Database, External APIs (ElevenLabs, Gemini, Firebase)
- Used by: Screens, Hooks, Context providers

**Data Access Layer:**
- Purpose: Database operations and schema management
- Location: `src/db/`
- Contains: Drizzle ORM schema, SQLite initialization, helper functions
- Depends on: expo-sqlite, drizzle-orm
- Used by: Storage service, Auth service, Database initialization

**Type Layer:**
- Purpose: Shared type definitions and constants
- Location: `src/types/`
- Contains: Entry, Category, RecordingState interfaces; CATEGORIES constant
- Depends on: None (pure TypeScript)
- Used by: All other layers

## Data Flow

### Primary Recording Path

1. User taps Record → `RecordButton` calls `useRecording.startRecording()` (`src/hooks/useRecording.ts:56`)
2. `useRecording` requests permission, configures audio mode, creates recording via expo-av (`src/services/recording.ts:34-39`)
3. User stops recording → `useRecording.stopRecording()` saves URI to state (`src/hooks/useRecording.ts:67`)
4. `RecordScreen` detects `state.status === 'recorded'` and triggers transcription (`src/screens/RecordScreen.tsx:78`)
5. `RecordScreen.saveAudioLocally()` persists audio file via `audioStorage` service (`src/services/audioStorage.ts`)
6. `transcribeAudio(permanentUri)` sends to ElevenLabs Scribe v2 API (`src/services/transcription.ts:4-33`)
7. Transcript → `categorizeEntry(transcript)` sends to Gemini 2.0 Flash API (`src/services/categorization.ts:6-58`)
8. Result → navigates to `CreateNoteScreen` with prefilled text, predicted category, audio file

### Note Save/Update Path

1. User edits in `CreateNoteScreen` with autosave (2s debounce) (`src/screens/CreateNoteScreen.tsx:83-100`)
2. `saveEntry()` or `updateEntry()` called in storage service (`src/services/storage.ts:37-136`)
3. Drizzle ORM maps app Entry to database Entry type via `toAppEntry()` (`src/services/storage.ts:12-27`)
4. Data persisted to SQLite `entries` table with FTS5 sync triggered automatically via triggers

### Search Path

1. User types query in `SearchScreen` input (`src/screens/SearchScreen.tsx:47-52`)
2. After debounce (300ms), `searchEntries(userId, query)` called (`src/services/storage.ts:152-172`)
3. Drizzle ORM joins `entries` table with `entries_fts` virtual table (FTS5)
4. Results returned as AppEntry[] to component state

### Authentication Path

1. `AuthProvider` initializes with `LOCAL_USER_ID` and ensures user exists in SQLite (`src/context/AuthContext.tsx:34-52`)
2. If Firebase Auth configured, subscribes to auth state changes (`src/context/AuthContext.tsx:75-99`)
3. On Google Sign-In, `migrateLocalData()` moves local entries to Firebase user's SQLite rows
4. All subsequent operations use Firebase Auth UID instead of local ID

**State Management:**
- Theme: Global via ThemeContext (`src/theme/ThemeContext.tsx`)
- Auth: Global via AuthContext (`src/context/AuthContext.tsx`)
- Recording state: Local via useRecording hook (`src/hooks/useRecording.ts`)
- Screen state: Local useState/useRef in each screen component
- Entries: Fetched per-screen via storage service, no global store
- UI state (selected category, search query): Local useState

## Key Abstractions

**Entry (Data Model):**
- Purpose: Core data unit representing a voice recording + AI analysis
- Examples: `src/types/index.ts:10-23`, `src/db/schema.ts:21-49`
- Pattern: App-facing Entry (simplified) maps to/from Drizzle Entry (extended with DB columns)

**CategorizedEntry (AI Response):**
- Purpose: Result from Gemini categorization service
- Examples: `src/types/index.ts:28-35`
- Pattern: Plain object, validated and normalized by service

**RecordingState:**
- Purpose: Lifecycle state of audio recording
- Examples: `src/types/index.ts:39-46`
- Pattern: Status enum + boolean flags for UI binding

**ThemeProvider:**
- Purpose: Manages light/dark/system theme with design tokens
- Examples: `src/theme/ThemeContext.tsx`, `src/theme/index.ts`
- Pattern: Context + hook pattern, derives colors from theme object

**AuthProvider:**
- Purpose: Manages user identity (local or Firebase)
- Examples: `src/context/AuthContext.tsx`
- Pattern: Context + hook pattern, lazy-loads Firebase modules

## Entry Points

**App Registration:**
- Location: `index.ts`
- Triggers: Expo registers root component on app launch
- Responsibilities: Calls `registerRootComponent(App)`

**App Root Component:**
- Location: `App.tsx:289-297`
- Triggers: index.ts
- Responsibilities: Wraps AppContent in ThemeProvider and AuthProvider

**AppContent:**
- Location: `App.tsx:193-221`
- Triggers: App component renders
- Responsibilities: Initializes database, waits for auth ready, renders NavigationContainer with MainTabs

**MainTabs Navigator:**
- Location: `App.tsx:41-191`
- Triggers: AppContent renders after DB and auth ready
- Responsibilities: Renders 4 tabs (Home, Search, Record, Settings) + manages bottom sheet overlay

**Database Initialization:**
- Location: `src/db/index.ts:31-164`
- Triggers: AppContent `useEffect` on mount (`App.tsx:198-205`)
- Responsibilities: Opens SQLite, runs migrations, creates tables, initializes FTS5, enables WAL mode

## Architectural Constraints

- **Threading:** Single-threaded React Native event loop; all async operations via Promises, no worker threads used
- **Global state:** Theme and Auth are global singletons via Context; recording state is local to useRecording hook; entries fetched per-screen
- **Circular imports:** None detected — services import from types, db, and external APIs; components import from services and context
- **TypeScript strict mode:** Enforced via tsconfig.json with `strict: true`; no `any` types allowed
- **Local-first:** All data persisted to SQLite; optional Firebase sync deferred to V2+

## Anti-Patterns

### Recording State Staleness in Effects

**What happens:** `RecordScreen` uses refs to avoid stale closures when accessing `state.uri` in async effects (`src/screens/RecordScreen.tsx:50-53`)
**Why it's wrong:** React state updates asynchronously; accessing state directly in effects with dependencies can yield stale values
**Do this instead:** Use refs as shown (`stateRef.current`), or use `useEffect` with proper dependency array tracking the specific value

### Hardcoded API Keys in Environment

**What happens:** API keys (ElevenLabs, Gemini) read from `process.env.EXPO_PUBLIC_*` at module load time (`src/services/transcription.ts:2`, `src/services/categorization.ts:4`)
**Why it's wrong:** Keys are evaluated once; if env vars load late or fail, keys remain undefined without graceful fallback
**Do this instead:** Read keys inside the async function body and throw descriptive error (as done)

### Database Rebuild on Corruption

**What happens:** `initDatabase()` deletes and recreates database if `PRAGMA quick_check` fails (`src/db/index.ts:15-21`)
**Why it's wrong:** Destroys all user data without recovery; only fails gracefully for corruption, not for connection issues
**Do this instead:** Add user-facing warning with option to export data before rebuild; or implement point-in-time recovery with backups

## Error Handling

**Strategy:** Try-catch with descriptive error messages; no global error boundaries

**Patterns:**
- API errors: Extract response body and throw with status code and detail message (`src/services/transcription.ts:22-29`)
- DB corruption: Catch and rebuild database with warning log (`src/db/index.ts:34-38`)
- Auth failures: Silent fallback to local user when Firebase not configured (`src/services/auth.ts:39-42`)
- UI errors: Try-catch in screen effects with console.error and graceful degradation (`src/screens/HomeScreen.tsx:57-59`)
- AI response validation: Check for empty/blocked responses and return safe defaults (`src/services/categorization.ts:36-44`)

## Cross-Cutting Concerns

**Logging:** Console logging with module prefix tags (`[DB]`, `[Auth]`, `[HomeScreen]`, `[Categorization]`) for debugging; no logging framework

**Validation:** 
- Category and mood validated against allowed constants (`src/db/schema.ts:45-48`)
- API responses validated for expected structure before parsing (`src/services/categorization.ts:33-35`)
- Entry types use TypeScript interfaces enforced at compile time

**Authentication:** Optional Firebase Auth with Google Sign-In; local-first with `LOCAL_USER_ID`; data migration on sign-in; all DB queries are user-scoped

---

*Architecture analysis: 2026-07-17*
