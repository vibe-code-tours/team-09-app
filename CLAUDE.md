# CLAUDE.md - Mhat Tan Project

> Voice-first daily record for Burmese speakers — speak your day, AI organizes it.

## Project Overview

Mhat Tan (မှတ်တမ်း) is a React Native (Expo) mobile app that lets Burmese speakers record their daily life by voice. The app transcribes speech, auto-categorizes entries, and displays a timeline.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation 6 (bottom tabs + native stack) |
| Recording | expo-av |
| Transcription | ElevenLabs Scribe v2 API |
| Categorization | Gemini 2.0 Flash API |
| Database | Cloud Firestore (Firebase) |
| Auth | Firebase Auth (Phone method) |

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── RecordButton.tsx
│   ├── EntryCard.tsx
│   └── EmptyState.tsx
├── screens/          # App screens
│   ├── HomeScreen.tsx
│   └── RecordScreen.tsx
├── hooks/            # Custom React hooks
│   └── useRecording.ts
├── services/         # API integrations
│   ├── transcription.ts
│   ├── categorization.ts
│   └── storage.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── config/           # Configuration
│   └── firebase.ts
└── utils/            # Helper functions
```

## Development Commands

```bash
# Start development server
npx expo start

# Start for specific platform
npx expo start --web      # Web browser
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator

# Type checking
npx tsc --noEmit

# Install new dependency
npx expo install <package-name>

# Clear cache
npx expo start --clear
```

## Code Style & Conventions

### TypeScript
- Use strict TypeScript (no `any` types)
- Define interfaces in `src/types/index.ts`
- Use `interface` for object shapes, `type` for unions/aliases

### React Native
- Functional components with hooks only (no class components)
- Use `React.FC<Props>` for component type
- Keep components in separate files
- Use Expo vector icons (`@expo/vector-icons/Ionicons`)

### File Naming
- Components: `PascalCase.tsx` (e.g., `RecordButton.tsx`)
- Services: `camelCase.ts` (e.g., `transcription.ts`)
- Types: `camelCase.ts` (e.g., `index.ts`)

### State Management
- Use `useState` for local state
- Use `useContext` for global state (when needed)
- Keep state close to where it's used

### Styling
- Use `StyleSheet.create()` (no inline styles)
- Colors: primary `#E91E63`, background `#F5F5F5`, text `#333`
- Border radius: 12 for cards, 25 for buttons

## API Integration

### ElevenLabs (Transcription)
- Endpoint: `https://api.elevenlabs.io/v1/speech-to-text`
- Model: `scribe_v2`
- Language: `my` (Burmese)
- Rate: $0.22/hour

### Gemini (Categorization)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Returns: `{ category, summary, items, mood, date }`
- Categories: money, feelings, work, health, ideas, other

### Firebase
- Auth: Phone number method
- Firestore: Collection `users/{userId}/entries/{entryId}`
- Security rules: Users can only access their own data

## Firebase Data Model

```
users/
└── {userId}/
    └── entries/
        └── {entryId}/
            ├── transcript: string
            ├── category: Category
            ├── summary: string
            ├── items: string[]
            ├── mood: string
            ├── audioUri: string
            ├── createdAt: Timestamp
            ├── isPinned: boolean
            └── userId: string
```

## Key Components

### RecordButton
- Circular button with pulse animation during recording
- Props: `isRecording`, `onPress`, `disabled`

### EntryCard
- Displays entry with category icon, summary, items, mood
- Props: `entry`, `onPress`

## Recording Flow

```typescript
const { state, startRecording, stopRecording, playRecording } = useRecording();

// Start recording
await startRecording();

// Stop recording
const uri = await stopRecording();

// Transcribe (when API keys are set up)
const transcript = await transcribeAudio(uri);

// Categorize
const result = await categorizeEntry(transcript);

// Save to Firestore
await saveEntry(userId, { ...entry, ...result });
```

## Environment Variables

API keys are stored in `.env` (never commit this file):

```env
EXPO_PUBLIC_ELEVENLABS_API_KEY=xxx
EXPO_PUBLIC_GEMINI_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
```

## Testing

- Test on real iPhone/Android using Expo Go or development build
- Test recording with actual Burmese speech
- Test offline mode (airplane mode)
- Test free limit (3 recordings/day)

## Git Workflow

- Branch naming: `feat/`, `fix/`, `chore/`
- PR required before merge to main
- Keep commits atomic and message clear
- Never commit `.env` or `node_modules`

## Known Issues

- Expo Go is no longer supported in Expo SDK 52+ — use development builds
- Recording on iOS requires microphone permission in Info.plist

## Resources

- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Gemini API](https://ai.google.dev/docs)

## Team

- 3 members, rotating weekly roles (Anchor, Driver, Reviewer)
- Daily async standups required
- PRs must have 1 review before merge
