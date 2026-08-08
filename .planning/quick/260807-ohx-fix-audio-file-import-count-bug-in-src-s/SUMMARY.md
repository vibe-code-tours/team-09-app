---
quick_id: 260807-ohx
slug: fix-audio-file-import-count-bug-in-src-s
created: 2026-08-07
status: complete
---

# Fix audio file import count bug

## What was wrong

Importing a backup ZIP reported **3 audio files** when the ZIP contained **2**.

`zip.folder('recordings')` (JSZip) returns a clone that shares the parent's
`files` map, so iterating `recordingsFolder.files` yields root-relative keys —
including `mhat-tan-export.json` at the zip root. The old guard
(`if (filename.endsWith('/')) continue`) only skipped the `recordings/`
directory entry. The root JSON file was therefore (a) counted as an audio file
and (b) actually written into the recordings directory as junk.

## What changed

`src/services/importData.ts` — audio import loop now skips:

1. `fileData.dir === true` — the `recordings/` directory entry
2. Any key not prefixed by the folder's entry name (`recordings/`) — drops
   root-level files like `mhat-tan-export.json`

The per-file write + old-path → new-path mapping logic is unchanged.

## Verification

- JSZip round-trip simulation of the fixed loop: `audioFilesImported = 2`,
  written files = `["rec-a.m4a", "rec-b.m4a"]`, mapping size = 2. PASS.
- `npx tsc --noEmit` passes clean.

## Notes

- Change is in the working tree, uncommitted. The user reviews, commits, and
  pushes themselves (no `git commit`/`git push` run by the assistant).
- Worktree isolation was skipped: the target file is untracked on branch
  `fix/issue-112`, so a worktree forked from `origin/main` would not contain it.
