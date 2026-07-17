# Roadmap: Mhat Tan

## Overview

Mhat Tan is a voice-first daily record app for Burmese speakers. The v1 roadmap covers three refinement features -- a corrected Note Editor, an extracted Bottom Sheet creation menu, and animated Empty States -- that transform the existing app skeleton into a polished, reliable experience. Each phase delivers one complete feature from sketch findings (010, 011, 012), building from core stability outward to presentation polish.

## Phases

- [x] **Phase 1: Note Editor Stabilization** - Fix critical correctness issues and refine the editor to match sketch 010
- [x] **Phase 2: Bottom Sheet Creation Menu** - Extract and polish the creation sheet with proper animation and Android touch handling
- [ ] **Phase 3: Empty States and First Entry Flow** - Animated empty state with dual CTAs guiding new users to their first entry

## Phase Details

### Phase 1: Note Editor Stabilization
**Goal**: Users can reliably save, edit, and play back notes without crashes or data loss
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: NOTE-01, NOTE-02, NOTE-03
**Success Criteria** (what must be TRUE):
  1. User can tap "Save Changes" to persist a note and see confirmation that it was saved
  2. User can toggle between View mode (read-only text) and Edit mode (TextInput) via toolbar buttons
  3. User can play/pause an audio recording attached to a note with visible progress bar and time display
  4. User can navigate away from the editor without data loss or duplicate entries being created
**Plans**: TBD

Plans:
- [x] 01-01: Replace autosave with manual Save Changes button
- [x] 01-02: Fix Audio.Sound resource leak and integrate AudioPlayer into CreateNoteScreen
- [x] 01-03: Refine View/Edit toggle and remove markdown rendering

### Phase 2: Bottom Sheet Creation Menu
**Goal**: Users can access creation options through a polished bottom sheet triggered by the center FAB
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: SHEET-01, SHEET-02, SHEET-03, SHEET-04
**Success Criteria** (what must be TRUE):
  1. User can tap the center FAB (+) and see a sheet slide up with "Record Voice" and "New Note" options
  2. User can tap an option to navigate to the correct screen (Record or Note Editor)
  3. User can dismiss the sheet by tapping the semi-transparent backdrop overlay
  4. User can swipe down on the sheet to dismiss it with spring animation
  5. Sheet animation is smooth and responsive on Android without touch passthrough issues
**Plans**: TBD

Plans:
- [x] 02-01: Extract inline bottom sheet from App.tsx into dedicated CreateSheet component
- [x] 02-02: Polish bottom sheet with PanResponder swipe-to-dismiss and spring animation

### Phase 3: Empty States and First Entry Flow
**Goal**: New users see a welcoming empty state that guides them to create their first entry
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: EMPTY-01, EMPTY-02
**Success Criteria** (what must be TRUE):
  1. User sees an animated microphone illustration with looping pulse effect when no entries exist
  2. User can tap "Record Your First Entry" CTA to open the recording flow
  3. User can tap "Write a Note" CTA to open the note editor
  4. Animation runs smoothly without layout thrashing on Android
**Plans**: TBD

Plans:
- [ ] 03-01: Add animated pulse effect to EmptyState microphone illustration
- [ ] 03-02: Wire dual CTAs to navigation flows and test end-to-end first entry creation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Note Editor Stabilization | 3/3 | Completed | 2026-07-18 |
| 2. Bottom Sheet Creation Menu | 2/2 | Completed | 2026-07-18 |
| 3. Empty States and First Entry Flow | 0/2 | Not started | - |
