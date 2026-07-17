# REQUIREMENTS.md

## v1 Requirements

### Note Editor
- [x] **NOTE-01**: User can save notes with an explicit "Save Changes" button (replaces broken autosave)
- [x] **NOTE-02**: User can toggle between View mode (read-only) and Edit mode (TextInput) via toolbar buttons
- [x] **NOTE-03**: User can play/pause audio recordings associated with a note, with progress bar and time display

### Bottom Sheet
- [x] **SHEET-01**: User can tap center FAB (+) to open a creation sheet with two options: "Record Voice" and "New Note"
- [x] **SHEET-02**: User can dismiss the sheet by tapping the semi-transparent backdrop overlay
- [x] **SHEET-03**: Sheet slides up from bottom with spring animation when FAB is tapped
- [x] **SHEET-04**: User can swipe down to dismiss the sheet

### Empty States
- [ ] **EMPTY-01**: User sees an animated microphone illustration with pulse effect when no entries exist
- [ ] **EMPTY-02**: User can tap "Record Your First Entry" or "Write a Note" CTAs to create their first entry

---

## v2 Requirements

- [ ] Waveform visualization during audio playback (NOTE-04)
- [ ] Greeting header "Hello, User" on home screen (EMPTY-03)
- [ ] Description text explaining the app's purpose (EMPTY-04)
- [ ] Markdown rendering in View mode (removed for performance — revisit if users request)

---

## Out of Scope

- Firebase cloud sync — deferred to V2+
- Rich formatting toolbar (bold, italic, lists) — adds complexity without core value
- Collaborative editing — not applicable to personal daily record
- Tag system — categories already provide organization
- Templates — voice-first app, users speak naturally
- Undo/redo — manual save pattern makes this less critical

---

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| NOTE-01 | Phase 1 | 01-01 | Done |
| NOTE-02 | Phase 1 | 01-03 | Done |
| NOTE-03 | Phase 1 | 01-02 | Done |
| SHEET-01 | Phase 2 | 02-01 | Done |
| SHEET-02 | Phase 2 | 02-02 | Done |
| SHEET-03 | Phase 2 | 02-02 | Done |
| SHEET-04 | Phase 2 | 02-02 | Done |
| EMPTY-01 | Phase 3 | — | Pending |
| EMPTY-02 | Phase 3 | — | Pending |
