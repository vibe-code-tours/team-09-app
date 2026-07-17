# Testing Patterns

**Analysis Date:** 2026-07-17

## Current State

**No test framework, test files, or test infrastructure exists in this codebase.**

The CI pipeline (`.github/workflows/ci.yml`) runs `npm test --if-present`, which is currently a no-op. No test scripts, test dependencies, or test configuration files are present. This document describes what exists and provides recommendations for adding tests.

## Test Framework (Recommended)

**Runner:**
- Jest with `jest-expo` preset (Expo's recommended test runner)
- Config: `jest.config.js` (to be created)

**Assertion Library:**
- Jest built-in (`expect`, `describe`, `it`/`test`)

**Run Commands (to be added to `package.json`):**
```bash
npm test               # Run all tests
npm test -- --watch    # Watch mode
npm test -- --coverage # Coverage report
```

**Dev Dependencies to Add:**
```json
{
  "jest-expo": "~54.0.0",
  "@testing-library/react-native": "^12.x",
  "@testing-library/jest-native": "^5.x"
}
```

## Test File Organization

**Location:** Co-located with source files in `__tests__/` directories.

**Naming:**
- `*.test.ts` for service/utility tests
- `*.test.tsx` for component/screen tests

**Structure (recommended):**
```
src/
├── components/
│   ├── RecordButton.tsx
│   └── __tests__/
│       └── RecordButton.test.tsx
├── services/
│   ├── transcription.ts
│   └── __tests__/
│       └── transcription.test.ts
├── hooks/
│   ├── useRecording.ts
│   └── __tests__/
│       └── useRecording.test.ts
├── db/
│   ├── schema.ts
│   └── __tests__/
│       └── storage.test.ts
└── ...
```

## What to Test (Priority Order)

**Priority 1 — Services (pure logic, highest value):**
- `src/services/categorization.ts` — Response parsing, validation, fallback behavior
- `src/services/storage.ts` — CRUD operations, type mapping (`toAppEntry`)
- `src/services/transcription.ts` — Request formation, error handling
- `src/services/audioStorage.ts` — File operations, path generation
- `src/theme/index.ts` — Utility functions (`formatRelativeTime`, `formatHeaderDate`, `getGreeting`)

**Priority 2 — Hooks (state management logic):**
- `src/hooks/useRecording.ts` — State transitions, timer management, cleanup

**Priority 3 — Components (rendering and interaction):**
- `src/components/RecordButton.tsx` — Renders correctly, responds to press
- `src/components/EntryCard.tsx` — Displays entry data, category colors
- `src/components/EmptyState.tsx` — Shows defaults, custom props
- `src/components/AudioPlayer.tsx` — Play/pause state, time formatting

**Priority 4 — Database (integration tests):**
- `src/db/index.ts` — Schema creation, FTS5 initialization, corruption recovery
- `src/db/schema.ts` — Schema validation, type inference

## Testing Strategy Per Layer

**Services (pure functions with external dependencies):**
- Mock `fetch` for API calls (`transcription`, `categorization`)
- Mock `expo-sqlite` and `expo-crypto` for storage tests
- Mock `expo-file-system` for audioStorage tests
- Test both success and error paths
- Test edge cases: missing API keys, empty responses, malformed data

**Hooks (React state logic):**
- Render hook with `@testing-library/react-native`'s `renderHook`
- Mock `expo-av` Audio module
- Test state transitions: idle → recording → recorded → saving
- Test cleanup on unmount (timer cleared, resources released)

**Components (UI rendering):**
- Render with `@testing-library/react-native`'s `render`
- Mock `useTheme` to provide theme colors
- Mock `useAuth` to provide userId
- Test rendering of props, press handlers, conditional display
- Snapshot tests for regression protection

**Database (integration):**
- Use in-memory SQLite for tests (`:memory:` database)
- Test schema creation and migration
- Test CRUD operations end-to-end
- Test FTS5 search functionality
- Test corruption recovery

## Mocking Patterns

**Services — Mock `fetch` globally:**
```typescript
// Mock fetch for API tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

test('categorizeEntry parses valid response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: '{"category":"work",...}' }] } }],
    }),
  });

  const result = await categorizeEntry('test transcript');
  expect(result.category).toBe('work');
});
```

**Hooks — Mock expo-av:**
```typescript
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(),
    },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    Sound: { createAsync: jest.fn() },
  },
}));
```

**Components — Mock theme context:**
```typescript
jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({
    theme: { colors: { primary: '#E91E63', text: '#333', bg: '#F5F5F5', ... } },
    isDark: false,
  }),
  useColors: () => ({ primary: '#E91E63', ... }),
}));
```

**Database — Use in-memory SQLite:**
```typescript
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    closeAsync: jest.fn(),
  })),
  SQLiteDatabase: { deleteDatabaseAsync: jest.fn() },
}));
```

## Test Structure

**Service tests:**
```typescript
import { transcribeAudio } from '../transcription';

describe('transcribeAudio', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY = 'test-key';
  });

  it('throws when API key is missing', async () => {
    delete process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
    await expect(transcribeAudio('file:///test.m4a')).rejects.toThrow('API key not configured');
  });

  it('returns transcript on success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'hello world' }),
    });
    const result = await transcribeAudio('file:///test.m4a');
    expect(result).toBe('hello world');
  });

  it('throws on API error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: { message: 'Server error' } }),
      text: async () => 'Server error',
    });
    await expect(transcribeAudio('file:///test.m4a')).rejects.toThrow('500');
  });
});
```

**Component tests:**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { RecordButton } from '../RecordButton';

describe('RecordButton', () => {
  it('renders mic icon when not recording', () => {
    const { getByRole } = render(
      <RecordButton isRecording={false} onPress={() => {}} />
    );
    // Assert icon is 'mic'
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <RecordButton isRecording={false} onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies disabled opacity when disabled', () => {
    const { getByRole } = render(
      <RecordButton isRecording={false} onPress={() => {}} disabled />
    );
    // Assert opacity style
  });
});
```

**Utility function tests:**
```typescript
import { formatRelativeTime } from '../theme';

describe('formatRelativeTime', () => {
  it('returns "Just now" for dates less than 1 minute ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes ago for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns "Yesterday" for previous day', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });
});
```

## CI Integration

**Current CI (`.github/workflows/ci.yml`):**
```yaml
- name: Test
  if: ${{ hashFiles('package.json') != '' }}
  run: npm test --if-present
```

**After adding test script to `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Coverage requirements:** None enforced currently. Consider adding:
- Statements: 70%+
- Branches: 60%+
- Functions: 70%+
- Lines: 70%+

## Coverage Gaps

**Currently untested (all source code):**
- All 5 screens (HomeScreen, RecordScreen, CreateNoteScreen, SearchScreen, SettingsScreen)
- All 5 components (RecordButton, EntryCard, EmptyState, ElevatedTabBar, AudioPlayer)
- All 6 services (transcription, categorization, storage, recording, audioStorage, auth)
- All 1 hook (useRecording)
- All 1 context (AuthContext)
- Database initialization and schema
- Theme utilities

**Files that would benefit most from tests:**
1. `src/services/categorization.ts` — AI response parsing with many edge cases
2. `src/services/storage.ts` — Database CRUD with type mapping
3. `src/hooks/useRecording.ts` — Complex state machine with timer cleanup
4. `src/theme/index.ts` — Pure utility functions, easy to test
5. `src/services/audioStorage.ts` — File operations with error handling
6. `src/components/EntryCard.tsx` — Renders different states, category colors

---

*Testing analysis: 2026-07-17*
