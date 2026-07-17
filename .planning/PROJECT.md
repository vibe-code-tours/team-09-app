# Mhat Tan (မှတ်တမ်း)

## What This Is

Voice-first daily record app for Burmese speakers. Speak in Burmese, get AI transcription and auto-categorization into 6 categories (Money, Feelings, Work, Health, Ideas, Other), displayed on a timeline. Built with Expo SDK 54, targeting Android first.

## Core Value

A Burmese speaker can open the app, tap record, speak naturally, and see their words organized into a searchable daily record — no typing required.

## Requirements

### Validated

- ✓ Voice recording with expo-av (60s max) — existing
- ✓ ElevenLabs Scribe v2 transcription — existing
- ✓ Gemini 2.0 Flash auto-categorization — existing
- ✓ SQLite local-first storage via Drizzle ORM — existing
- ✓ HomeScreen with entry timeline — existing
- ✓ RecordScreen with recording UI — existing
- ✓ Search with FTS5 full-text search — existing
- ✓ Settings screen — existing
- ✓ Firebase Auth (Google Sign-In) — existing
- ✓ Bottom tab navigation with center FAB — existing
- ✓ Theme system (light/dark) — existing

### Active

- [ ] Note Editor (sketch 010) — Notion-like editor with View/Edit toggle, metadata chips, audio player, full markdown rendering
- [ ] Bottom Sheet Menu (sketch 011) — Two-option creation sheet (Record Voice / New Note) from center FAB
- [ ] Empty States (sketch 012) — Animated illustration + dual CTAs when no entries exist

### Out of Scope

- Firebase cloud sync — deferred to V2+
- Categories, Money, Settings screen redesign — not part of this work
- Multi-language support — Burmese only for now
- Export/backup functionality — not yet requested

## Context

**Existing codebase:** The app has a working foundation with recording, transcription, categorization, and storage services. UI components exist but need refinement per validated sketch findings.

**Sketch findings:** Three design sketches (010, 011, 012) were explored and validated. Design direction is "vibrant yet professional" — bold accent colors (#E91E63 pink primary) on a calm warm base (#F8F7F4). Card-based layout inspired by Notion/Todoist.

**Design tokens:** Primary #E91E63, accent #FF6F00, background #F8F7F4, surface #FFFFFF, card radius 14px, 4px spacing base, Inter/system-ui font, 0.15s ease transitions.

**Key existing components:** ElevatedTabBar (center FAB), CreateNoteScreen (autosave + markdown), AudioPlayer, EmptyState, EntryCard.

## Constraints

- **Tech stack**: Expo SDK 54, React Native, TypeScript strict mode — no deviations
- **Target**: Android first — iOS later
- **Storage**: Use existing SQLite/Drizzle setup — no new DB migration
- **Tab bar**: Already implemented and matching sketch design — reuse as-is
- **Design**: Follow sketch findings (010, 011, 012) exactly — they are validated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 3 phases (one per sketch) | Clean separation, easier review per feature | — Pending |
| Use existing storage | DB schema already supports entries with audio/category/timestamps | — Pending |
| Full audio player in Note Editor | Sketch 010 specifies waveform + playback — core to voice-first experience | — Pending |
| Full markdown rendering | Sketch 010 specifies View/Edit toggle with rendered markdown | — Pending |
| Tab bar already done | Center FAB (+) already implemented per sketch design | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-17 after initialization*
