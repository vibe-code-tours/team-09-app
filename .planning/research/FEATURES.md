# Feature Research

**Domain:** Voice-first daily record app (note editor, bottom sheet creation, empty states)
**Researched:** 2026-07-17
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **View/Edit toggle in note editor** | Users need to preview formatted content vs edit raw text. Every major note app (Notion, Bear, Obsidian) has this. | LOW | Already implemented in CreateNoteScreen.tsx — refine per sketch 010 design |
| **Metadata chips (category, time, pin)** | Users expect to see entry metadata at a glance without opening menus. Standard in card-based layouts. | LOW | Already implemented — ensure chips match sketch 010 design tokens |
| **Bottom sheet creation menu** | Tapping FAB should reveal creation options. iOS/Android standard pattern for primary actions. | LOW | Already implemented in ElevatedTabBar.tsx — refine per sketch 011 design |
| **Two clear creation paths** | Users expect to choose between voice recording and manual note entry. Core to voice-first + text fallback value proposition. | LOW | Record Voice (primary) + New Note (secondary) — already in sketch 011 |
| **Empty state with illustration** | New users must see guidance when no entries exist. Blank screens cause confusion and abandonment. | LOW | Already implemented as EmptyState.tsx — refine per sketch 012 design |
| **Dual CTAs on empty state** | Users need clear next steps: "Record Your First Entry" (primary) + "Write a Note" (secondary). | LOW | Already in sketch 012 — matches the two creation paths |
| **Autosave in note editor** | Users expect notes to save automatically as they type. Manual save buttons feel archaic. | MEDIUM | Already implemented with 2s debounce — verify reliability |
| **Back navigation from editor** | Users expect to tap back and return to timeline. Standard mobile pattern. | LOW | Already in HomeStack navigator |
| **Audio player in note editor** | Voice-first app must let users play back their recording from the note. Core to value proposition. | MEDIUM | AudioPlayer.tsx exists — integrate into CreateNoteScreen per sketch 010 |
| **Markdown rendering in view mode** | Users who write markdown expect formatted output (headers, bold, lists). Standard in note apps. | MEDIUM | Already using react-native-markdown-display — verify rendering quality |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated microphone illustration on empty state** | Communicates "voice-first" immediately. Creates emotional connection. Unique among note apps. | LOW | Sketch 012 specifies pulse animation — implement with react-native-reanimated |
| **Category color borders on entry cards** | Visual scanning of entries by category. Notion/Todoist-inspired but not universal. | LOW | Already in EntryCard.tsx — ensure colors match sketch 002-A |
| **Greeting header preserved on empty state** | "Good Morning" + user name stays visible even when empty. Personalizes first-time experience. | LOW | Sketch 012 specifies this — add to EmptyState component |
| **Save status indicator in editor header** | "Saved" dot + text gives confidence. Notion-style feedback loop. | LOW | Sketch 010 specifies save dot — add to CreateNoteScreen header |
| **Category chips as toolbar items** | Quick category switching from editor toolbar. Faster than dropdown menus. | MEDIUM | Sketch 010 shows category in toolbar — add as selectable chip |
| **Pinned entry badge on cards** | Visual priority for important entries. Users can pin notes for quick access. | LOW | Entry already has isPinned field — add badge UI to EntryCard |
| **Time-relative labels ("2h ago")** | More intuitive than absolute timestamps. Standard in social/feed apps. | LOW | Already in EntryCard — verify format consistency |
| **Bottom sheet with icon + text + chevron** | Richer option rows than plain text. iOS-style visual hierarchy. | LOW | Sketch 011 specifies this pattern — implement in ElevatedTabBar |
| **Backdrop overlay on bottom sheet** | Semi-transparent dimming signals "tap outside to dismiss". Standard iOS/Android pattern. | LOW | Already in ElevatedTabBar — ensure opacity matches sketch 011 |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Rich formatting toolbar (bold, italic, underline buttons)** | Users want WYSIWYG editing | Clutters mobile UI, requires complex state management, breaks markdown flow | Keep raw markdown edit mode — users who want formatting know markdown syntax |
| **Collaborative editing / real-time sync** | Users want to share notes | Requires backend infrastructure, conflict resolution, real-time WebSocket — out of scope for V1 | Defer to V2+ when Firebase sync is implemented |
| **Export to PDF / share as image** | Users want to share formatted notes | Adds complexity, requires PDF generation library, may not work offline | Keep sharing as plain text for now — sufficient for daily records |
| **Tag system / nested folders** | Users want advanced organization | Overcomplicates the 6-category system, creates decision fatigue | Stick with the 6 auto-categories (Money, Feelings, Work, Health, Ideas, Other) |
| **Template system for notes** | Users want structured entry formats | Adds cognitive overhead, contradicts "speak naturally" value proposition | Auto-categorization via AI is the template — let Gemini infer structure |
| **Undo/redo history** | Users want to recover mistakes | Complex state management, unclear what constitutes an "action" in a continuous editor | Autosave with version history via SQLite — already local-first |
| **Offline-first with cloud sync** | Users want data everywhere | Requires conflict resolution, sync logic, merge strategies — deferred to V2+ | Keep local-first SQLite for V1 — sync is out of scope per PROJECT.md |
| **Multi-language UI** | Users want app in their language | Translation overhead, Burmese-specific features lost in generic approach | Burmese-only for V1 — focus on Burmese voice transcription quality |
| **Voice commands in editor** | Users want hands-free editing | Unreliable speech recognition for editing commands, confusing UX | Keep voice input as recording-only — editing is text-based |
| **Dark mode toggle in settings** | Users want theme switching | Already implemented via ThemeContext — don't add toggle until system-level preference is tested | Use system preference detection first, add manual toggle later if requested |

## Feature Dependencies

```
[Empty State] ──triggers──> [Bottom Sheet Menu]
    └── CTA buttons open bottom sheet to create first entry

[Bottom Sheet Menu] ──routes to──> [Record Screen] or [Note Editor]
    └── "Record Voice" → RecordScreen
    └── "New Note" → CreateNoteScreen

[Note Editor] ──requires──> [Audio Player]
    └── Editor must play back the associated audio recording

[Note Editor] ──requires──> [Markdown Renderer]
    └── View mode renders markdown, Edit mode shows raw text

[Note Editor] ──requires──> [Autosave Service]
    └── Notes save automatically via storage service

[Entry Card] ──requires──> [Category System]
    └── Cards display category color borders and icons

[Search Screen] ──requires──> [Entry Data]
    └── Search queries entries via FTS5 — no dependency on editor
```

### Dependency Notes

- **Empty State requires Bottom Sheet Menu:** The CTAs ("Record Your First Entry", "Write a Note") must open the bottom sheet or navigate directly to the creation flow.
- **Bottom Sheet routes to Record Screen or Note Editor:** The two options in the sheet are entry points to the two creation flows.
- **Note Editor requires Audio Player:** Since this is a voice-first app, the editor must include playback of the associated recording.
- **Note Editor requires Markdown Renderer:** View/Edit toggle depends on a markdown rendering library (react-native-markdown-display).
- **Note Editor requires Autosave Service:** The 2s debounce autosave must work reliably to prevent data loss.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Note Editor with View/Edit toggle** — Core to the "daily record" value proposition. Users must be able to read and edit their entries.
- [ ] **Autosave in editor** — Prevents data loss, reduces friction. Already implemented — verify reliability.
- [ ] **Audio playback in editor** — Voice-first app must let users hear their recording. Already have AudioPlayer.tsx — integrate.
- [ ] **Bottom sheet creation menu** — Two clear paths: voice recording or manual note. Already implemented — refine styling.
- [ ] **Empty state with illustration + CTAs** — First-time users need guidance. Already implemented — refine per sketch 012.
- [ ] **Markdown rendering in view mode** — Users who write markdown expect formatted output. Already using react-native-markdown-display.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Category selection in editor toolbar** — Let users change category from the editor. Requires toolbar UI changes.
- [ ] **Pin entry from editor** — Allow users to pin important notes. Requires isPinned toggle in editor.
- [ ] **Save status indicator** — "Saved" dot in header gives confidence. Low effort, high UX value.
- [ ] **Relative time labels on cards** — "2h ago" instead of absolute timestamps. Already partially implemented.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Collaborative editing** — Requires backend infrastructure, conflict resolution. Deferred with Firebase sync.
- [ ] **Export/share functionality** — PDF export, image share. Adds complexity without core value validation.
- [ ] **Tag system** — Advanced organization beyond 6 categories. May not be needed if auto-categorization works well.
- [ ] **Template system** — Structured entry formats. Contradicts "speak naturally" value proposition.
- [ ] **Multi-language UI** — Translation overhead. Burmese-only for V1 to focus on voice quality.
- [ ] **Dark mode toggle** — Already have ThemeContext. Add manual toggle after system preference is tested.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Note Editor with View/Edit toggle | HIGH | LOW | P1 |
| Autosave in editor | HIGH | LOW | P1 |
| Audio playback in editor | HIGH | MEDIUM | P1 |
| Bottom sheet creation menu | HIGH | LOW | P1 |
| Empty state with illustration + CTAs | HIGH | LOW | P1 |
| Markdown rendering in view mode | MEDIUM | LOW | P1 |
| Category selection in editor toolbar | MEDIUM | MEDIUM | P2 |
| Pin entry from editor | MEDIUM | LOW | P2 |
| Save status indicator | MEDIUM | LOW | P2 |
| Relative time labels on cards | LOW | LOW | P2 |
| Collaborative editing | HIGH | HIGH | P3 |
| Export/share functionality | MEDIUM | MEDIUM | P3 |
| Tag system | MEDIUM | HIGH | P3 |
| Template system | LOW | HIGH | P3 |
| Multi-language UI | LOW | HIGH | P3 |
| Dark mode toggle | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (this milestone)
- P2: Should have, add when possible (next milestone)
- P3: Nice to have, future consideration (V2+)

## Competitor Feature Analysis

| Feature | Notion | Bear | Todoist | Our Approach |
|---------|--------|------|---------|--------------|
| View/Edit toggle | Yes (page preview vs edit) | Yes (reader vs editor) | No (always edit) | Yes — toggle at top, clear mode switch |
| Markdown support | Yes (full) | Yes (inline) | No | Yes — View mode renders, Edit mode raw |
| Autosave | Yes | Yes | Yes | Yes — 2s debounce via storage service |
| Audio playback | No | No | No | Yes — core to voice-first value proposition |
| Category system | Databases, tags | Tags, notebooks | Labels, projects | Yes — 6 auto-categories via AI |
| Empty state | Templates, examples | Onboarding tips | "Add task" CTA | Yes — animated mic illustration + dual CTAs |
| Bottom sheet creation | No (sidebar) | No (sidebar) | Quick Add button | Yes — FAB triggers bottom sheet with 2 options |
| Pin/favorite | Yes (favorites) | Yes (favorites) | Yes (priority) | Yes — isPinned field, badge on cards |
| Search | Yes (full-text) | Yes (full-text) | Yes (full-text) | Yes — FTS5 for Burmese text |
| Offline-first | Yes | Yes | Yes | Yes — SQLite local-first, no cloud sync V1 |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table Stakes | HIGH | All features validated by existing sketch findings (010, 011, 012) and already implemented in codebase |
| Differentiators | MEDIUM | Based on competitor analysis from training data; animated mic illustration is unique to voice-first apps |
| Anti-Features | MEDIUM | Based on general mobile UX principles; specific tradeoffs should be validated with users |
| Dependencies | HIGH | Directly derived from existing codebase architecture and component relationships |
| MVP Definition | HIGH | Aligned with PROJECT.md requirements and validated sketch findings |

## Sources

- Sketch findings: 010-note-editor, 011-bottom-sheet-menu, 012-empty-states (validated by team)
- Competitor analysis: Notion, Bear, Todoist, Otter.ai, Just Press Record (training data)
- Design patterns: iOS Human Interface Guidelines (sheets), Material Design (bottom sheets)
- React Native patterns: @gorhom/bottom-sheet documentation, react-native-markdown-display
- Project context: PROJECT.md, CLAUDE.md, .planning/codebase/ARCHITECTURE.md

---
*Feature research for: mhat-tan voice-first daily record app*
*Researched: 2026-07-17*
