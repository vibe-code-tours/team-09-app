---
quick_id: 260807-orz
slug: make-export-import-loading-show-as-a-ful
created: 2026-08-07
status: complete
---

# Make export/import loading show as a full-screen overlay

## What was wrong

In `src/screens/SettingsScreen.tsx`, the export/import loading state rendered as
an inline `loadingRow` tucked beneath the Export Data / Import Data rows in the
Data & Storage card — it read as part of the list, not as the status of an
in-flight operation. The Export row also carried a no-op
`rightLabel={isExporting ? undefined : undefined}` leftover.

## What changed

`src/screens/SettingsScreen.tsx`:

- Added `Modal` to the `react-native` import.
- Replaced both inline `loadingRow` blocks (under Export and under Import) with a
  single full-screen `Modal` overlay, rendered next to the existing
  `TimePickerModal`.
- The overlay uses `transparent`, `animationType="fade"`, and
  `statusBarTranslucent`, and is visible when `isExporting || isImporting`. It
  renders a dimmed backdrop, a centered card (`colors.surface`), a large
  `ActivityIndicator` (`colors.primary`), and a status label
  (`"Exporting…"` / `"Importing…"`).
- Removed the no-op `rightLabel={isExporting ? undefined : undefined}` from the
  Export row.
- Replaced the `loadingRow` / `loadingText` styles with `overlay` / `overlayCard`
  / `overlayText` using the existing `spacing` / `radius` tokens.

## Verification

- `npx tsc --noEmit` passes clean.
- Grep confirms no `loadingRow` / `loadingText` references remain and the overlay
  is wired to `isExporting` / `isImporting`.
- Visual behavior (overlay centered during export/import) requires a manual check
  on a device/emulator.

## Notes

- Change is in the working tree, uncommitted. The user reviews, commits, and
  pushes themselves (no `git commit`/`git push` run by the assistant).
- Worktree isolation was skipped: the target file is on branch `fix/issue-112`
  with uncommitted work; a worktree forked from `origin/main` would not contain
  it.
