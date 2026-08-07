---
quick_id: 260807-orz
slug: make-export-import-loading-show-as-a-ful
created: 2026-08-07
status: complete
---

# Make export/import loading show as a full-screen overlay

## Problem

In `src/screens/SettingsScreen.tsx`, the export/import loading state renders as
an inline `loadingRow` (small `ActivityIndicator` + text) tucked directly beneath
the Export Data / Import Data rows in the Data & Storage card. It reads as part
of the list, not as a status of an in-flight operation. The Export row also has a
no-op `rightLabel={isExporting ? undefined : undefined}` leftover.

## Goal

While an export or import is running, show a full-screen overlay centered on the
screen (transparent backdrop + fade + centered `ActivityIndicator` and status
text) so the user can see at a glance that a blocking operation is in progress.

## Tasks

### Task 1: Replace inline loading rows with a full-screen Modal overlay
- **Files:** `src/screens/SettingsScreen.tsx`
- **Action:**
  - Import `Modal` from `react-native`.
  - Remove the two inline `{isExporting && (…loadingRow…)}` and
    `{isImporting && (…loadingRow…)}` blocks from the Data & Storage section.
  - Remove the `rightLabel={isExporting ? undefined : undefined}` no-op from the
    Export row (always evaluates to `undefined`).
  - Add one `Modal` (transparent, `animationType="fade"`, `visible={isExporting || isImporting}`)
    near the existing `TimePickerModal` that renders a centered `ActivityIndicator`
    (size `large`, `colors.primary`) and a status label (`"Exporting…"` /
    `"Importing…"` based on which flag is set).
  - Add `overlay`, `overlayCard`, `overlayText` styles to the `StyleSheet` using
    the existing `spacing`/`radius`/`colors` tokens.
- **Verify:**
  - `npx tsc --noEmit` passes.
  - Visual: overlay appears centered while export/import runs (manual).
- **Done:** No inline loading rows remain; a full-screen loading overlay shows
  during export/import.

### Task 2: Update plan status and write SUMMARY.md
- **Files:** `.planning/quick/260807-orz-*/SUMMARY.md`, `PLAN.md`
- **Action:** Mark plan complete; write SUMMARY.md with `status: complete`.
- **Verify:** SUMMARY.md exists with `status: complete`.
- **Done:** Quick task artifacts in place.

## Notes

- The user reviews, commits, and pushes git changes themselves. Code changes are
  left in the working tree; the commit is handed to the user (no `git commit`
  run by the assistant).
- Worktree isolation is skipped: the target file (`src/screens/SettingsScreen.tsx`)
  is on branch `fix/issue-112` with uncommitted work; a worktree forked from
  `origin/main` would not contain it.
