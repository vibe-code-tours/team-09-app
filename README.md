# Mhat Tan (မှတ်တမ်း)

Voice-first daily record app for Burmese speakers — speak your day, AI organizes it.

![ci](../../actions/workflows/ci.yml/badge.svg) ![security](../../actions/workflows/security.yml/badge.svg)

## Features

- Record spoken Burmese (up to 60 seconds) with a single tap
- AI transcription via ElevenLabs Scribe v2
- Auto-categorization into 6 types: Money, Feelings, Work, Health, Ideas, Other
- Full-text search across all entries using FTS5 (Burmese-compatible)
- Timeline view with date grouping and category filters
- Audio playback for recorded entries
- Light and dark theme support
- Local-first storage with SQLite — works offline

## Quickstart

```bash
git clone https://github.com/vibe-code-tours/team-09-app.git && cd team-09-app
cp .env.example .env        # fill in real values LOCALLY — never commit .env
npm install && npm start
```

Keep this Quickstart working — it's how a new teammate onboards in 2 minutes.

## Requirements

- Node.js 20+
- npm
- Android device or emulator (primary target)

> Expo Go is not supported in SDK 52+. Use development builds instead.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation 7 |
| Recording | expo-av |
| Transcription | ElevenLabs Scribe v2 |
| Categorization | OpenAI API Compatible |
| Database | SQLite (Drizzle ORM) |
| Search | FTS5 (full-text search) |
| Auth | Firebase Auth |

## Configuration

Create a `.env` file in the project root with the following variables:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | Speech-to-text transcription API key |
| `EXPO_PUBLIC_VIBE_CODE_API_KEY` | AI categorization API key |
| `EXPO_PUBLIC_VIBE_CODE_BASE_URL` | Open AI API compatible URL |
| `EXPO_PUBLIC_VIBE_CODE_MODEL` | AI Model |
<!-- | `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | -->

Never commit `.env` to version control.

## Project structure

```text
team-09-app/
├── App.tsx                    # Root component, navigation setup
├── index.ts                   # Entry point
├── src/
│   ├── components/            # UI components (EntryCard, RecordButton, etc.)
│   ├── screens/               # Screen components (Home, Record, Search, Settings)
│   ├── hooks/                 # Custom hooks (useRecording)
│   ├── services/              # Business logic (transcription, categorization, storage)
│   ├── db/                    # SQLite schema and connection (Drizzle ORM)
│   ├── types/                 # TypeScript interfaces and constants
│   ├── theme/                 # Design tokens and ThemeContext
│   ├── context/               # AuthContext
│   ├── config/                # Firebase configuration
│   └── utils/                 # Shared utility functions
├── assets/                    # App icons and splash images
├── docs/                      # Architecture docs and database schema
├── .github/                   # CI workflows and issue templates
├── PROJECT-PLAN.md            # Sprint plan
├── working-agreement.md       # Team process
└── CLAUDE.md                  # AI assistant guidance
```

## What's already set up for you

| File | Gives you |
|------|-----------|
| `.github/workflows/ci.yml` | lint, typecheck, test, build on every PR |
| `.github/workflows/security.yml` | gitleaks (leaked keys) + semgrep (SAST) |
| `.github/dependabot.yml` | weekly PRs for vulnerable or outdated dependencies |
| `.env.example` | secret hygiene — copy to `.env`, never commit real keys |
| `.github/pull_request_template.md` | structured PR descriptions |
| `docs/` | architecture overview and decision records |
| `working-agreement.md` | how the team works (GitHub Flow + rotating roles) |

## Development

```bash
npm install
npx expo start --android          # primary target
npx expo start --web              # experimental
npx tsc --noEmit                  # type check
npx expo start --clear            # clear cache and restart
```

## Team

| Member | Link |
|--------|------|
| Thet Naing Lin | [thet-naing-lin](https://github.com/thet-naing-lin) |
| Min Tay Za | [minntayza](https://github.com/minntayza) |
| Ant Htoo Aung | [anthtooaung](https://github.com/anthtooaung) |

## Contributing

1. Create a feature branch (`feat/`, `fix/`, or `chore/`)
2. Keep PRs under 300 lines and open a Draft PR early
3. Get at least one review before merging to `main`
4. Never commit `.env` or `node_modules`

See [working-agreement.md](working-agreement.md) for the full team process.

## License

MIT
