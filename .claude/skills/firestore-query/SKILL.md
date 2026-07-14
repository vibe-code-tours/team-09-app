---
name: firestore-query
description: Build, test, and debug Firestore queries for the Mhat Tan project
---

# Firestore Query Builder

## When to Use

- Building new Firestore queries for screens or services
- Debugging query performance or results
- Testing query filters and ordering

## Instructions

1. **Understand the collection structure:**
   ```
   users/{userId}/entries/{entryId}
   ```

2. **Read the current query patterns** in `src/services/storage.ts`:
   - `getEntries(userId)` — all entries, ordered by createdAt desc
   - `getTodayEntries(userId)` — today's entries only
   - `saveEntry(userId, entry)` — write new entry

3. **Build queries using the Firestore Web SDK:**
   ```typescript
   import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
   import { db } from '../config/firebase';

   // Example: Get entries by category
   const q = query(
     collection(db, 'users', userId, 'entries'),
     where('category', '==', 'money'),
     orderBy('createdAt', 'desc'),
     limit(20)
   );
   ```

4. **Common query patterns for this app:**
   - By category: `where('category', '==', category)`
   - Date range: `where('createdAt', '>=', startDate), where('createdAt', '<=', endDate)`
   - Pinned only: `where('isPinned', '==', true)`
   - Search summary: `where('summary', '>=', searchTerm), where('summary', '<=', searchTerm + '')`

5. **Test the query** by calling it and logging results:
   ```typescript
   const snapshot = await getDocs(q);
   console.log(`Found ${snapshot.size} entries`);
   snapshot.forEach(doc => console.log(doc.id, doc.data()));
   ```

## Performance Tips

- Always add indexes for compound queries (where + orderBy on different fields)
- Use `limit()` to cap result sets
- Avoid `!=` queries — use `in` instead for multiple values
- Check Firebase console for index creation prompts

## Common Issues

- **Missing index:** Firebase will log an error with a link to create the required index
- **Wrong field type:** Ensure Timestamp fields are compared with Timestamp, not Date
- **Nested collection:** Entries are at `users/{uid}/entries`, not root `entries`

## References

- Firestore queries: https://firebase.google.com/docs/firestore/query-data/queries
- Project storage service: `src/services/storage.ts`
