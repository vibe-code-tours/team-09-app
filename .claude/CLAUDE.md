<!-- GSD:project-start source:PROJECT.md -->

## Project

**Mhat Tan (မှတ်တမ်း)**

Voice-first daily record app for Burmese speakers. Speak in Burmese, get AI transcription and auto-categorization into 6 categories (Money, Feelings, Work, Health, Ideas, Other), displayed on a timeline. Built with Expo SDK 54, targeting Android first.

**Core Value:** A Burmese speaker can open the app, tap record, speak naturally, and see their words organized into a searchable daily record — no typing required.

### Constraints

- **Tech stack**: Expo SDK 54, React Native, TypeScript strict mode — no deviations
- **Target**: Android first — iOS later
- **Storage**: Use existing SQLite/Drizzle setup — no new DB migration
- **Tab bar**: Already implemented and matching sketch design — reuse as-is
- **Design**: Follow sketch findings (010, 011, 012) exactly — they are validated

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript ~5.9.2 - All source code, strict mode enabled
- React 19.1.0 - UI components and application logic
- SQL - Database schema and migrations (raw SQL + Drizzle ORM)

## Runtime

- Node.js 26.2.0 - Build and development
- React Native 0.81.5 - Mobile runtime
- npm - Dependency management
- Lockfile: `package-lock.json` (present)

## Frameworks

- Expo SDK 54 - React Native development and build tooling
- React Navigation 7 - Bottom tabs + native-stack navigation
- None configured yet - CI pipeline uses `npm test --if-present`
- Expo CLI - Start server, build Android/iOS/Web
- Drizzle Kit 0.31.10 - Database migrations

## Key Dependencies

- `drizzle-orm` 0.45.2 - Type-safe SQLite ORM with FTS5 support
- `expo-sqlite` 16.0.10 - Local SQLite database
- `expo-av` 16.0.8 - Audio recording and playback
- `firebase` 12.16.0 - Authentication and cloud services
- `expo-file-system` 19.0.23 - Local file storage for recordings
- `expo-crypto` 15.0.9 - UUID generation for database IDs
- `@react-native-google-signin/google-signin` 11.0.1 - Google OAuth
- `react-native-markdown-display` 7.0.2 - Markdown rendering
- `react-native-safe-area-context` 5.6.0 - Safe area handling
- `react-native-screens` 4.16.0 - Native screen optimization
- `expo-haptics` 15.0.8 - Haptic feedback
- `@expo/vector-icons` 15.0.3 - Ionicons icon library

## Configuration

- `.env` file - Store API keys and Firebase config
- Environment variables prefixed with `EXPO_PUBLIC_*`
- Variables: `EXPO_PUBLIC_ELEVENLABS_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `app.json` - Expo app configuration (app name, splash, icons, plugins)
- `tsconfig.json` - TypeScript config (extends `expo/tsconfig.base.json`)
- `drizzle.config.ts` - Drizzle ORM SQLite configuration

## Platform Requirements

- Android device or emulator (primary target)
- Expo Go is not supported (SDK 52+ requires development builds)
- Node.js v20+ for CI, v26+ for local development
- Android APK/AAB (primary)
- iOS (secondary, not primary target)
- Web browser (experimental support)

## Build Configuration

- Bundle identifier: `com.anonymous.mhat-tan`
- Edge-to-edge enabled
- Adaptive icons configured
- Portrait orientation only
- Bundle identifier: `com.anonymous.mhat-tan`
- Tablet support enabled
- Favicon configured
- Web support via Expo

## TypeScript

- No `any` types
- Interface definitions for object shapes
- Type aliases for union types
- Full type inference from Drizzle schema

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Components: `PascalCase.tsx` — one component per file
- Services: `camelCase.ts` — business logic and API calls
- Hooks: `camelCase.ts` with `use` prefix
- Types: `index.ts` barrel files for domain types
- Config: `camelCase.ts`
- Context: `PascalCase.tsx` with `Provider` suffix for wrapper, `use[Name]` hook
- Database: `schema.ts` (Drizzle ORM), `index.ts` (connection)
- Service functions: `camelCase` — verb-first naming
- React hooks: `camelCase` with `use` prefix
- Component event handlers: `handle[Event]` pattern
- Utility functions: `camelCase`, descriptive verb
- State variables: `camelCase`, descriptive noun
- Refs: `camelCase` with `Ref` suffix
- Constants: `UPPER_SNAKE_CASE` for module-level constants
- Boolean state: `is[State]` or `has[State]` prefix
- Interface for object shapes
- Type for union types
- Route params: typed as a type alias
- Drizzle schema types: inferred from schema definitions, not manually typed
- Props: inline interface above component definition

## Code Style

- Tool: None configured (no Prettier, ESLint, or Biome)
- Follows React Native standard conventions manually
- 2-space indentation
- Single quotes for strings
- Trailing commas in object/array literals
- Semicolons at end of statements
- Tool: None configured
- CI runs `npm run lint --if-present` which is a no-op currently
- TypeScript strict mode enforced via `tsconfig.json`
- No `any` types (TypeScript strict mode)
- Inline styles for theme-dependent values, `StyleSheet.create()` for static styles
- Components use arrow function syntax: `const Component: React.FC<Props> = () => { ... }`
- Services use arrow function syntax: `export const fn = async (...) => { ... }`
- One component per file, one export per module

## Import Organization

## Error Handling

- Always log errors with `[ComponentName]` prefix
- Use `console.error` for failures, `console.warn` for non-critical issues
- API services throw errors; screens catch and display user-friendly messages
- Cleanup operations use empty catch blocks (files may already be deleted)
- Firebase/optional services degrade gracefully — no-op when not configured

## Logging

- Prefix with `[ComponentName]` or `[ServiceName]` in brackets
- Use `console.log` for success: `console.log('[DB] Database initialized successfully')`
- Use `console.warn` for non-critical: `console.warn('[Auth] Firebase modules not available:', err)`
- Use `console.error` for failures: `console.error('[RecordScreen] Categorize failed:', catErr)`
- Log structured data when useful: `console.warn('[Categorization] Empty or blocked response:', JSON.stringify(result))`
- `src/db/index.ts`: Database lifecycle (`[DB]`)
- `src/services/auth.ts`: Auth operations (`[Auth]`)
- `src/screens/HomeScreen.tsx`: Data loading failures (`[HomeScreen]`)
- `src/screens/RecordScreen.tsx`: Transcription/categorization failures (`[RecordScreen]`)
- `src/screens/SearchScreen.tsx`: Search failures (`[SearchScreen]`)
- `src/services/categorization.ts`: API response issues (`[Categorization]`)

## Comments

- Section headers with `// ── Section Name ─────` separator pattern (used in `SearchScreen.tsx`, `SettingsScreen.tsx`)
- Section headers with `// =============================================================================` (used in `db/schema.ts`, `db/index.ts`, `storage.ts`)
- Inline comments for non-obvious logic: `// Re-assigns all entries from localUserId to firebaseUserId`
- Comments for complex patterns: `// Uses a uuid TEXT column to store the entry's UUID`
- Used on exported functions in services and database layer
- Pattern: `/** Description. */` block above function
- Not used on React components (props interface is self-documenting)
- Examples: `src/services/storage.ts`, `src/db/index.ts`, `src/services/recording.ts`
- Inline comments for obvious code
- TODO/FIXME markers (none found in codebase)
- Inline type annotations where type inference is sufficient

## Function Design

- Services accept primitive IDs and typed objects: `saveEntry(userId: string, entry: Omit<AppEntry, ...>)`
- Hooks return action functions and state: `{ state, startRecording, stopRecording, ... }`
- Components receive typed props interfaces
- Callback props use `() => void` type, optional with `?` suffix
- Services return `Promise<T>` with explicit return types
- Hooks return plain objects with state + actions
- Components return JSX directly
- Components: `const Component: React.FC<Props> = () => { ... }` (arrow function)
- Service exports: `export const fn = async (...) => { ... }` (arrow function)
- Internal helpers: `function helperName(...) { ... }` (named function, e.g., `toAppEntry`, `formatDateToFileName`, `getDateGroup`)
- Context providers: `function ComponentName({ children }: { children: React.ReactNode }) { ... }` (named function)
- App shell functions: `function MainTabs() { ... }`, `function AppContent() { ... }` (named function)

## Module Design

- Components: Named exports (`export const RecordButton: React.FC<Props>`)
- Services: Named exports only (`export const saveEntry = async ...`)
- Hooks: Named exports (`export const useRecording = () => { ... }`)
- Types: Named exports (`export type Category`, `export interface Entry`)
- Database: Named exports (`export async function initDatabase()`, `export function getDb()`)
- `src/types/index.ts` — all domain types + constants
- `src/theme/index.ts` — design tokens + re-exports from `../types`
- No barrel files for components, services, or screens (direct imports only)
- Services are flat — one file per external concern (transcription, categorization, storage, recording, auth)
- Components are flat — one file per component
- Database has two files: `schema.ts` (definitions) + `index.ts` (connection + init)
- Screens are flat — one file per screen

## Async Patterns

## Styling Conventions

- Defined at bottom of every component file
- Static styles only — no dynamic values
- `spacing`: `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `xxl(24)`, `xxxl(32)`
- `radius`: `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `full(9999)`
- `createShadows(isDark, primaryColor)` — theme-aware shadow presets
- Use tokens instead of raw pixel values
- Use `StyleSheet.hairlineWidth` for thin borders (1px)
- Use `gap` property for flex spacing (React Native 0.81+)
- Use `flex: 1` for fill behavior
- Avoid hardcoded colors — always pull from `colors` object
- Emoji used for icons in category chips and section headers
- `Ionicons` from `@expo/vector-icons` — used throughout
- Icon names: `kebab-case` string literals
- Examples: `'mic'`, `'stop'`, `'play'`, `'pause'`, `'search-outline'`, `'document-text'`

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- Local-first data persistence in SQLite (offline-capable)
- Service layer abstracts external APIs (ElevenLabs, Gemini, Firebase)
- No global state library; local component state + context providers
- React Navigation for screen management with nested navigators
- Strict TypeScript with interfaces defined in types directory
- Async operations handled via Promises with error boundaries in context

## Layers

- Purpose: UI components, screens, and user interactions
- Location: `src/screens/`, `src/components/`
- Contains: React functional components using StyleSheet.create()
- Depends on: Context (Theme, Auth), Services (via hooks)
- Used by: Navigation system
- Purpose: Global app state (theme, auth) using React Context
- Location: `src/theme/ThemeContext.tsx`, `src/context/AuthContext.tsx`
- Contains: ThemeContext, AuthContext, useTheme, useAuth hooks
- Depends on: Services, Database
- Used by: All screens and components
- Purpose: Business logic and external API integration
- Location: `src/services/`
- Contains: transcription, categorization, storage, recording, auth, audioStorage
- Depends on: Database, External APIs (ElevenLabs, Gemini, Firebase)
- Used by: Screens, Hooks, Context providers
- Purpose: Database operations and schema management
- Location: `src/db/`
- Contains: Drizzle ORM schema, SQLite initialization, helper functions
- Depends on: expo-sqlite, drizzle-orm
- Used by: Storage service, Auth service, Database initialization
- Purpose: Shared type definitions and constants
- Location: `src/types/`
- Contains: Entry, Category, RecordingState interfaces; CATEGORIES constant
- Depends on: None (pure TypeScript)
- Used by: All other layers

## Data Flow

### Primary Recording Path

### Note Save/Update Path

### Search Path

### Authentication Path

- Theme: Global via ThemeContext (`src/theme/ThemeContext.tsx`)
- Auth: Global via AuthContext (`src/context/AuthContext.tsx`)
- Recording state: Local via useRecording hook (`src/hooks/useRecording.ts`)
- Screen state: Local useState/useRef in each screen component
- Entries: Fetched per-screen via storage service, no global store
- UI state (selected category, search query): Local useState

## Key Abstractions

- Purpose: Core data unit representing a voice recording + AI analysis
- Examples: `src/types/index.ts:10-23`, `src/db/schema.ts:21-49`
- Pattern: App-facing Entry (simplified) maps to/from Drizzle Entry (extended with DB columns)
- Purpose: Result from Gemini categorization service
- Examples: `src/types/index.ts:28-35`
- Pattern: Plain object, validated and normalized by service
- Purpose: Lifecycle state of audio recording
- Examples: `src/types/index.ts:39-46`
- Pattern: Status enum + boolean flags for UI binding
- Purpose: Manages light/dark/system theme with design tokens
- Examples: `src/theme/ThemeContext.tsx`, `src/theme/index.ts`
- Pattern: Context + hook pattern, derives colors from theme object
- Purpose: Manages user identity (local or Firebase)
- Examples: `src/context/AuthContext.tsx`
- Pattern: Context + hook pattern, lazy-loads Firebase modules

## Entry Points

- Location: `index.ts`
- Triggers: Expo registers root component on app launch
- Responsibilities: Calls `registerRootComponent(App)`
- Location: `App.tsx:289-297`
- Triggers: index.ts
- Responsibilities: Wraps AppContent in ThemeProvider and AuthProvider
- Location: `App.tsx:193-221`
- Triggers: App component renders
- Responsibilities: Initializes database, waits for auth ready, renders NavigationContainer with MainTabs
- Location: `App.tsx:41-191`
- Triggers: AppContent renders after DB and auth ready
- Responsibilities: Renders 4 tabs (Home, Search, Record, Settings) + manages bottom sheet overlay
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

### Hardcoded API Keys in Environment

### Database Rebuild on Corruption

## Error Handling

- API errors: Extract response body and throw with status code and detail message (`src/services/transcription.ts:22-29`)
- DB corruption: Catch and rebuild database with warning log (`src/db/index.ts:34-38`)
- Auth failures: Silent fallback to local user when Firebase not configured (`src/services/auth.ts:39-42`)
- UI errors: Try-catch in screen effects with console.error and graceful degradation (`src/screens/HomeScreen.tsx:57-59`)
- AI response validation: Check for empty/blocked responses and return safe defaults (`src/services/categorization.ts:36-44`)

## Cross-Cutting Concerns

- Category and mood validated against allowed constants (`src/db/schema.ts:45-48`)
- API responses validated for expected structure before parsing (`src/services/categorization.ts:33-35`)
- Entry types use TypeScript interfaces enforced at compile time

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| schema-check | Validate Drizzle schema, TypeScript types, and V1 spec alignment before committing | `.claude/skills/schema-check/SKILL.md` |
| sketch-findings-mhat-tan | Validated design decisions, CSS patterns, and visual direction from sketch experiments. Auto-loaded during UI implementation on mhat-tan. | `.claude/skills/sketch-findings-mhat-tan/SKILL.md` |
| sqlite-query | Build, test, and debug SQLite queries using Drizzle ORM for the Mhat Tan project | `.claude/skills/sqlite-query/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
