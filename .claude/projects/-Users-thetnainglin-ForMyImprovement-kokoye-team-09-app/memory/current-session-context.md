---
name: current-session-context
description: Current branch and what's being worked on
metadata:
  type: project
---

## Current Work

- **Branch:** `fix/polish-setting-search-home-pages` (from git status)
- **Recent:** Notes tab with pin limit, recording flow improvements

## Next likely areas

- Settings, Search, Home pages polish
- Possibly more features from PROJECT-PLAN.md

## Known Issues

- **iOS Audio Playback (Low Priority):** AVFoundationErrorDomain (-11800) on iOS when audio files missing. Android works fine. Added guard in AudioPlayer to show "Recording unavailable" instead of crashing. Root cause: expo-av temp files cleared on iOS restart, database still references stale URIs.

**Why:** Reduces need to re-explore git history and recent changes each session.
**How to apply:** At session start, check if branch is still `fix/polish-setting-search-home-pages`. If user asks about a different feature, update this file.
