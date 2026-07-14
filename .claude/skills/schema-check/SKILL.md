---
name: schema-check
description: Validate TypeScript types against Firestore schema and detect mismatches before deployment
---

# Schema Check

## When to Use

- After modifying type definitions in `src/types/index.ts`
- After changing Firestore write/read logic in `src/services/storage.ts`
- Before committing database-related changes
- When investigating data inconsistencies

## Instructions

1. **Read the type definitions:**
   ```bash
   cat mhat-tan/src/types/index.ts
   ```

2. **Read the storage service:**
   ```bash
   cat mhat-tan/src/services/storage.ts
   ```

3. **Cross-check each type against Firestore usage:**

   | Type | Check |
   |------|-------|
   | `Entry` | All fields present in `saveEntry()` writes |
   | `CategorizedEntry` | Extends Entry, matches Gemini response shape |
   | `Category` | Union type matches `CATEGORIES` constant values |
   | `RecordingState` | Matches `useRecording` hook state |

4. **Run type check:**
   ```bash
   npx tsc --noEmit
   ```

5. **Report findings:**
   - Fields in types but not in Firestore writes (dead code)
   - Fields in Firestore writes but not in types (type safety gap)
   - Type mismatches (string vs number, Date vs Timestamp)
   - Missing required fields

## Output Format

```
Schema Validation Report
========================
Types file: mhat-tan/src/types/index.ts
Storage file: mhat-tan/src/services/storage.ts

[PASS] Entry.transcript — string, used in saveEntry()
[PASS] Entry.category — Category, used in saveEntry()
[WARN] Entry.audioUri — string, defined but not saved to Firestore
[FAIL] Entry.createdAt — Date in type, Timestamp in Firestore

Summary: 8 passed, 1 warning, 1 failure
```

## References

- Firestore data model: https://firebase.google.com/docs/firestore/data-model
- Project types: `src/types/index.ts`
- Project storage: `src/services/storage.ts`
- Database schema plan: `docs/mhat-tan-database-schema-v1.md`
