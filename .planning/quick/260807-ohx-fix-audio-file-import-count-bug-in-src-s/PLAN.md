---
quick_id: 260807-ohx
slug: fix-audio-file-import-count-bug-in-src-s
created: 2026-08-07
status: complete
---

# Fix audio file import count bug

## Problem

Importing a backup ZIP reports **3 audio files** when the ZIP contains **2**.

Root cause: `zip.folder('recordings')` (JSZip) returns a **clone that shares the
parent's `files` map**. Iterating `recordingsFolder.files` therefore yields keys
relative to the zip *root* — including the root-level `mhat-tan-export.json`.
The importer's guard (`if (filename.endsWith('/')) continue`) only skips the
`recordings/` directory entry, not the root JSON file, so `mhat-tan-export.json`
is (a) counted as an audio file and (b) actually **written** into the recordings
directory as junk.

Verified with a JSZip round-trip test:
`folder.files` keys = `["mhat-tan-export.json","recordings/","recordings/rec-a.m4a","recordings/rec-b.m4a"]`.

## Goal

Import counts and restores exactly the real audio files inside the `recordings/`
folder — no more, no less.

## Tasks

### Task 1: Fix `src/services/importData.ts` audio iteration
- **Files:** `src/services/importData.ts`
- **Action:** In the audio-import loop, skip entries where `fileData.dir` is true
  (the `recordings/` folder entry) and skip entries not inside the recordings
  folder via `filename.startsWith(recordingsFolder.root)` (drops root-level
  `mhat-tan-export.json`). Keep the existing per-file logic unchanged.
- **Verify:**
  - JSZip round-trip test: folder with 2 audio files + JSON → count is 2
  - `npx tsc --noEmit` passes
- **Done:** Import reports 2 audio files for a 2-recording ZIP; no junk JSON
  written to the recordings directory.

### Task 2: Update `PLAN.md` frontmatter status and write `SUMMARY.md`
- **Files:** `.planning/quick/260807-ohx-*/SUMMARY.md`, `PLAN.md`
- **Action:** Mark plan complete; write SUMMARY.md with `status: complete`.
- **Verify:** SUMMARY.md exists with `status: complete` in frontmatter.
- **Done:** Quick task artifacts in place.

## Notes

- The user reviews, commits, and pushes git changes themselves. Code changes are
  left in the working tree; the commit is handed to the user (no `git commit`
  run by the assistant).
- Worktree isolation is skipped: the target file (`src/services/importData.ts`)
  is **untracked** on branch `fix/issue-112`, so an executor worktree forked from
  `origin/main` would not contain it.
