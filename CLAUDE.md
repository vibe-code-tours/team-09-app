# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mhat Tan (မှတ်တမ်း) — voice-first daily record app for Burmese speakers. Speak in Burmese, get AI transcription and auto-categorization into 6 categories (Money, Feelings, Work, Health, Ideas, Other), displayed on a timeline. Built with Expo SDK 54, targeting Android first.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation 7 (bottom tabs + native-stack) |
| Recording | expo-av |
| Transcription | ElevenLabs Scribe v2 API |
| Categorization | Gemini 2.0 Flash API |
| Database | Cloud Firestore (Firebase Web SDK, not `@react-native-firebase`) |
| Auth | Firebase Auth (Phone method — not yet implemented in UI) |

## Development Commands

```bash
npm install                          # Install dependencies first

npx expo start                       # Start Expo dev server
npx expo start --android             # Start for Android (primary target)
npx expo start --web                 # Start for web browser

npx tsc --noEmit                     # Type check (no typecheck script in package.json yet)
npx expo install <package-name>      # Install Expo-compatible dependencies
npx expo start --clear               # Clear cache and restart
```

No lint, test, or build scripts are defined in package.json yet. The CI pipeline (`ci.yml`) runs them with `--if-present` so it stays green.

## Project Layout

```
team-09-app/                         (repo root)
├── mhat-tan/                        (the Expo app — all source lives here)
│   ├── App.tsx                      (root component, navigation setup)
│   ├── index.ts                     (registerRootComponent entry)
│   ├── src/
│   │   ├── components/              (RecordButton, EntryCard, EmptyState)
│   │   ├── screens/                 (HomeScreen, RecordScreen)
│   │   ├── hooks/                   (useRecording)
│   │   ├── services/                (transcription, categorization, storage)
│   │   ├── types/                   (Category, Entry, CATEGORIES, etc.)
│   │   └── config/                  (firebase.ts)
│   └── assets/
├── docs/                            (architecture, database schema, decisions)
├── .github/                         (CI workflows, issue templates, Dependabot)
├── PROJECT-PLAN.md                  (5-day sprint plan)
├── working-agreement.md             (team process)
└── CLAUDE.md                        (this file)
```

## App Architecture

**Entry flow:** `index.ts` → `App.tsx` → `NavigationContainer` → bottom tab navigator with Home and Record tabs. Home tab has a nested stack navigator (HomeScreen → RecordScreen).

**Data flow (recording → persistence):**
1. `useRecording` hook manages audio recording via expo-av (60s max)
2. Audio URI → `services/transcription.ts` → ElevenLabs API → transcript
3. Transcript → `services/categorization.ts` → Gemini API → `{ category, summary, items, mood, date }`
4. Result → `services/storage.ts` → Firestore at `users/{userId}/entries/{entryId}`

**State management:** Local `useState`/`useRef` only. No global state library.

## What's Implemented vs. Planned

**Built:** HomeScreen, RecordScreen UI, useRecording hook, transcription/categorization/storage services, Firebase config, type definitions.

**Not wired up:** RecordScreen save handler shows an Alert — it does not call transcription, categorization, or Firestore services. No auth flow (login screen, auth state). No Categories, Money, or Settings screens (planned per PROJECT-PLAN.md).

**Schema divergence:** `docs/mhat-tan-database-schema-v1.md` describes a SQLite + Drizzle ORM design with 7 tables. The actual code uses Cloud Firestore with a flat structure. Follow the Firestore model in `services/storage.ts` for current work.

## Code Conventions

- **TypeScript:** Strict mode, no `any`. Define interfaces in `src/types/index.ts`. Use `interface` for object shapes, `type` for unions.
- **Components:** Functional only (`React.FC<Props>`), one component per file, `PascalCase.tsx`.
- **Services:** `camelCase.ts` in `src/services/`.
- **Styling:** `StyleSheet.create()` only. Primary `#E91E63`, background `#F5F5F5`, text `#333`. Card radius 12, button radius 25.
- **Icons:** Ionicons via `@expo/vector-icons`.
- **Expo SDK docs:** Read exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Environment Variables

All required `EXPO_PUBLIC_*` variables (store in `.env`, never commit):

```env
EXPO_PUBLIC_ELEVENLABS_API_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## Git Workflow

- Branch naming: `feat/`, `fix/`, `chore/`
- PR required before merge to main, 1 approval needed
- Never commit `.env` or `node_modules`
- Expo Go is not supported in SDK 52+ — use development builds
