# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Version

**Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any Expo-related code.** Expo has changed significantly — do not rely on older patterns.

## Platform Support

**iOS and Android** — both platforms are first-class targets. All features must work on both.

## Commands

```bash
# Development
npx expo start              # Start dev server (scan QR with Expo Go)
npx expo start --ios        # Start on iOS simulator
npx expo start --android    # Start on Android emulator
npx expo start --web        # Start on web (for quick testing only)

# Type checking
npx tsc --noEmit            # Run TypeScript compiler (no output = clean)

# Install dependencies
npx expo install <package>  # Always use expo install for compatible versions

# Clear cache
npx expo start --clear
```

## Architecture

**Mhat Tan** (မှတ်တမ်း) is a voice-first daily diary for Burmese speakers. Users speak their day (1 min max), AI transcribes and categorizes it, and the app shows a timeline.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 (managed workflow, New Architecture) |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Recording | expo-av |
| Transcription | ElevenLabs Scribe v2 API |
| Categorization | Gemini 2.0 Flash API |
| Database | Cloud Firestore (Firebase Web JS SDK, not @react-native-firebase) |
| Auth | Firebase Auth (Phone method) — **not implemented yet** |

### Project Structure

```
mhat-tan/
├── App.tsx                    # Root: ThemeProvider + NavigationContainer + tabs + RecordingOverlay
├── src/
│   ├── theme/                 # Design tokens + ThemeContext (light/dark/system)
│   │   ├── index.ts           # Colors, spacing, radius, categories, createShadows()
│   │   └── ThemeContext.tsx    # useTheme() hook
│   ├── types/                 # TypeScript types (Entry, Category, RecordingState)
│   ├── screens/               # HomeScreen, RecordScreen
│   ├── components/            # ElevatedTabBar, EntryCard, EmptyState, RecordButton
│   ├── hooks/                 # useRecording (expo-av wrapper)
│   ├── services/              # transcription.ts, categorization.ts, storage.ts
│   └── config/                # Firebase initialization
└── .planning/sketches/        # HTML design sketches (001-C, 002-A, 003-A)
```

### Navigation Layout

- **Bottom Tab Navigator** with 5 tabs: Home, Search, Record (center), Money, Settings
- Home tab has a **nested Stack Navigator**: `HomeMain` → `Record`
- The center "Record" tab triggers a `RecordingOverlay` (animated floating card), not a screen push
- Only Home and Record tabs are functional; Search, Money, Settings show HomeScreen as placeholder

### Theme System

All colors are defined in `src/theme/index.ts` with light/dark palettes:

```typescript
// Access theme in components
import { useTheme } from '../theme/ThemeContext';
const { theme, isDark } = useTheme();
const { colors } = theme;

// Create shadows
import { createShadows } from '../theme';
const shadows = createShadows(isDark, colors.primary);
```

**Colors:**
- Primary: `#E91E63`
- Background: `#F5F5F5`
- Surface: `#FFFFFF`
- Text: `#333333`
- Text Muted: `#9E9E9E`

**Spacing:** `spacing.xs(4)`, `spacing.sm(8)`, `spacing.md(12)`, `spacing.lg(16)`, `spacing.xl(24)`
**Radius:** `radius.sm(8)`, `radius.md(12)`, `radius.lg(16)`, `radius.full(9999)`

**Exception**: `RecordScreen.tsx` hardcodes colors — it does not use the theme system yet.

### Categories

6 types defined in `src/theme/index.ts`:

| Key | Icon | Color | Label |
|-----|------|-------|-------|
| money | 💰 | #4CAF50 | Money |
| feelings | 😊 | #FF9800 | Feelings |
| work | 💼 | #2196F3 | Work |
| health | ❤️ | #F44336 | Health |
| ideas | 💡 | #9C27B0 | Ideas |
| other | 📝 | #607D8B | Other |

## Firebase Data Model

```
users/{userId}/
└── entries/{entryId}/
    ├── transcript: string          # Burmese text from ElevenLabs
    ├── category: string            # money | feelings | work | health | ideas | other
    ├── summary: string             # AI-generated summary (English)
    ├── items: string[]             # Key points extracted
    ├── mood: string                # Detected mood (happy, neutral, etc.)
    ├── audioUri: string            # Local audio file path
    ├── createdAt: Timestamp        # When entry was recorded
    ├── isPinned: boolean           # User can pin important entries
    └── userId: string              # Owner reference
```

## API Endpoints

### ElevenLabs (Transcription)

```typescript
POST https://api.elevenlabs.io/v1/speech-to-text
Headers:
  xi-api-key: {EXPO_PUBLIC_ELEVENLABS_API_KEY}
  Content-Type: multipart/form-data
Body:
  file: <audio-file>
  model_id: "scribe_v2"
  language_code: "my"    // Burmese
Response:
  { text: "Burmese transcript..." }
```

**Pricing:** $0.22/hour

### Gemini (Categorization)

```typescript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={EXPO_PUBLIC_GEMINI_API_KEY}
Body:
  {
    "contents": [{
      "parts": [{"text": "Categorize this diary entry: {transcript}"}]
    }]
  }
Response:
  {
    "category": "feelings",
    "summary": "Had a great day...",
    "items": ["Met friends", "Ate biryani"],
    "mood": "happy",
    "date": "2024-01-15"
  }
```

### Firebase Auth (Phone)

```typescript
// Not implemented yet
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
const auth = getAuth();
const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
const result = await confirmation.confirm(verificationCode);
```

## Key Components

### RecordButton
```typescript
interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}
```

### EntryCard
```typescript
interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
}
```

### ElevatedTabBar
Custom bottom tab bar with elevation shadow effect.

## Recording Flow

```typescript
// 1. Start recording
const { recording, startRecording } = useRecording();
await startRecording();

// 2. Stop recording (returns URI)
const uri = await stopRecording();

// 3. Transcribe with ElevenLabs
const transcript = await transcribeAudio(uri);

// 4. Categorize with Gemini
const result = await categorizeEntry(transcript);

// 5. Save to Firestore
await saveEntry(userId, {
  transcript,
  category: result.category,
  summary: result.summary,
  items: result.items,
  mood: result.mood,
  audioUri: uri,
  createdAt: new Date(),
  isPinned: false,
  userId
});
```

## Environment Variables

Create `.env` file (never commit):

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx

# AI Services
EXPO_PUBLIC_ELEVENLABS_API_KEY=xxx
EXPO_PUBLIC_GEMINI_API_KEY=xxx
```

## Key Patterns

1. **Two recording flows**: Center tab → `RecordingOverlay` (floating), vs. Home stack → `RecordScreen` (full screen). Both use `useRecording` hook.
2. **Mock data**: HomeScreen uses hardcoded `MOCK_ENTRIES` and `STATS`. Services are implemented but not wired into screens yet.
3. **Unused component**: `EntryCard.tsx` exists but HomeScreen renders cards inline. Consider consolidating.
4. **No auth yet**: Firebase Auth is initialized but no login screen or auth listener exists.
5. **Design sketches**: HTML files in `.planning/sketches/` with CSS vars. Sketch variants (001-C, 002-A, 003-A) map to implemented components.

## Common Gotchas

1. **Expo Go is dead** — SDK 52+ requires development builds. Use `npx expo run:ios` / `npx expo run:android` or EAS Build.
2. **iOS microphone permission** — Must add `NSMicrophoneUsageDescription` to `ios/[App]/Info.plist`.
3. **Android microphone permission** — Must add `<uses-permission android:name="android.permission.RECORD_AUDIO"/>` to `android/app/src/main/AndroidManifest.xml`.
4. **Recording on iOS** — `playsInSilentModeIOS: true` required for recording to work when phone is on silent.
5. **Firebase Web SDK** — Do NOT install `@react-native-firebase/*` packages. We use the Web JS SDK (`firebase/app`, `firebase/firestore`).
6. **Lock file conflicts** — After merging, run `npm install` to regenerate `package-lock.json`.
7. **RecordScreen hardcoded colors** — Doesn't use theme system yet. Will be updated.

## Working Rules

### Before Modifying Files
1. **Inspect existing code first** — Read the file to understand current patterns and structure.
2. **Propose a short plan** — Explain what you'll change and why before making edits.
3. **Keep changes minimal** — Only modify what's needed for the task.

### Security
- **Never put secrets in committed files** — Use `.env` for API keys and config.
- **Keep `.env.example` updated** — Document all required environment variables.
- **Never commit:** `.env`, `google-services.json`, `GoogleService-Info.plist`, `node_modules/`

### Code Quality
- **Use theme system** — Always use `useTheme()` for colors, spacing, shadows. Don't hardcode values.
- **Use functional components** — No class components. Use hooks for state and side effects.
- **TypeScript strict** — No `any` types. Define interfaces for all props and data structures.
- **Use `expo install`** — Always install packages with `npx expo install` for compatible versions.
- **Use Ionicons** — For all icons. Import from `@expo/vector-icons/Ionicons`.

### File Organization
- **Components** go in `src/components/` — One component per file, PascalCase naming.
- **Screens** go in `src/screens/` — One screen per file, PascalCase naming.
- **Services** go in `src/services/` — API calls and external integrations, camelCase naming.
- **Hooks** go in `src/hooks/` — Custom React hooks, camelCase with `use` prefix.
- **Types** go in `src/types/` — Shared TypeScript interfaces.

### Git Workflow

- **Branch naming:** `feat/`, `fix/`, `chore/`, `refactor/`
- **PR required** before merge to `main`
- **Keep commits atomic** — one logical change per commit
- **Never commit:** `.env`, `node_modules/`, `google-services.json`, `GoogleService-Info.plist`
- **Lock file conflicts:** Accept one side, then run `npm install` to regenerate

## Testing

- Test on **both iOS and Android** (Expo Go no longer works with SDK 54)
- Test on real devices, not just simulators
- Test recording with actual Burmese speech on both platforms
- Test offline mode (airplane mode)
- Run `npx tsc --noEmit` before committing (no lint/test scripts configured yet)
