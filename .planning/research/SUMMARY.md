# Project Research Summary

**Project:** Mhat Tan (voice-first daily record app)
**Domain:** Mobile note-taking / daily journal with voice recording and AI transcription
**Researched:** 2026-07-17
**Confidence:** MEDIUM-HIGH

## Executive Summary

Mhat Tan is a voice-first daily record app for Burmese speakers, built with Expo SDK 54. The three active features -- Note Editor, Bottom Sheet creation menu, and Empty States -- are refinement/implementation tasks on an already-working app skeleton. Most table-stakes features are already implemented in the codebase; the work is primarily about refining existing components to match sketch designs and fixing correctness issues discovered during pitfall analysis.

The recommended approach is to fix critical correctness issues first (autosave race condition, Audio.Sound resource leak, markdown rendering performance), then extract inline UI from App.tsx into proper components, and finally add polish (animations, waveform). The biggest technical risk is the autosave mechanism: the current `useCallback` + `setTimeout` pattern never actually debounces during continuous typing. The pitfall research recommends replacing autosave with a manual "Save Changes" button, which is the right call for a daily record app where explicit save feels intentional, not burdensome.

The architecture is straightforward -- the bottom sheet and empty state are presentation-layer concerns with no new services needed. The navigation hierarchy is already correct. The main decision points are: (1) whether to keep markdown rendering or strip it for performance (pitfall research says strip it), (2) whether to use @gorhom/bottom-sheet or a custom overlay (stack research says gorhom), and (3) whether to add waveform visualization or keep the existing progress bar (stack research says waveform for the full editor, keep progress bar for cards).

## Key Findings

### Recommended Stack

The stack is largely already in place. Two new native dependencies are needed for the bottom sheet, one npm package for audio waveform, and the markdown rendering library is already installed but flagged for removal.

**Core technologies:**
- `@gorhom/bottom-sheet@5.2.14` -- Bottom sheet creation menu, de facto standard for RN, native spring animations. Required dependencies (reanimated, gesture handler) are already bundled by Expo SDK 54.
- `@simform_solutions/react-native-audio-waveform@2.1.6` -- Waveform visualization for the Note Editor full audio player. Pre-built, customizable, works with expo-av URIs.
- `react-native-markdown-display@7.0.2` -- Already installed, but pitfall research recommends removing it due to layout performance issues with large content. Replace with plain text rendering.
- `react-native-reanimated@~4.1.1` (Expo bundled) -- Required by @gorhom/bottom-sheet, just needs `npx expo install`.
- `react-native-gesture-handler@~2.28.0` (Expo bundled) -- Required by @gorhom/bottom-sheet, just needs `npx expo install`.

### Expected Features

**Must have (table stakes):**
- View/Edit toggle in note editor -- already implemented, refine per sketch 010
- Bottom sheet creation menu (Record Voice + New Note) -- already implemented, refine per sketch 011
- Empty state with animated illustration + dual CTAs -- already implemented as static, needs animation per sketch 012
- Audio playback in note editor -- AudioPlayer.tsx exists, integrate into CreateNoteScreen
- Two clear creation paths (voice + text) -- core to voice-first value proposition
- Manual save button -- replaces broken autosave (critical fix, not a feature gap)

**Should have (competitive):**
- Animated microphone pulse on empty state -- communicates voice-first identity
- Category color borders on entry cards -- visual scanning, already partially implemented
- Save status indicator ("Saved" dot) in editor header -- gives confidence feedback
- Greeting header on empty state -- personalizes first-time experience
- Category chips as toolbar items in editor -- quick category switching

**Defer (v2+):**
- Collaborative editing -- requires backend infrastructure
- Export/share (PDF, image) -- adds complexity without core value validation
- Tag system / nested folders -- overcomplicates the 6-category system
- Multi-language UI -- Burmese-only for V1 to focus on voice quality
- Markdown rendering -- remove for now, add as optional enhancement if users request it

### Architecture Approach

The architecture uses a **component extraction** pattern: inline UI in App.tsx (70+ lines of bottom sheet) should be extracted into dedicated components while the navigation hierarchy remains unchanged. The key architectural insight is that the bottom sheet and empty state are presentation-layer concerns -- no new services, no new navigation screens. The sheet manages its own animation lifecycle as an absolute-positioned overlay, not a React Navigation modal.

**Major components:**
1. `CreateSheet` (extracted from App.tsx) -- Bottom sheet overlay with option rows (Record Voice, New Note), manages its own spring animation
2. `EmptyState` (already exists, needs refinement) -- Animated illustration + dual CTAs, receives callbacks not navigation refs
3. `CreateNoteScreen` (already exists, needs fixes) -- Note editor with View/Edit toggle, needs autosave replacement and AudioPlayer integration
4. `ElevatedTabBar` (already exists) -- Custom tab bar with center FAB, triggers CreateSheet

**Key patterns:**
- Callback props for navigation-triggering components (not navigation references)
- Conditional rendering for empty states (parent decides, not child)
- Route params for editor mode (create vs edit, view vs edit)
- Extract inline UI when block exceeds 30 lines

### Critical Pitfalls

1. **Autosave race condition via stale closure** -- The current 2s debounce never actually fires during continuous typing because `useCallback` recreates on every keystroke, resetting the timer. **Fix: Replace with manual "Save Changes" button.** This eliminates the race condition entirely and is more appropriate for a daily record app.

2. **Audio.Sound resource leak on unmount** -- If component unmounts during async `createAsync`, the loaded sound is never unloaded. **Fix: Always unload in cleanup regardless of cancelled flag, track loaded sound in ref from resolve moment.**

3. **navigation.setParams() race condition** -- After creating entry, setParams triggers re-render; autosave may fire with undefined entryId, creating duplicates. **Fix: Use ref-based ID tracking (`entryIdRef.current = newEntryId`) alongside manual save.**

4. **Markdown rendering performance** -- Long notes create deeply nested Text components, expensive to layout, lag on View/Edit toggle. **Fix: Remove markdown rendering entirely. Show plain text in View mode, TextInput in Edit mode.**

5. **Bottom sheet z-index and touch passthrough on Android** -- Touch events can leak through backdrop during spring animations. **Fix: Use `pointerEvents` attributes, use `useWindowDimensions()` instead of `Dimensions.get('window')`, test on physical Android devices.**

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Note Editor Fixes and Refinement
**Rationale:** The Note Editor has critical correctness issues (autosave race, Audio.Sound leak, setParams race) that must be fixed before anything else. This phase also handles markdown removal and manual save button implementation. The editor is the most-used screen and must be stable before building on top of it.
**Delivers:** Stable note editor with manual save, working audio playback, plain text View/Edit mode, no resource leaks
**Addresses:** Note Editor View/Edit toggle, Audio playback in editor, Manual save button, Markdown removal
**Avoids:** Autosave race condition, Audio.Sound resource leak, navigation.setParams duplicate entries, Markdown rendering performance

### Phase 2: Bottom Sheet Extraction
**Rationale:** The bottom sheet is already implemented inline in App.tsx. This phase extracts it to a proper component, installs @gorhom/bottom-sheet (or refines existing overlay), and verifies Android touch handling. Depends on nothing from Phase 1 but is grouped second because the sheet routes to both Record and CreateNote flows, which benefit from Phase 1's editor fixes.
**Delivers:** Extracted CreateSheet component, proper animation, Android touch reliability
**Uses:** @gorhom/bottom-sheet@5.2.14, react-native-reanimated, react-native-gesture-handler
**Implements:** CreateSheet component (extracted from App.tsx lines 114-188)
**Avoids:** Bottom sheet z-index/touch passthrough, Keyboard avoidance conflict, Bottom sheet as React Navigation modal

### Phase 3: Empty States and Polish
**Rationale:** Empty states are purely presentational and depend on no other new components. This phase adds the animated microphone pulse, greeting header, and refines the dual CTAs. It also handles remaining polish items (save status indicator, category chips in toolbar).
**Delivers:** Animated empty state matching sketch 012, polished editor toolbar, save feedback
**Uses:** react-native-reanimated for pulse animation, useNativeDriver for transform-only
**Implements:** EmptyState component refinement, CreateNoteScreen header updates
**Avoids:** Empty state animation layout thrashing (use transform: scale, never animate width/height)

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** The Note Editor is the core value screen. Stabilizing it first means that when the bottom sheet routes to "New Note" in Phase 2, the destination works correctly. Building the sheet first would route users to a broken editor.
- **Phase 2 before Phase 3:** The empty state CTAs route through the bottom sheet (or directly to Record/CreateNote). Having the sheet stable before adding CTAs avoids testing incomplete flows.
- **Grouping by architecture pattern:** Phase 1 = service/correctness layer, Phase 2 = presentation extraction, Phase 3 = UI polish. Each phase has a clear, testable deliverable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Low risk -- autosave replacement is straightforward, AudioPlayer fix is well-documented, markdown removal is deletion. May need to verify manual save UX patterns for Burmese-speaking users.
- **Phase 2:** Medium risk -- @gorhom/bottom-sheet integration details need verification against Expo SDK 54 exact reanimated version. Android touch passthrough needs device testing. May need to research keyboard behavior if text inputs are added to the sheet.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Standard React Native animation patterns. Pulse animation is a single `transform: scale` with `useNativeDriver: true`. Empty state layout is well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry queries, Expo bundled versions verified from source, existing codebase analysis |
| Features | MEDIUM | Based on sketch findings and competitor analysis; anti-features validated by UX principles but need user testing |
| Architecture | HIGH | Directly derived from existing codebase structure; patterns match React Navigation 7 docs |
| Pitfalls | MEDIUM | Based on codebase analysis and community knowledge; autosave race confirmed by reading code, but Audio.Sound leak needs runtime verification |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Autosave vs manual save UX for Burmese users:** The pitfall research recommends manual save, but this should be validated with target users. A "Save" button is intuitive for most users but may feel unfamiliar in a voice-first context where the expectation is "speak and it's saved." Flag for Phase 1 planning.
- **AudioPlayer integration into CreateNoteScreen:** The AudioPlayer component exists but is not wired into CreateNoteScreen per sketch 010. The integration details (positioning, compact vs full mode, audio URI passing) need to be specified during Phase 1 planning.
- **@gorhom/bottom-sheet vs custom overlay decision:** Stack research recommends gorhom, but the existing inline implementation works for a 2-option sheet. The decision should be validated: if the sheet stays at 2 options, custom overlay is simpler. If options may grow, gorhom is worth the deps. Flag for Phase 2 planning.
- **Empty state animation target:** Sketch 012 specifies pulse animation on mic illustration, but the exact animation (scale range, duration, easing, loop behavior) needs design specification. The architectural pattern is clear; the design details need to be locked.

## Sources

### Primary (HIGH confidence)
- npm registry queries -- package versions, peer dependencies, compatibility
- node_modules/expo/bundledNativeModules.json -- Expo SDK 54 bundled native module versions
- Existing codebase: CreateNoteScreen.tsx, AudioPlayer.tsx, App.tsx, ElevatedTabBar.tsx, EmptyState.tsx

### Secondary (MEDIUM confidence)
- @gorhom/bottom-sheet GitHub (15k+ stars, v5.x line) -- Reanimated 3/4 support
- @simform_solutions/react-native-audio-waveform npm (2.1k+ weekly downloads)
- React Navigation 7 documentation -- nesting patterns, bottom tabs
- Sketch findings: 010-note-editor, 011-bottom-sheet-menu, 012-empty-states

### Tertiary (LOW confidence)
- Competitor analysis: Notion, Bear, Todoist (training data, not current product state)
- Community knowledge: Bottom sheet + keyboard avoidance patterns on Android/iOS

---
*Research completed: 2026-07-17*
*Ready for roadmap: yes*
