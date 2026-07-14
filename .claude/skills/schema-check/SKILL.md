---
name: schema-check
description: Validate Drizzle schema, TypeScript types, and V1 spec alignment before committing
---

# Schema Check (SQLite + Drizzle)

## When to Use

- After modifying Drizzle schema files
- After changing TypeScript type definitions
- Before committing database-related changes
- When investigating data inconsistencies

## Instructions

1. **Read the Drizzle schema:**
   ```bash
   find mhat-tan/src -name "schema.ts" -o -name "*.schema.ts"
   ```

2. **Read the TypeScript types:**
   ```bash
   cat mhat-tan/src/types/index.ts
   ```

3. **Read the V1 spec:**
   ```bash
   cat docs/mhat-tan-database-schema-v1.md
   ```

4. **Cross-check three sources:**

   | Source | What to check |
   |--------|--------------|
   | V1 spec | Tables, columns, types, indexes, constraints |
   | Drizzle schema | Maps 1:1 to V1 spec |
   | TypeScript types | Matches Drizzle inferred types |

5. **Run type check:**
   ```bash
   npx tsc --noEmit
   ```

6. **Report findings:**

## Output Format

```
Schema Validation Report
========================

Tables Check:
[PASS] users — 6 columns, 2 indexes
[PASS] categories — 12 columns, 2 indexes, 1 unique constraint
[FAIL] entries — missing `timezone` column (V1 spec requires it)

Indexes Check:
[PASS] idx_entries_user_created
[WARN] idx_entries_user_occurred — not defined in Drizzle schema

TypeScript Check:
[PASS] Entry type matches Drizzle inferred type
[FAIL] Category.type — 'expense' | 'income' in spec, but type allows 'string'

Summary: 14 passed, 1 warning, 2 failures
```

## Auto-Fix Suggestions

For each failure, suggest the Drizzle schema change:
```typescript
// Fix: Add timezone column
export const entries = sqliteTable('entries', {
  // ... existing columns
  timezone: text('timezone').notNull().default('Asia/Yangon'),
});
```

## References

- Drizzle schema: https://orm.drizzle.team/docs/sql-schema-declaration
- V1 spec: `docs/mhat-tan-database-schema-v1.md`
- Project types: `src/types/index.ts`
