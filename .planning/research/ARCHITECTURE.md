# Architecture Patterns

**Domain:** Note editor, bottom sheet menu, empty states in Expo SDK 54 / React Navigation 7
**Researched:** 2026-07-17

## Recommended Architecture

The three active features (Note Editor, Bottom Sheet Menu, Empty States) integrate with the existing navigation structure. The architecture uses a **component extraction** pattern: the inline implementations currently in App.tsx should be extracted into dedicated components, while the navigation hierarchy remains unchanged.

### Current State

```
App.tsx (MainTabs)
├── Tab.Navigator
│   ├── Home → Stack.Navigator → [HomeScreen, CreateNoteScreen]
│   ├── Search → SearchScreen
│   ├── Record → RecordScreen (center FAB triggers sheet)
│   └── Settings → Stack.Navigator → [SettingsScreen]
└── Bottom Sheet (INLINE in MainTabs, lines 115-188)
```

### Target State

```
App.tsx (MainTabs)
├── Tab.Navigator
│   ├── Home → Stack.Navigator → [HomeScreen, CreateNoteScreen]
│   ├── Search → SearchScreen
│   ├── Record → RecordScreen
│   └── Settings → Stack.Navigator → [SettingsSettingsScreen]
├── CreateSheet (extracted component, manages overlay + sheet UI)
└── EmptyState (extracted component, used by HomeScreen)
```

### Component Boundaries

| Component | Responsibility | Lives In | Communicates With |
|-----------|---------------|----------|-------------------|
| `MainTabs` | Tab navigator + sheet visibility state + navigation refs | `App.tsx` | `ElevatedTabBar`, `CreateSheet`, tab screens |
| `CreateSheet` | Bottom sheet overlay, animation, option rows (Record Voice / New Note) | `src/components/CreateSheet.tsx` | `MainTabs` via callbacks, `navigation` for screen transitions |
| `ElevatedTabBar` | Custom tab bar with center FAB, triggers `onCenterPress` | `src/components/ElevatedTabBar.tsx` | `MainTabs` via `onCenterPress` callback |
| `EmptyState` | Animated illustration + dual CTAs when no entries exist | `src/components/EmptyState.tsx` | `HomeScreen` via props (onRecord, onNote callbacks) |
| `HomeScreen` | Timeline view, decides when to show EmptyState vs entries | `src/screens/HomeScreen.tsx` | `EmptyState` (conditional render), `navigation` for CreateNote |
| `CreateNoteScreen` | Note editor with View/Edit toggle, metadata chips, autosave | `src/screens/CreateNoteScreen.tsx` | `storage` service, `AudioPlayer`, route params |

### Data Flow

#### Bottom Sheet Flow

```
User taps center FAB (+)
  → ElevatedTabBar.onCenterPress()
  → MainTabs.handleCenterPress() → setSheetVisible(true) + spring animation
  → CreateSheet renders with backdrop overlay
  → User taps "Record Voice"
  → CreateSheet.onRecordVoice() → closeSheet() → navigate('Record')
  → User taps "New Note"
  → CreateSheet.onNewNote() → closeSheet() → navigate('Home', { screen: 'CreateNote' })
```

**Key insight:** The sheet is a presentation-layer concern owned by MainTabs. It does NOT participate in React Navigation's modal system. It uses Animated API for spring/timing animations and renders as an absolute-positioned overlay on top of the tab navigator.

#### Empty State Flow

```
HomeScreen.useFocusEffect loads entries via storage.getEntries(userId)
  → If entries.length === 0 → render <EmptyState />
  → EmptyState renders animated illustration + two CTA buttons
  → User taps "Record Your First Entry" → navigation.navigate('Record')
  → User taps "Write a Note" → navigation.navigate('Home', { screen: 'CreateNote' })
```

**Key insight:** EmptyState is a pure presentational component. All logic (when to show, what to do on tap) lives in HomeScreen. EmptyState receives callbacks, not navigation references.

#### Note Editor Flow

```
HomeScreen EntryCard.onPress → navigate('CreateNote', { entryId, startViewOnly: true })
  OR CreateSheet "New Note" → navigate('Home', { screen: 'CreateNote' })
  OR EmptyState "Write a Note" → navigate('Home', { screen: 'CreateNote' })

CreateNoteScreen receives route.params:
  - entryId? → loads existing entry from storage
  - prefilledText? → pre-populates content
  - predictedCategory? → pre-selects category
  - audioFile? → shows AudioPlayer
  - startViewOnly? → starts in View mode with markdown rendering

Autosave: 2s debounce on content changes, saves to SQLite via storage service
```

## Patterns to Follow

### Pattern 1: Extract Inline UI to Components

**What:** The bottom sheet in App.tsx is 70+ lines of inline JSX and styles. Extract it to a dedicated component with clear props.

**When:** Any UI block exceeding 30 lines that has its own state management.

**Example:**
```typescript
// src/components/CreateSheet.tsx
interface CreateSheetProps {
  visible: boolean;
  onClose: () => void;
  onRecordVoice: () => void;
  onNewNote: () => void;
}

export const CreateSheet: React.FC<CreateSheetProps> = ({
  visible,
  onClose,
  onRecordVoice,
  onNewNote,
}) => {
  // Animation state managed internally
  // Renders overlay + sheet UI
};
```

### Pattern 2: Callback Props for Navigation-Triggering Components

**What:** Components that trigger navigation receive callbacks, not navigation references. This keeps components testable and decoupled from navigation.

**When:** A component needs to trigger screen transitions but should not own navigation logic.

**Example:**
```typescript
// EmptyState receives callbacks
<EmptyState
  onRecord={() => navigation.navigate('Record')}
  onNote={() => navigation.navigate('Home', { screen: 'CreateNote' })}
/>

// NOT this:
<EmptyState navigation={navigation} />
```

### Pattern 3: Conditional Rendering for Empty States

**What:** Parent screen decides whether to show EmptyState or content. EmptyState is never self-aware of data.

**When:** A screen needs to show different content based on data availability.

**Example:**
```typescript
// In HomeScreen
{entries.length === 0 ? (
  <EmptyState onRecord={...} onNote={...} />
) : (
  <EntryList entries={entries} />
)}
```

### Pattern 4: Route Params for Editor Mode

**What:** CreateNoteScreen uses route.params to determine its behavior (create vs edit, view vs edit mode, prefilled data). No prop drilling or context needed.

**When:** A screen needs to behave differently based on how it was opened.

**Example:**
```typescript
type CreateNoteParams = {
  entryId?: string;           // Edit existing
  prefilledText?: string;     // New entry from recording
  predictedCategory?: Category;
  audioFile?: string;
  startViewOnly?: boolean;    // View mode (markdown rendered)
};

// Navigation calls:
navigation.navigate('CreateNote', { entryId: 'abc123', startViewOnly: true });
navigation.navigate('CreateNote', { prefilledText: '...', predictedCategory: 'feelings' });
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Bottom Sheet as React Navigation Modal

**What:** Using `presentation: 'modal'` or a modal screen for the creation sheet.

**Why bad:** The sheet needs to appear from the center FAB with custom spring animation. React Navigation modals slide from bottom with platform-default animations. The sheet is a UI overlay, not a navigation destination.

**Instead:** Use Animated API with absolute positioning, as currently implemented. The sheet manages its own animation lifecycle.

### Anti-Pattern 2: Global State for Sheet Visibility

**What:** Storing sheet open/close state in a React Context or global store.

**Why bad:** The sheet is scoped to MainTabs. No other component needs to know about it. Adding global state creates unnecessary coupling.

**Instead:** Keep `sheetVisible` as local state in MainTabs. Pass `openSheet`/`closeSheet` callbacks to ElevatedTabBar.

### Anti-Pattern 3: EmptyState Fetching Data

**What:** EmptyState component calls storage service to check if entries exist.

**Why bad:** Creates duplicate data fetching (HomeScreen already fetches). EmptyState becomes tightly coupled to the storage layer.

**Instead:** HomeScreen fetches entries, passes `entries.length === 0` decision down. EmptyState is purely presentational.

### Anti-Pattern 4: Hardcoding Navigation Routes in Child Components

**What:** CreateSheet hardcodes `navigation.navigate('Record')` inside itself.

**Why bad:** Component becomes untestable and tightly coupled to navigation structure.

**Instead:** Receive `onRecordVoice` and `onNewNote` callbacks from parent. Parent owns the navigation logic.

## Scalability Considerations

| Concern | At Current Scale | At 10x Scale | Notes |
|---------|-----------------|--------------|-------|
| Bottom sheet options | 2 options (Record, Note) | 3-4 options max | Add option row component, keep sheet simple |
| Empty state variants | 1 variant (HomeScreen only) | Multiple variants per screen | Extract to generic EmptyState with configurable props |
| Note editor complexity | View/Edit toggle, markdown | Rich formatting, collaboration | Keep autosave pattern, add conflict resolution |
| Navigation depth | 2 levels (Tab → Stack) | 3 levels possible | Avoid; keeps mental model simple |

## Build Order Implications

Based on component dependencies:

1. **EmptyState first** — Pure presentational, no dependencies on other new components. Can be built and tested in isolation.
2. **CreateSheet second** — Depends on ElevatedTabBar (already exists) and navigation structure (already exists). Extract from App.tsx.
3. **Note Editor refinements last** — Already implemented; refinements depend on understanding user flows from EmptyState and CreateSheet.

## Integration Points

### With Existing Navigation

The navigation structure is already correct:
- `HomeStack` handles HomeScreen and CreateNoteScreen
- Tab names differ from stack screen names (prevents deep linking conflicts)
- Cross-tab navigation uses `navigate('Home', { screen: 'CreateNote' })` pattern

### With Existing Services

- `storage.ts` — CRUD operations for entries (already used by CreateNoteScreen)
- `audioStorage.ts` — Audio file persistence (already used by RecordScreen)
- No new services needed for these three features

### With Existing Components

- `AudioPlayer` — Already supports compact and full modes; used in CreateNoteScreen
- `ElevatedTabBar` — Already implements center FAB; needs `onCenterPress` callback (already wired)
- `EntryCard` — Already renders entry preview; used by HomeScreen

## Sources

- React Navigation 7 documentation: https://reactnavigation.org/docs/nesting-navigators/
- React Navigation bottom tabs: https://reactnavigation.org/docs/bottom-tab-navigator/
- Existing codebase analysis: App.tsx, HomeScreen.tsx, CreateNoteScreen.tsx, EmptyState.tsx
- Sketch findings: 010-note-editor, 011-bottom-sheet-menu, 012-empty-states
