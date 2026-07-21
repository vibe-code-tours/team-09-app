# Codebase Concerns

**Analysis Date:** 2026-07-17

## Tech Debt

**Missing Development Tooling:**
- Issue: No lint, test, or type-checking scripts defined in `package.json` (only basic start/android/ios/web scripts)
- Files: `package.json`
- Impact: No automated code quality enforcement; CI runs with `--if-present` flag so it stays green without tests
- Fix approach: Add ESLint, Jest/Vitest configuration; create test files; add typecheck script

**No Test Coverage:**
- Issue: Zero test files exist in the codebase (`*.test.*` or `*.spec.*`)
- Files: None found
- Impact: No regression protection; refactoring is risky; no way to verify behavior
- Fix approach: Add unit tests for services, integration tests for database operations, component tests for UI

**Hardcoded Colors Bypassing Theme System:**
- Issue: Some files use hardcoded color values instead of accessing them through theme context
- Files: `src/screens/HomeScreen.tsx:352`, `src/screens/SearchScreen.tsx:128`
- Impact: Dark mode breaks in these locations; inconsistency in visual design
- Fix approach: Replace all hardcoded colors with theme-derived values from `colors.primary`, `colors.bg`, etc.

**Large Screen Files:**
- Issue: Several screen components exceed 450 lines, making maintenance difficult
- Files: `src/screens/HomeScreen.tsx` (510 lines), `src/screens/RecordScreen.tsx` (477 lines), `src/screens/CreateNoteScreen.tsx` (473 lines)
- Impact: Hard to understand, modify, and test; high cognitive load
- Fix approach: Extract subcomponents (e.g., `EntryCard`, `CategoryChips`, `SearchBar`); move business logic to custom hooks

## Known Bugs

**JSON Parsing from LLM Response Can Fail Silently:**
- Issue: `categorizeEntry()` in `src/services/categorization.ts:47` uses regex to strip markdown code blocks from LLM response before JSON.parse, which can fail on malformed responses
- Files: `src/services/categorization.ts:47`
- Trigger: LLM returns invalid JSON or unexpected format
- Workaround: Already has fallback to 'other' category, but user gets incomplete categorization without clear feedback

**Silent Error Swallowing in Authentication Flow:**
- Issue: `src/context/AuthContext.tsx:112` catches initialization errors and proceeds anyway without user notification
- Files: `src/context/AuthContext.tsx:112-114`
- Trigger: Database initialization fails
- Workaround: App continues in local mode, but user has no indication of the failure

**RecordScreen Error Handler Doesn't Show User Feedback:**
- Issue: `src/screens/RecordScreen.tsx:146` catches errors in `handleRecordPress()` with empty catch block
- Files: `src/screens/RecordScreen.tsx:144-147`
- Trigger: Recording permission denied or other recording error
- Workaround: None - user has no indication of what went wrong

## Security Considerations

**API Key Passed in URL Query Parameter:**
- Risk: Gemini API key is passed as URL query parameter in `src/services/categorization.ts:17`, which can be logged in server logs and browser history
- Files: `src/services/categorization.ts:17`
- Current mitigation: Key is from environment variable (EXPO_PUBLIC_GEMINI_API_KEY)
- Recommendations: Move API key to request header or body; query params are generally less secure than headers

**No Rate Limiting on API Calls:**
- Risk: No protection against excessive API calls that could lead to unexpected costs or rate limit errors
- Files: `src/services/transcription.ts`, `src/services/categorization.ts`
- Current mitigation: None
- Recommendations: Add client-side rate limiting; implement retry logic with exponential backoff

**Firebase Configuration in Client Bundle:**
- Risk: Firebase config is embedded in client code (standard for Firebase), but project ID and other identifiers are exposed
- Files: `src/config/firebase.ts:7-13`
- Current mitigation: Uses environment variables, not hardcoded
- Recommendations: Ensure Firebase security rules restrict unauthorized access; verify Firestore rules are properly configured

## Performance Bottlenecks

**Loading All Entries on Home Screen Focus:**
- Problem: `HomeScreen` calls `getEntries()` which loads ALL entries for the user without pagination
- Files: `src/screens/HomeScreen.tsx:40-42`
- Cause: SQLite query fetches all records; only 5 are displayed
- Improvement path: Add pagination or limit query to recent entries; use cursor-based loading

**Autosave Debounce May Cause Data Loss:**
- Problem: CreateNoteScreen uses 2-second debounce for autosave; rapid changes may lose intermediate states
- Files: `src/screens/CreateNoteScreen.tsx:88-127`
- Cause: `setTimeout` cancellation logic may discard unsaved changes if user navigates away quickly
- Improvement path: Add immediate save on blur/navigation; show unsaved changes indicator

**Multiple Re-renders in RecordScreen:**
- Problem: Complex state machine in RecordScreen with many state variables causes frequent re-renders
- Files: `src/screens/RecordScreen.tsx:42-47`
- Cause: State variables `transcript`, `isTranscribing`, `transcribeError`, `category`, `isCategorizing`, `hasNavigatedToNote` update independently
- Improvement path: Consolidate related state into single state object; use `useReducer` for complex state logic

## Fragile Areas

**Categorization Service Relies on LLM Response Format:**
- Files: `src/services/categorization.ts:33-45`
- Why fragile: Code parses LLM response assuming specific JSON structure; LLM can return unexpected formats
- Safe modification: Always validate response structure before use; add defensive checks for each field
- Test coverage: None - no tests for this critical path

**Nested Navigation State in App.tsx:**
- Files: `App.tsx:44-67`
- Why fragile: Bottom sheet animation logic is tightly coupled with navigation; state management across tabs is complex
- Safe modification: Extract bottom sheet to separate component; use navigation events instead of refs
- Test coverage: None - no integration tests for navigation

**Database Schema Migration in initDatabase():**
- Files: `src/db/index.ts:129-134`
- Why fragile: Uses try/catch to handle ALTER TABLE for migration; error handling assumes column already exists
- Safe modification: Use migration versioning; add proper migration tracking
- Test coverage: None - no tests for migration paths

## Scaling Limits

**SQLite Performance with Large Datasets:**
- Current capacity: Unknown - no benchmarks; SQLite performs well with proper indexing
- Limit: Will degrade with 10,000+ entries without pagination
- Scaling path: Add pagination to all list queries; consider FTS5 for search (already implemented)

**API Call Volume:**
- Current capacity: No monitoring; depends on user activity and free tier limits
- Limit: ElevenLabs and Gemini APIs have rate limits; app will fail without graceful degradation
- Scaling path: Add usage tracking; implement queue for offline recordings; cache recent results

## Dependencies at Risk

**Firebase SDK (firebase@12.16.0):**
- Risk: Firebase SDK is large and complex; version updates can introduce breaking changes
- Impact: Authentication, Firestore, and analytics would break
- Migration plan: Keep Firebase at stable version; test thoroughly before updates; consider Firebase alternatives for V2+

**Expo SDK (expo@54.0.34):**
- Risk: Expo SDK has frequent updates; some packages may become deprecated
- Impact: Core app functionality depends on expo-av, expo-sqlite, expo-crypto
- Migration plan: Track Expo release notes; update incrementally; use `npx expo install` for compatibility

## Missing Critical Features

**Offline Support and Sync:**
- Problem: No offline queue for API calls; no sync mechanism between devices
- Blocks: Users can't work offline; data doesn't sync across devices

**Error Reporting and Analytics:**
- Problem: No error tracking service (Sentry, LogRocket, etc.); only console.error logging
- Blocks: Can't monitor production issues; can't track usage patterns; can't prioritize fixes

**Data Export/Backup:**
- Problem: No way for users to export their data; no backup mechanism
- Blocks: Users can't migrate to another app; data loss is permanent if device is lost

## Test Coverage Gaps

**Service Layer (High Priority):**
- What's not tested: `transcription.ts`, `categorization.ts`, `storage.ts`, `recording.ts`
- Files: `src/services/*.ts`
- Risk: Critical path failures (recording, transcription, categorization) have no automated detection
- Priority: High

**Database Operations (High Priority):**
- What's not tested: Schema migrations, CRUD operations, FTS5 search
- Files: `src/db/schema.ts`, `src/db/index.ts`, `src/services/storage.ts`
- Risk: Data corruption or loss goes unnoticed; migrations may break existing data
- Priority: High

**Component Rendering (Medium Priority):**
- What's not tested: All UI components (`HomeScreen`, `RecordScreen`, `CreateNoteScreen`, `SearchScreen`)
- Files: `src/screens/*.tsx`, `src/components/*.tsx`
- Risk: UI regressions go unnoticed; navigation flows break without detection
- Priority: Medium

**Hook Logic (Medium Priority):**
- What's not tested: `useRecording` hook state machine
- Files: `src/hooks/useRecording.ts`
- Risk: Recording lifecycle issues (start, pause, stop, cleanup) go undetected
- Priority: Medium

---

*Concerns audit: 2026-07-17*
