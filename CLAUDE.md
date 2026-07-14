# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Version

**Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any Expo-related code.** Expo has changed significantly — do not rely on older patterns.

## Commands

```bash
# Development
npx expo start              # Start dev server (scan QR with Expo Go)
npx expo start --ios        # Start on iOS simulator
npx expo start --web        # Start on web

# Type checking
npx tsc --noEmit            # Run TypeScript compiler (no output = clean)

# No lint or test scripts are configured yet
```

## Architecture

**Mhat Tan** (မှတ်တမ်း) is a voice-first daily diary for Burmese speakers. Users speak their day (1 min max), AI transcribes and categorizes it, and the app shows a timeline.

### Tech Stack
- **React Native + Expo SDK 54** (managed workflow, New Architecture enabled)
- **React Navigation 7** — Bottom tabs + nested stack navigators
- **Firebase Web JS SDK** (not `@react-native-firebase`) — Firestore for storage
- **ElevenLabs Scribe v2** — Burmese speech-to-text
- **Gemini 2.0 Flash** — Auto-categorization of transcripts

### Project Structure
```
mhat-tan/
├── App.tsx                    # Root: ThemeProvider + NavigationContainer + tabs + RecordingOverlay
├── src/
│   ├── theme/                 # Design tokens + ThemeContext (light/dark/system)
│   ├── types/                 # TypeScript types (Entry, Category, RecordingState)
│   ├── screens/               # HomeScreen, RecordScreen
│   ├── components/            # ElevatedTabBar, EntryCard, EmptyState, RecordButton
│   ├── hooks/                 # useRecording (expo-av wrapper)
│   ├── services/              # transcription.ts, categorization.ts, storage.ts
│   └── config/                # Firebase initialization
```

### Navigation Layout
- **Bottom Tab Navigator** with 5 tabs: Home, Search, Record (center), Money, Settings
- Home tab has a **nested Stack Navigator**: `HomeMain` → `Record`
- The center "Record" tab triggers a `RecordingOverlay` (animated floating card), not a screen push
- Only Home and Record tabs are functional; Search, Money, Settings show HomeScreen as placeholder

### Theme System
All colors are defined in `src/theme/index.ts` with light/dark palettes. Use `useTheme()` from `ThemeContext` to access colors and `createShadows(isDark, primaryColor)` for shadows.

**Exception**: `RecordScreen.tsx` hardcodes colors — it does not use the theme system yet.

### Categories
6 types defined in `src/theme/index.ts`: money, feelings, work, health, ideas, other. Each has icon, label, and color. HomeScreen renders horizontal filter chips to filter entries.

### External API Keys (via `EXPO_PUBLIC_` env vars)
- `EXPO_PUBLIC_FIREBASE_*` — Firebase config
- `EXPO_PUBLIC_GEMINI_API_KEY` — Gemini AI
- `EXPO_PUBLIC_ELEVENLABS_API_KEY` — Speech-to-text

## Key Patterns

1. **Two recording flows**: Center tab → `RecordingOverlay` (floating), vs. Home stack → `RecordScreen` (full screen). Both use `useRecording` hook.
2. **Mock data**: HomeScreen uses hardcoded `MOCK_ENTRIES` and `STATS`. Services are implemented but not wired into screens yet.
3. **Unused component**: `EntryCard.tsx` exists but HomeScreen renders cards inline. Consider consolidating.
4. **No auth yet**: Firebase Auth is initialized but no login screen or auth listener exists.
5. **Design sketches**: HTML files in `.planning/sketches/` with CSS vars. Sketch variants (001-C, 002-A, 003-A) map to implemented components.
