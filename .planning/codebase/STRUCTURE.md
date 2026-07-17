# Codebase Structure

**Analysis Date:** 2026-07-17

## Directory Layout

```
team-09-app/
├── App.tsx                          # Root component: Theme + Auth + Navigation setup
├── index.ts                         # Entry point: registerRootComponent(App)
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript config (strict mode)
├── drizzle.config.ts                # Drizzle ORM config (schema location, DB path)
├── app.json                         # Expo app metadata
├── .env                             # Environment variables (EXPO_PUBLIC_*)
├── .env.example                     # Template for environment variables
├── CLAUDE.md                        # Claude Code guidance
├── PROJECT-PLAN.md                  # 5-day sprint plan
├── UI-SPEC.md                       # UI specification
├── SETUP.md                         # Development setup guide
├── working-agreement.md             # Team process agreement
├── README.md                        # Project readme
├── LICENSE                          # License file
│
├── src/                             # All application source code
│   ├── types/                       # Shared TypeScript type definitions
│   │   └── index.ts                 # Entry, Category, RecordingState interfaces; CATEGORIES constant
│   │
│   ├── db/                          # Database layer (SQLite + Drizzle ORM)
│   │   ├── schema.ts                # Drizzle ORM schema: 5 tables + FTS5 virtual table
│   │   └── index.ts                 # DB initialization, migrations, connection management
│   │
│   ├── services/                    # Business logic and external API integration
│   │   ├── transcription.ts         # ElevenLabs Scribe v2 transcription
│   │   ├── categorization.ts        # Gemini 2.0 Flash categorization
│   │   ├── storage.ts               # SQLite CRUD via Drizzle ORM (entries, search)
│   │   ├── recording.ts             # Pure audio functions (start/stop/pause playback)
│   │   ├── audioStorage.ts          # Local file system audio persistence
│   │   └── auth.ts                  # Firebase Auth + Google Sign-In
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── useRecording.ts          # Audio recording lifecycle management
│   │
│   ├── context/                     # React Context providers (global state)
│   │   └── AuthContext.tsx           # Auth state (local device user or Firebase user)
│   │
│   ├── theme/                       # Theme system (design tokens, context)
│   │   ├── index.ts                 # Design tokens: colors, spacing, radius, shadows
│   │   └── ThemeContext.tsx          # Theme context (light/dark/system)
│   │
│   ├── screens/                     # UI screens (full-page components)
│   │   ├── HomeScreen.tsx           # Timeline view with stats and category filters
│   │   ├── RecordScreen.tsx         # Audio recording with auto-transcription/categorization
│   │   ├── CreateNoteScreen.tsx     # Note editor with markdown, autosave, category selection
│   │   ├── SearchScreen.tsx         # Full-text search across entries
│   │   └── SettingsScreen.tsx       # User settings and configuration
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── EntryCard.tsx            # Entry display card (category, title, summary)
│   │   ├── RecordButton.tsx         # Animated microphone record button
│   │   ├── ElevatedTabBar.tsx       # Custom bottom tab bar with elevated center button
│   │   ├── AudioPlayer.tsx          # Audio playback controls
│   │   └── EmptyState.tsx           # Empty state illustration
│   │
│   └── config/                      # External service configuration
│       └── firebase.ts              # Firebase SDK initialization (optional)
│
├── docs/                            # Project documentation
│   ├── ARCHITECTURE.md              # High-level architecture template
│   ├── database-guide.md            # Database usage guide
│   └── mhat-tan-database-schema-v1.md # V1 schema specification
│
├── .github/                         # GitHub configuration
│   ├── workflows/                   # CI/CD workflows
│   └── ISSUE_TEMPLATE/              # Issue templates
│
├── .claude/                         # Claude Code skills and configuration
│   └── skills/                      # Project-specific skills
│
├── .planning/                       # Planning and design documents
│   ├── sketches/                    # UI sketches and design decisions
│   └── codebase/                    # Codebase analysis (this file)
│
├── functions/                       # Cloud functions (Firebase Functions, optional)
│
├── assets/                          # Static assets (images, icons)
│
└── node_modules/                    # NPM dependencies (git-ignored)
```

## Directory Purposes

**`src/types/`:**
- Purpose: Centralized type definitions for the entire application
- Contains: Interfaces (Entry, Category, RecordingState), type unions, constants (CATEGORIES)
- Key files: `src/types/index.ts`

**`src/db/`:**
- Purpose: Database schema definition and management
- Contains: Drizzle ORM schema, SQLite initialization, migrations, helper functions
- Key files: `src/db/schema.ts` (schema), `src/db/index.ts` (init + connection)

**`src/services/`:**
- Purpose: Business logic and external API integration (no React UI code)
- Contains: Services for transcription, categorization, storage, recording, auth, file management
- Key files: `src/services/storage.ts` (CRUD), `src/services/transcription.ts` (ElevenLabs), `src/services/categorization.ts` (Gemini)

**`src/hooks/`:**
- Purpose: Custom React hooks encapsulating complex UI state logic
- Contains: useRecording hook managing recording lifecycle with expo-av
- Key files: `src/hooks/useRecording.ts`

**`src/context/`:**
- Purpose: Global application state management via React Context
- Contains: AuthContext managing user identity and sign-in
- Key files: `src/context/AuthContext.tsx`

**`src/theme/`:**
- Purpose: Theme system with design tokens and dark/light mode support
- Contains: ThemeContext, color definitions, spacing scale, shadow generators
- Key files: `src/theme/index.ts` (tokens), `src/theme/ThemeContext.tsx` (context)

**`src/screens/`:**
- Purpose: Top-level UI screens corresponding to navigation routes
- Contains: Full-page components with screen-specific logic and UI
- Key files: `src/screens/HomeScreen.tsx`, `src/screens/RecordScreen.tsx`, `src/screens/CreateNoteScreen.tsx`

**`src/components/`:**
- Purpose: Reusable, pure UI components (no screen-level state)
- Contains: Entry cards, buttons, tab bars, audio players, empty states
- Key files: `src/components/EntryCard.tsx`, `src/components/ElevatedTabBar.tsx`

**`src/config/`:**
- Purpose: External service configuration and initialization
- Contains: Firebase SDK initialization (conditional, optional)
- Key files: `src/config/firebase.ts`

**`docs/`:**
- Purpose: Project documentation and specifications
- Contains: Architecture guides, database specs, development setup
- Key files: `docs/mhat-tan-database-schema-v1.md`

## Key File Locations

**Entry Points:**
- `index.ts`: Expo app registration
- `App.tsx:289-297`: Root component export
- `App.tsx:193-221`: AppContent (DB init + auth + navigation)
- `App.tsx:41-191`: Main tab navigator

**Configuration:**
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript strict mode
- `drizzle.config.ts`: Drizzle ORM schema path and DB location
- `app.json`: Expo app metadata
- `.env`: Environment variables (EXPO_PUBLIC_ELEVENLABS_API_KEY, etc.)

**Core Logic:**
- `src/db/schema.ts`: Database schema definition (5 tables + FTS5)
- `src/db/index.ts`: Database initialization and migrations
- `src/services/storage.ts`: CRUD operations and search
- `src/services/transcription.ts`: ElevenLabs API integration
- `src/services/categorization.ts`: Gemini API integration
- `src/hooks/useRecording.ts`: Recording state machine

**Testing:**
- Not yet implemented — no test files or test configuration

## Naming Conventions

**Files:**
- React components: PascalCase.tsx (e.g., `HomeScreen.tsx`, `EntryCard.tsx`)
- Services/hooks: camelCase.ts (e.g., `transcription.ts`, `useRecording.ts`)
- Types: index.ts (barrel file pattern in `src/types/`)
- Config: kebab-case.ts (e.g., `firebase.ts`, `drizzle.config.ts`)

**Directories:**
- All lowercase (e.g., `src/screens/`, `src/services/`, `src/context/`)
- Purpose-based organization (by feature or layer)

**Components:**
- PascalCase for components (e.g., `HomeScreen`, `EntryCard`)
- camelCase for hooks (e.g., `useRecording`)
- camelCase for service functions (e.g., `transcribeAudio`, `saveEntry`)

**Variables/Functions:**
- camelCase for variables and functions (e.g., `audioUri`, `startRecording`)
- SCREAMING_SNAKE_CASE for constants (e.g., `LOCAL_USER_ID`, `MAX_DURATION`)
- PascalCase for types and interfaces (e.g., `Entry`, `RecordingState`, `Theme`)

## Where to Add New Code

**New Screen:**
- Create component in `src/screens/[ScreenName]Screen.tsx`
- Register in navigation: `App.tsx` (add to `MainTabs` or nested stack)
- Add to relevant stack navigator in `App.tsx`

**New Component:**
- Create in `src/components/[ComponentName].tsx`
- Export as named export (e.g., `export const ComponentName: React.FC<Props>`)
- Use `StyleSheet.create()` for styles
- Access theme via `useTheme()` hook from `src/theme/ThemeContext`

**New Service:**
- Create in `src/services/[serviceName].ts`
- Export async functions for API/business logic calls
- Use types from `src/types/` for input/output
- Handle errors with try-catch and descriptive messages

**New Hook:**
- Create in `src/hooks/use[HookName].ts`
- Return state + action functions
- Use refs for values not triggering re-renders

**New Context:**
- Create in `src/context/[ContextName]Context.tsx`
- Export Provider component and useContext hook
- Wrap in `App.tsx` root if globally needed

**New Type:**
- Add to `src/types/index.ts`
- Use `interface` for object shapes, `type` for unions
- Export for use across services and components

**New Database Table:**
- Add to `src/db/schema.ts` using Drizzle ORM
- Add migration SQL to `src/db/index.ts` initDatabase()
- Update related services if needed

## Special Directories

**`node_modules/`:**
- Purpose: NPM package dependencies
- Generated: Yes (via npm install)
- Committed: No (git-ignored)

**`dist/`:**
- Purpose: Compiled/bundled output (if applicable)
- Generated: Yes (via expo build or tsc)
- Committed: No

**`.expo/`:**
- Purpose: Expo CLI cache and metadata
- Generated: Yes
- Committed: No

**`.claude/skills/`:**
- Purpose: Project-specific Claude Code skills
- Generated: Manually by team
- Committed: Yes

**`.planning/sketches/`:**
- Purpose: UI/UX design sketches and decisions
- Generated: Manually during design phases
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Codebase analysis and mapping documents
- Generated: By GSD mapping agents
- Committed: Yes

**`assets/`:**
- Purpose: Static assets (icons, images, fonts)
- Generated: Manually by team
- Committed: Yes

**`functions/`:**
- Purpose: Firebase Cloud Functions (optional, V2+)
- Generated: Manually
- Committed: Yes (but currently minimal/unused)

---

*Structure analysis: 2026-07-17*
