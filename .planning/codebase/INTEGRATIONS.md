# External Integrations

**Analysis Date:** 2026-07-17

## APIs & External Services

**Speech-to-Text:**
- ElevenLabs Scribe v2 - Burmese voice transcription
  - Endpoint: `https://api.elevenlabs.io/v1/speech-to-text`
  - SDK/Client: Direct HTTP fetch with FormData
  - Auth: `EXPO_PUBLIC_ELEVENLABS_API_KEY` (API key in header)
  - Implementation: `src/services/transcription.ts`
  - Language: `my` (Burmese)
  - Model: `scribe_v2`

**AI Categorization:**
- Google Gemini 2.5 Flash - Entry categorization and summarization
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
  - SDK/Client: Direct HTTP fetch with JSON
  - Auth: `EXPO_PUBLIC_GEMINI_API_KEY` (API key in query param)
  - Implementation: `src/services/categorization.ts`
  - Output: Category, title, summary, mood, items, date

## Data Storage

**Databases:**
- SQLite (local-first, device storage)
  - Client: `expo-sqlite` 16.0.10 + `drizzle-orm` 0.45.2
  - Database file: `mhat-tan.db`
  - Implementation: `src/db/index.ts`, `src/db/schema.ts`
  - Tables: 5 (users, entries, user_settings, daily_usage, corrections)
  - Features: WAL mode, foreign keys, FTS5 full-text search

**File Storage:**
- Local filesystem only (app private storage)
  - Location: `{document}/recordings/` directory
  - Implementation: `src/services/audioStorage.ts`
  - Format: M4A audio files with timestamped filenames
  - No cloud file storage (V2+ will add Firebase Storage)

**Caching:**
- None (local-first architecture, data persists in SQLite)

## Authentication & Identity

**Primary Auth Provider:**
- Firebase Auth (Google Sign-In)
  - Implementation: `src/services/auth.ts`
  - Configuration: `src/config/firebase.ts`
  - Auth method: Google OAuth
  - Dependencies: `firebase` 12.16.0, `@react-native-google-signin/google-signin` 11.0.1
  - Web client ID: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - Required Firebase config: API key, auth domain, project ID, storage bucket, messaging sender ID, app ID

**Fallback Auth:**
- Local device user (no authentication required)
  - User ID: `local-device-user`
  - Used when Firebase is not configured
  - All data stored locally in SQLite

**Auth Flow:**
1. Local mode: App creates/uses local user ID
2. Sign in: User authenticates with Google → Firebase UID → migrates local data
3. Sign out: Reverts to local user mode

## Cloud Services

**Firebase Firestore:**
- Status: Not yet implemented (planned for V2+)
- Purpose: Optional cloud sync across devices
- Configuration: `src/config/firebase.ts` (initialized but not used for sync)

**Firebase Auth:**
- Status: Implemented
- Purpose: User authentication and identity
- Usage: `src/services/auth.ts`, `src/context/AuthContext.tsx`

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console logging (dev mode only)
  - Pattern: `[ServiceName]` prefix for service logs
  - Examples: `[DB]`, `[Firebase]`, `[Auth]`, `[Categorization]`

## CI/CD & Deployment

**Hosting:**
- Not deployed (in development)
- Target: Android device/emulator

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Runner: Ubuntu latest
- Steps: Checkout → Node 20 → npm ci/install → Lint → Typecheck → Test → Build
- Each step guarded with `--if-present` for progressive enforcement
- Dependabot configured for weekly dependency updates

**Build Commands:**
```bash
npm run start          # Expo dev server
npm run android        # Build and run on Android
npm run ios            # Build and run on iOS
npm run web            # Start web version
```

## Environment Configuration

**Required environment variables:**
```bash
# Speech-to-Text
EXPO_PUBLIC_ELEVENLABS_API_KEY

# AI Categorization
EXPO_PUBLIC_GEMINI_API_KEY

# Firebase (required for auth, optional for cloud sync)
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
```

**Secrets location:**
- `.env` file (not committed to git)
- `.env.example` for template

**Configuration validation:**
- Firebase initializes only if API key is present
- All API services check for key and throw if missing
- App runs in local-only mode without Firebase configured

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- ElevenLabs API (audio file upload)
- Gemini API (prompt request)
- Firebase Auth (token exchange)

## Third-Party Libraries

**Key integrations:**
- `expo-av` - Audio recording and playback
- `expo-sqlite` - SQLite database
- `expo-file-system` - Local file I/O
- `expo-crypto` - UUID generation
- `expo-haptics` - Device haptics
- `react-native-markdown-display` - Markdown rendering
- `react-native-safe-area-context` - Safe area insets
- `react-native-screens` - Native screen optimization

**Optional integrations:**
- `@react-native-google-signin/google-signin` - Google OAuth
- `firebase` - Authentication and cloud services

## API Rate Limits

**ElevenLabs:**
- Free tier: Limited transcription minutes
- Implementation handles errors gracefully
- Throws descriptive error with status code and message

**Gemini:**
- Free tier: 15 RPM, 1M tokens/day
- Implementation returns safe defaults on blocked/empty responses
- No retry logic implemented

## Data Flow Summary

**Recording → Storage:**
1. Audio recorded via `expo-av` (`src/services/recording.ts`)
2. Audio saved to local filesystem (`src/services/audioStorage.ts`)
3. Audio URI passed to ElevenLabs (`src/services/transcription.ts`)
4. Transcript passed to Gemini (`src/services/categorization.ts`)
5. Categorized result saved to SQLite (`src/services/storage.ts`)

**Authentication:**
1. App starts → local user created/loaded (`src/context/AuthContext.tsx`)
2. User signs in with Google → Firebase Auth (`src/services/auth.ts`)
3. Local data migrated to Firebase UID
4. All operations use Firebase UID as user ID

---

*Integration audit: 2026-07-17*
