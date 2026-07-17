# Technology Stack

**Analysis Date:** 2026-07-17

## Languages

**Primary:**
- TypeScript ~5.9.2 - All source code, strict mode enabled
- React 19.1.0 - UI components and application logic

**Secondary:**
- SQL - Database schema and migrations (raw SQL + Drizzle ORM)

## Runtime

**Environment:**
- Node.js 26.2.0 - Build and development
- React Native 0.81.5 - Mobile runtime

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Expo SDK 54 - React Native development and build tooling
- React Navigation 7 - Bottom tabs + native-stack navigation

**Testing:**
- None configured yet - CI pipeline uses `npm test --if-present`

**Build/Dev:**
- Expo CLI - Start server, build Android/iOS/Web
- Drizzle Kit 0.31.10 - Database migrations

## Key Dependencies

**Critical:**
- `drizzle-orm` 0.45.2 - Type-safe SQLite ORM with FTS5 support
- `expo-sqlite` 16.0.10 - Local SQLite database
- `expo-av` 16.0.8 - Audio recording and playback
- `firebase` 12.16.0 - Authentication and cloud services

**Infrastructure:**
- `expo-file-system` 19.0.23 - Local file storage for recordings
- `expo-crypto` 15.0.9 - UUID generation for database IDs
- `@react-native-google-signin/google-signin` 11.0.1 - Google OAuth

**UI/UX:**
- `react-native-markdown-display` 7.0.2 - Markdown rendering
- `react-native-safe-area-context` 5.6.0 - Safe area handling
- `react-native-screens` 4.16.0 - Native screen optimization
- `expo-haptics` 15.0.8 - Haptic feedback
- `@expo/vector-icons` 15.0.3 - Ionicons icon library

## Configuration

**Environment:**
- `.env` file - Store API keys and Firebase config
- Environment variables prefixed with `EXPO_PUBLIC_*`
- Variables: `EXPO_PUBLIC_ELEVENLABS_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

**Build:**
- `app.json` - Expo app configuration (app name, splash, icons, plugins)
- `tsconfig.json` - TypeScript config (extends `expo/tsconfig.base.json`)
- `drizzle.config.ts` - Drizzle ORM SQLite configuration

## Platform Requirements

**Development:**
- Android device or emulator (primary target)
- Expo Go is not supported (SDK 52+ requires development builds)
- Node.js v20+ for CI, v26+ for local development

**Production:**
- Android APK/AAB (primary)
- iOS (secondary, not primary target)
- Web browser (experimental support)

## Build Configuration

**Android:**
- Bundle identifier: `com.anonymous.mhat-tan`
- Edge-to-edge enabled
- Adaptive icons configured
- Portrait orientation only

**iOS:**
- Bundle identifier: `com.anonymous.mhat-tan`
- Tablet support enabled

**Web:**
- Favicon configured
- Web support via Expo

## TypeScript

**Strict Mode:** Enabled
- No `any` types
- Interface definitions for object shapes
- Type aliases for union types
- Full type inference from Drizzle schema

---

*Stack analysis: 2026-07-17*
