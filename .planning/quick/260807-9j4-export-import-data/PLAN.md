---
quick_id: 260807-9j4
slug: export-import-data
created: 2026-08-07
status: in-progress
---

# Export & Import Data

## Problem
All user data (entries, audio recordings, settings) is local-only. No backup/export path exists. Users lose everything on reinstall or data clear.

## Goal
Add Export and Import functionality to SettingsScreen so users can back up and restore their data.

## Tasks

### Task 1: Install dependencies
- `jszip` — ZIP file creation/extraction
- `@types/jszip` — TypeScript types
- `expo-document-picker` — pick ZIP files for import
- `expo-sharing` — share the exported ZIP via OS share sheet (already installed)

### Task 2: Create `src/services/exportData.ts`
- `exportAllData(userId)` — reads all entries + settings, reads audio files from disk, bundles into a ZIP, returns ZIP URI
- ZIP contains: `mhat-tan-export.json` (metadata + entries + settings) + `recordings/*.m4a` (audio files)
- Share via `expo-sharing`

### Task 3: Create `src/services/importData.ts`
- `importDataFromZip(zipUri)` — picks and extracts a ZIP, parses JSON, copies audio files to recordings dir, inserts entries + settings into SQLite
- Handles validation (missing files, corrupted data, etc.)

### Task 4: Update `src/screens/SettingsScreen.tsx`
- Add "Export Data" and "Import Data" buttons in the "Data & Storage" section
- Show loading state during export/import
- Show success/failure alerts

### Task 5: Create SUMMARY.md
