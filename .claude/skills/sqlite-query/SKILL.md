---
name: sqlite-query
description: Build, test, and debug SQLite queries using Drizzle ORM for the Mhat Tan project
---

# SQLite Query Builder (Drizzle ORM)

## When to Use

- Building new Drizzle queries for screens or services
- Debugging query results or performance
- Testing filters, joins, and ordering

## Instructions

1. **Understand the schema:**
   Read `docs/mhat-tan-database-schema-v1.md` and the Drizzle schema files.

2. **Common query patterns:**

   ```typescript
   import { db } from '../db';
   import { entries, categories, expenseItems } from '../db/schema';
   import { eq, and, desc, gte, lte, like } from 'drizzle-orm';

   // Get all entries for a user, ordered by date
   const userEntries = await db
     .select()
     .from(entries)
     .where(eq(entries.userId, userId))
     .orderBy(desc(entries.createdAt));

   // Get entries by type
   const moneyEntries = await db
     .select()
     .from(entries)
     .where(and(
       eq(entries.userId, userId),
       eq(entries.entryType, 'money')
     ))
     .orderBy(desc(entries.occurredAt));

   // Get entries with category names (JOIN)
   const entriesWithCategories = await db
     .select({
       entry: entries,
       category: categories,
     })
     .from(entries)
     .leftJoin(categories, eq(entries.predictedCategoryId, categories.id))
     .where(eq(entries.userId, userId));

   // Get today's entries
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const todayEntries = await db
     .select()
     .from(entries)
     .where(and(
       eq(entries.userId, userId),
       gte(entries.occurredAt, today)
     ));

   // Full-text search (FTS5)
   const searchResults = await db
     .select()
     .from(entries)
     .where(like(entries.transcript, `%${searchTerm}%`));
   ```

3. **Insert examples:**
   ```typescript
   await db.insert(entries).values({
     id: crypto.randomUUID(),
     userId: userId,
     entryType: 'money',
     transcript: 'ဒီနေ့ မုန့်စားတယ်',
     summary: 'မုန့်စားခြင်း',
     audioPath: '/path/to/audio.m4a',
     audioDuration: 45,
     occurredAt: new Date(),
     timezone: 'Asia/Yangon',
   });
   ```

4. **Update examples:**
   ```typescript
   await db
     .update(entries)
     .set({ summary: 'Updated summary', updatedAt: new Date() })
     .where(eq(entries.id, entryId));
   ```

5. **Test the query** by running it and logging results.

## Performance Tips

- Use indexes: always filter on `userId` + indexed columns
- Use `limit()` for pagination
- Avoid `SELECT *` in production — pick only needed columns
- Check query plans with `db.all(sql`EXPLAIN ${query}`)`

## Common Issues

- **Missing column:** Ensure Drizzle schema matches `docs/mhat-tan-database-schema-v1.md`
- **Type mismatch:** Dates should be JS Date objects, not strings
- **FTS5 not working:** Ensure the virtual table and triggers are created

## References

- Drizzle queries: https://orm.drizzle.team/docs/select
- Drizzle conditions: https://orm.drizzle.team/docs/operators
- V1 schema: `docs/mhat-tan-database-schema-v1.md`
