---
phase: 260807-e7s-finish-github-issue-70-token-mapping-con
plan: 01
status: complete
subsystem: UI styling
tags:
  - design-tokens
  - issue-70
  - refactor
  - style
requires: []
provides:
  - Full token coverage of exact-scale spacing/borderRadius literals across modal/sheet/tab-bar/screen styles
affects:
  - src/components/BackgroundTitleModal.tsx
  - src/components/CreateSheet.tsx
  - src/components/ElevatedTabBar.tsx
  - src/screens/DayDetailScreen.tsx
  - src/screens/HomeScreen.tsx
  - src/screens/RecordScreen.tsx
  - src/screens/SearchScreen.tsx
  - src/screens/WeeklySummaryScreen.tsx
  - src/components/TimePickerModal.tsx
  - src/components/PinLimitModal.tsx
tech-stack:
  added: []
  patterns:
    - Import spacing/radius from ../theme in components that previously had no token import
    - House-style compound `spacing.xxxl + spacing.sm` for 40px padding/bottom values
key-files:
  created: []
  modified:
    - src/components/BackgroundTitleModal.tsx
    - src/components/CreateSheet.tsx
    - src/components/ElevatedTabBar.tsx
    - src/screens/DayDetailScreen.tsx
    - src/screens/HomeScreen.tsx
    - src/screens/RecordScreen.tsx
    - src/screens/SearchScreen.tsx
    - src/screens/WeeklySummaryScreen.tsx
decisions:
  - 40px values use `spacing.xxxl + spacing.sm` compound (32+8=40) matching CreateSheet sheet.paddingBottom and RecordScreen discardButton treatment
  - Discovered SearchScreen entryContent.gap: 4 as an additional exact-token literal beyond the plan's expected leave list and converted it per Task 3's explicit fallback instruction
  - Leave-values documented: non-scale values (2/6/14/28), fixed circles/geometry (64/48/40/36/80/132/44/24), radius-half-of-fixed-diameter (centerButton 32, headerAvatar 20), and `padding: 0` reset / `padding: 2` clearBtn
metrics:
  duration: ~15m
  completed_date: 2026-08-07
  conversions: 31
---

# Phase 260807-e7s Plan 01: Finish GitHub Issue #70 — Token Mapping (Cont.)

## One-liner

Completed GitHub issue #70 finding #1 (hardcoded CSS → design tokens) by converting the last 31 exact-scale spacing/borderRadius literals in BackgroundTitleModal, CreateSheet, ElevatedTabBar, and screen leftovers (DayDetail, Home, Record, WeeklySummary, plus one discovered in SearchScreen) — closing the final token-coverage gap left by 260805-krn and 260806-gg3.

## What Was Built

Pure style-literal swaps. Every spacing/borderRadius literal that maps exactly onto the token scale (4/8/12/16/20/24/32 → `spacing`, 8/12/16/20 → `radius`) now references `spacing.*` / `radius.*`. Zero functional or layout change. All changes left uncommitted for user review.

## Conversions by File

### Task 1 — Modal components (22 conversions)

**`src/components/BackgroundTitleModal.tsx`** — 10 conversions + import fix
- Import on line 21 extended from `createShadows` to `spacing, radius, createShadows` (alphabetical order per project convention)
- modalOverlay.paddingHorizontal 32 → `spacing.xxxl`; modalContent.borderRadius 20 → `radius.xl`; modalTitle.marginBottom 4 → `spacing.xs`; modalSubtitle.marginBottom 20 → `spacing.xl`; modalInput.borderRadius 12 → `radius.md`, paddingHorizontal 16 → `spacing.lg`, marginBottom 20 → `spacing.xl`; modalButtons.gap 12 → `spacing.md`; modalSkipBtn.borderRadius 12 → `radius.md`; modalSaveBtn.borderRadius 12 → `radius.md`

**`src/components/CreateSheet.tsx`** — 12 conversions + new import
- Added `import { spacing, radius } from '../theme';` after the `useTheme` import (line 14) — file previously had no theme-token import
- sheet.borderTopLeftRadius/borderTopRightRadius 20 → `radius.xl`; sheet.paddingBottom 40 → `spacing.xxxl + spacing.sm`; handle.marginTop 12 → `spacing.md`, marginBottom 16 → `spacing.lg`; title.paddingHorizontal 20 → `spacing.xl`, marginBottom 16 → `spacing.lg`; option.paddingHorizontal 20 → `spacing.xl`, paddingVertical 16 → `spacing.lg`; optionIcon.borderRadius 12 → `radius.md`; optionText.marginLeft 12 → `spacing.md`; optionSubtitle.marginTop 4 → `spacing.xs`

### Task 2 — ElevatedTabBar + screen leftovers (9 conversions)

**`src/components/ElevatedTabBar.tsx`** — 2 conversions
- tabLabel.marginTop 4 → `spacing.xs`; centerLabel.marginTop 4 → `spacing.xs`

**`src/screens/DayDetailScreen.tsx`** — 1 conversion
- entryContent.gap 4 → `spacing.xs`

**`src/screens/HomeScreen.tsx`** — 1 conversion
- entryContent.gap 4 → `spacing.xs`

**`src/screens/RecordScreen.tsx`** — 2 conversions
- statusContainer.paddingHorizontal 40 → `spacing.xxxl + spacing.sm`; actionContainer.paddingHorizontal 40 → `spacing.xxxl + spacing.sm`

**`src/screens/WeeklySummaryScreen.tsx`** — 3 conversions
- statCard.gap 4 → `spacing.xs`; categoryChip.gap 4 → `spacing.xs`; moodItem.gap 4 → `spacing.xs`

### Task 3 — Verify-only pass (1 conversion, 3 files verified)

**`src/components/TimePickerModal.tsx`** — verified clean, no edits. Remaining literals are only fixed scroll-window geometry (scrollContainer.width 80, height 132, pickerItem.height 44, snapToInterval/scrollTo 44) plus typography. Already imports spacing/radius.

**`src/components/PinLimitModal.tsx`** — verified clean, no edits. Remaining literal is only `width: 24` (fixed icon) plus `lineHeight: 20` (typography) and `borderLeftWidth: 3` (not on scale). Already imports spacing/radius.

**`src/screens/SearchScreen.tsx`** — 1 conversion (discovered extra token-able literal). SearchScreen's only listed leave-values were searchInput.padding 0 (reset) and clearBtn.padding 2 (not on scale). Sweep found an additional exact-token literal NOT in the plan's expected inventory: `entryContent.gap: 4` (line 683) → `spacing.xs`. Per Task 3's explicit fallback instruction ("If any additional token-able literal (exact-scale value) is found beyond these, convert it with the token"), converted it — same `entryContent.gap: 4` treatment as DayDetailScreen/HomeScreen. Verified the remaining literals are only the documented leave-values (padding 0, padding 2, categoryTag 6/2/4).

## Leave Values (documented, intentionally untouched)

| File | Value | Rationale |
|------|-------|-----------|
| BackgroundTitleModal | padding 28, paddingVertical 14 ×3 | 28/14 not on scale (mirrors RecordScreen modal treatment) |
| BackgroundTitleModal | fontSize 20/14/16, width '100%', rgba(0,0,0,0.5), borderWidth 1 | typography/geometry/color/border |
| CreateSheet | sheet.maxHeight `SCREEN_HEIGHT * 0.5` | responsive percentage |
| CreateSheet | handle width 40 / height 4 / borderRadius 2 | fixed grab-handle geometry (4/2 not on scale) |
| CreateSheet | optionIcon width/height 48 | fixed touch-target icon circle |
| ElevatedTabBar | centerButton borderRadius 32, width/height 64, borderWidth 4 | half of fixed 64px circle |
| DayDetail/Home/Search | categoryTag 6/2/4, headerSubtitle.marginTop 2 | small tag chip, not on scale |
| HomeScreen | headerAvatar.borderRadius 20 | half of fixed 40px avatar circle |
| RecordScreen | discardButton.borderRadius 25, modalContent.padding 28, headerSpacer 28, minHeight 140/64 | not on scale / prior passes |
| TimePickerModal | 80/132/44, letterSpacing 0.5 | fixed scroll-window geometry |
| PinLimitModal | width 24, lineHeight 20, borderLeftWidth 3 | fixed icon / typography / not on scale |
| SearchScreen | padding 0 (reset), padding 2 (clearBtn) | reset value / not on scale |

## Verification

- `npx tsc --noEmit` exit 0 after each task (Task 1, Task 2, Task 3)
- Token-reference count across BackgroundTitleModal + CreateSheet: 22 (gate ≥ 22) — PASS
- Grep gate `gap: 4|paddingHorizontal: 40` across the 4 screens: 0 hits — PASS
- TimePickerModal fixed geometry count (width 80 | height 132 | height 44): 3 (gate expect 3) — PASS
- PinLimitModal `width: 24` count: 1 (gate expect 1) — PASS
- Final comprehensive sweep for exact-token spacing/borderRadius literals across all 10 files: only documented leave-values remain — PASS
- `git status`: 7 plan files + 3 verify files show modified; no commits made

## Deviations from Plan

- **[Rule 1 - Bug / uncovered literal]** SearchScreen `entryContent.gap: 4` converted to `spacing.xs`. Found during Task 3 sweep. The plan's Task 3 expected inventory listed only `padding: 0` and `padding: 2` as SearchScreen's remaining literals, but an additional exact-token literal (`gap: 4`) existed. Converted per Task 3's explicit fallback instruction ("If any additional token-able literal (exact-scale value) is found beyond these, convert it with the token"). No functional/layout change. Files modified: `src/screens/SearchScreen.tsx`.

No other deviations — plan executed as written.

## Known Stubs

None — all conversions are complete token references; no placeholder/empty values introduced.

## Threat Flags

None — style-constant swaps only; no new network endpoints, auth paths, file access patterns, or schema changes. T-260807-01 mitigated (tokens are `as const` typed, tsc rejects invalid token names); T-260807-02 accepted (no new dependencies added).

## Self-Check: PASSED
