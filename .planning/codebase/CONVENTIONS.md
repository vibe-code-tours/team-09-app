# Coding Conventions

**Analysis Date:** 2026-07-17

## Naming Patterns

**Files:**
- Components: `PascalCase.tsx` — one component per file
  - Examples: `RecordButton.tsx`, `EntryCard.tsx`, `ElevatedTabBar.tsx`, `AudioPlayer.tsx`
- Services: `camelCase.ts` — business logic and API calls
  - Examples: `transcription.ts`, `categorization.ts`, `storage.ts`, `recording.ts`, `auth.ts`
- Hooks: `camelCase.ts` with `use` prefix
  - Example: `useRecording.ts`
- Types: `index.ts` barrel files for domain types
  - Example: `src/types/index.ts`, `src/theme/index.ts`
- Config: `camelCase.ts`
  - Example: `firebase.ts`
- Context: `PascalCase.tsx` with `Provider` suffix for wrapper, `use[Name]` hook
  - Examples: `AuthContext.tsx`, `ThemeContext.tsx`
- Database: `schema.ts` (Drizzle ORM), `index.ts` (connection)
  - Examples: `src/db/schema.ts`, `src/db/index.ts`

**Functions:**
- Service functions: `camelCase` — verb-first naming
  - Examples: `transcribeAudio`, `categorizeEntry`, `saveEntry`, `getEntries`, `deleteEntry`
- React hooks: `camelCase` with `use` prefix
  - Examples: `useRecording`, `useTheme`, `useColors`, `useAuth`
- Component event handlers: `handle[Event]` pattern
  - Examples: `handleRecordPress`, `handleDiscard`, `handleBack`, `handleTextChange`
- Utility functions: `camelCase`, descriptive verb
  - Examples: `formatRelativeTime`, `formatHeaderDate`, `getGreeting`, `formatDateToFileName`

**Variables:**
- State variables: `camelCase`, descriptive noun
  - Examples: `entries`, `isRecording`, `searchResults`, `selectedCategory`
- Refs: `camelCase` with `Ref` suffix
  - Examples: `recordingRef`, `soundRef`, `timerRef`, `contentInputRef`, `stateRef`
- Constants: `UPPER_SNAKE_CASE` for module-level constants
  - Examples: `MAX_DURATION`, `LOCAL_USER_ID`, `RECORDINGS_DIR`, `DB_NAME`, `FILTERS`, `TABS`
- Boolean state: `is[State]` or `has[State]` prefix
  - Examples: `isRecording`, `isTranscribing`, `isSaving`, `isViewOnly`, `hasUnsavedChanges`, `hasRecording`

**Types:**
- Interface for object shapes
  - Examples: `Entry`, `CategorizedEntry`, `RecordingState`, `Theme`, `ThemeContextValue`
- Type for union types
  - Examples: `Category`, `RecordingStatus`, `ThemeMode`
- Route params: typed as a type alias
  - Example: `type CreateNoteParams = { entryId?: string; ... }`
- Drizzle schema types: inferred from schema definitions, not manually typed
  - Examples: `type Entry = typeof entries.$inferSelect`, `type NewEntry = typeof entries.$inferInsert`
- Props: inline interface above component definition
  - Pattern: `interface [ComponentName]Props { ... }`

## Code Style

**Formatting:**
- Tool: None configured (no Prettier, ESLint, or Biome)
- Follows React Native standard conventions manually
- 2-space indentation
- Single quotes for strings
- Trailing commas in object/array literals
- Semicolons at end of statements

**Linting:**
- Tool: None configured
- CI runs `npm run lint --if-present` which is a no-op currently
- TypeScript strict mode enforced via `tsconfig.json`

**Key Style Rules (observed from codebase):**
- No `any` types (TypeScript strict mode)
- Inline styles for theme-dependent values, `StyleSheet.create()` for static styles
- Components use arrow function syntax: `const Component: React.FC<Props> = () => { ... }`
- Services use arrow function syntax: `export const fn = async (...) => { ... }`
- One component per file, one export per module

## Import Organization

**Order (consistent across all files):**
1. React and React Native imports
2. Third-party package imports
3. Local imports (relative paths with `../` prefix)

**Pattern observed in every file:**
```typescript
// 1. React/React Native
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ... } from 'react-native';

// 2. External packages
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// 3. Local imports
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, spacing, radius } from '../theme';
import { Entry } from '../types';
import { saveEntry, getEntries } from '../services/storage';
```

**Path Aliases:** None used. All local imports use relative paths with `../` prefix.

**Re-exports:** `src/theme/index.ts` re-exports from `../types` for convenience — single import for design tokens + type constants.

## Error Handling

**Patterns:**

1. **API services — throw with status code and detail:**
```typescript
if (!response.ok) {
  const errBody = await response.text();
  throw new Error(`Categorization failed (${response.status}): ${errBody}`);
}
```
Located in: `src/services/transcription.ts:20-28`, `src/services/categorization.ts:16-28`

2. **Graceful degradation for AI responses — return safe default:**
```typescript
if (!text) {
  console.warn('[Categorization] Empty or blocked response:', JSON.stringify(result));
  return {
    category: 'other',
    title: transcript.slice(0, 30),
    summary: transcript.slice(0, 100),
    items: [],
    mood: 'neutral',
    date: 'today',
  };
}
```
Located in: `src/services/categorization.ts:33-45`

3. **Screen-level try/catch with console.error:**
```typescript
try {
  const entries = await getEntries(userId);
  setEntries(entries);
} catch (err) {
  console.error('[HomeScreen] Failed to load entries:', err);
}
```
Located in: `src/screens/HomeScreen.tsx:58-59`

4. **Empty catch blocks for cleanup operations (intentional):**
```typescript
try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
```
Located in: `src/hooks/useRecording.ts:113`

5. **Conditional initialization — check before use:**
```typescript
if (!API_KEY) {
  throw new Error('ElevenLabs API key not configured. Set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env');
}
```
Located in: `src/services/transcription.ts:5-7`

6. **Database auto-recovery on corruption:**
```typescript
try {
  await sqlite.getFirstAsync('PRAGMA quick_check');
} catch {
  console.warn('[DB] Database check failed — rebuilding...');
  await rebuildDatabase();
}
```
Located in: `src/db/index.ts:33-38`

**Rules:**
- Always log errors with `[ComponentName]` prefix
- Use `console.error` for failures, `console.warn` for non-critical issues
- API services throw errors; screens catch and display user-friendly messages
- Cleanup operations use empty catch blocks (files may already be deleted)
- Firebase/optional services degrade gracefully — no-op when not configured

## Logging

**Framework:** `console` built-in (no external logging library)

**Patterns:**
- Prefix with `[ComponentName]` or `[ServiceName]` in brackets
- Use `console.log` for success: `console.log('[DB] Database initialized successfully')`
- Use `console.warn` for non-critical: `console.warn('[Auth] Firebase modules not available:', err)`
- Use `console.error` for failures: `console.error('[RecordScreen] Categorize failed:', catErr)`
- Log structured data when useful: `console.warn('[Categorization] Empty or blocked response:', JSON.stringify(result))`

**Files with logging:**
- `src/db/index.ts`: Database lifecycle (`[DB]`)
- `src/services/auth.ts`: Auth operations (`[Auth]`)
- `src/screens/HomeScreen.tsx`: Data loading failures (`[HomeScreen]`)
- `src/screens/RecordScreen.tsx`: Transcription/categorization failures (`[RecordScreen]`)
- `src/screens/SearchScreen.tsx`: Search failures (`[SearchScreen]`)
- `src/services/categorization.ts`: API response issues (`[Categorization]`)

## Comments

**When to Comment:**
- Section headers with `// ── Section Name ─────` separator pattern (used in `SearchScreen.tsx`, `SettingsScreen.tsx`)
- Section headers with `// =============================================================================` (used in `db/schema.ts`, `db/index.ts`, `storage.ts`)
- Inline comments for non-obvious logic: `// Re-assigns all entries from localUserId to firebaseUserId`
- Comments for complex patterns: `// Uses a uuid TEXT column to store the entry's UUID`

**JSDoc/TSDoc:**
- Used on exported functions in services and database layer
- Pattern: `/** Description. */` block above function
- Not used on React components (props interface is self-documenting)
- Examples: `src/services/storage.ts`, `src/db/index.ts`, `src/services/recording.ts`

**Not Used:**
- Inline comments for obvious code
- TODO/FIXME markers (none found in codebase)
- Inline type annotations where type inference is sufficient

## Function Design

**Size:** Screens are the largest files (380-510 lines). Services are concise (35-170 lines). Hooks are focused (139 lines).

**Parameters:**
- Services accept primitive IDs and typed objects: `saveEntry(userId: string, entry: Omit<AppEntry, ...>)`
- Hooks return action functions and state: `{ state, startRecording, stopRecording, ... }`
- Components receive typed props interfaces
- Callback props use `() => void` type, optional with `?` suffix

**Return Values:**
- Services return `Promise<T>` with explicit return types
- Hooks return plain objects with state + actions
- Components return JSX directly

**Arrow vs Named Functions:**
- Components: `const Component: React.FC<Props> = () => { ... }` (arrow function)
- Service exports: `export const fn = async (...) => { ... }` (arrow function)
- Internal helpers: `function helperName(...) { ... }` (named function, e.g., `toAppEntry`, `formatDateToFileName`, `getDateGroup`)
- Context providers: `function ComponentName({ children }: { children: React.ReactNode }) { ... }` (named function)
- App shell functions: `function MainTabs() { ... }`, `function AppContent() { ... }` (named function)

## Module Design

**Exports:**
- Components: Named exports (`export const RecordButton: React.FC<Props>`)
  - Exception: `AudioPlayer` uses `export default function AudioPlayer(...)`
- Services: Named exports only (`export const saveEntry = async ...`)
- Hooks: Named exports (`export const useRecording = () => { ... }`)
- Types: Named exports (`export type Category`, `export interface Entry`)
- Database: Named exports (`export async function initDatabase()`, `export function getDb()`)

**Barrel Files:**
- `src/types/index.ts` — all domain types + constants
- `src/theme/index.ts` — design tokens + re-exports from `../types`
- No barrel files for components, services, or screens (direct imports only)

**Internal Module Structure:**
- Services are flat — one file per external concern (transcription, categorization, storage, recording, auth)
- Components are flat — one file per component
- Database has two files: `schema.ts` (definitions) + `index.ts` (connection + init)
- Screens are flat — one file per screen

## Async Patterns

**useEffect with cleanup:**
```typescript
useEffect(() => {
  let cancelled = false;

  const loadData = async () => {
    try {
      const entries = await getEntries(userId);
      if (!cancelled) setEntries(entries);
    } catch (err) {
      console.error('[Component] Failed to load:', err);
    }
  };

  loadData();
  return () => { cancelled = true; };
}, []);
```
Located in: `src/screens/HomeScreen.tsx:34-69`, `src/screens/SearchScreen.tsx:59-75`

**Refs to avoid stale closures in effects:**
```typescript
const stateRef = useRef(state);
stateRef.current = state;
// Later in effect: stateRef.current.uri
```
Located in: `src/screens/RecordScreen.tsx:50-53`

**useFocusEffect for screen data loading:**
```typescript
useFocusEffect(
  useCallback(() => {
    let cancelled = false;
    const loadData = async () => { ... };
    loadData();
    return () => { cancelled = true; };
  }, [])
);
```
Located in: `src/screens/HomeScreen.tsx:34-69`, `src/screens/SearchScreen.tsx:59-75`

## Styling Conventions

**StyleSheet.create() only:**
- Defined at bottom of every component file
- Static styles only — no dynamic values

**Theme-dependent styles applied inline:**
```typescript
<View style={[styles.container, { backgroundColor: colors.bg }]}>
```
Colors always come from `useTheme()` → `theme.colors`

**Design tokens from `src/theme/index.ts`:**
- `spacing`: `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `xxl(24)`, `xxxl(32)`
- `radius`: `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `full(9999)`
- `createShadows(isDark, primaryColor)` — theme-aware shadow presets
- Use tokens instead of raw pixel values

**Inline style rules:**
- Use `StyleSheet.hairlineWidth` for thin borders (1px)
- Use `gap` property for flex spacing (React Native 0.81+)
- Use `flex: 1` for fill behavior
- Avoid hardcoded colors — always pull from `colors` object
- Emoji used for icons in category chips and section headers

**Icons:**
- `Ionicons` from `@expo/vector-icons` — used throughout
- Icon names: `kebab-case` string literals
- Examples: `'mic'`, `'stop'`, `'play'`, `'pause'`, `'search-outline'`, `'document-text'`

---

*Convention analysis: 2026-07-17*
