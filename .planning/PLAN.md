# Phase 1: HomeScreen UI Implementation

## Objective
Redesign `HomeScreen.tsx` to match the approved sketch designs: elevated center tab button (Sketch 001-C), card feed layout (Sketch 002-A), and metric cards (Sketch 003-A).

## Design Source
- `.planning/sketches/001-record-button/index.html` → Variant C (Center Tab)
- `.planning/sketches/002-entry-feed/index.html` → Variant A (Card Feed)
- `.planning/sketches/003-stats-summary/index.html` → Variant A (Metric Cards)

---

## Task 1: Create Theme Constants
**File:** `mhat-tan/src/theme/index.ts` (new)

Extract design tokens from `.planning/sketches/themes/default.css` into a TypeScript theme object:

```typescript
export const theme = {
  colors: {
    primary: '#E91E63',
    primaryLight: '#FCE4EC',
    primaryDark: '#AD1457',
    accent: '#FF6F00',
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    text: '#212121',
    textMuted: '#9E9E9E',
    border: '#F0F0F0',
    danger: '#F44336',
    success: '#4CAF50',
    successLight: '#E8F5E9',
  },
  categories: {
    money:    { icon: '💰', label: 'Money',    color: '#4CAF50' },
    feelings: { icon: '😊', label: 'Feelings', color: '#E91E63' },
    work:     { icon: '💼', label: 'Work',     color: '#2196F3' },
    health:   { icon: '🏥', label: 'Health',   color: '#FF9800' },
    ideas:    { icon: '💡', label: 'Ideas',    color: '#9C27B0' },
    other:    { icon: '📝', label: 'Other',    color: '#607D8B' },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
    primary: { shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  },
};
```

**Acceptance:** File compiles, exports `theme` object with all tokens.

---

## Task 2: Rewrite HomeScreen Header
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

Replace the pink gradient header with a clean surface header matching Sketch 002/003:

- Background: `theme.colors.surface` (white), not pink
- Left side: greeting text + date below
- Right side: avatar circle with initials (e.g., "KA")
- Border bottom: `1px solid theme.colors.border`
- Padding: 16px horizontal, 60px top (safe area), 16px bottom

**Current code to replace:**
```tsx
<View style={styles.header}>
  <Text style={styles.greeting}>{getGreeting()}</Text>
  <Text style={styles.date}>...</Text>
</View>
```

**New structure:**
```tsx
<View style={styles.header}>
  <View style={styles.headerRow}>
    <View>
      <Text style={styles.headerGreeting}>{getGreeting()}</Text>
      <Text style={styles.headerDate}>{formattedDate}</Text>
    </View>
    <View style={styles.headerAvatar}>
      <Text style={styles.avatarText}>KA</Text>
    </View>
  </View>
</View>
```

**Acceptance:** Header renders white background, greeting on left, avatar circle on right, matches sketch visually.

---

## Task 3: Add Metric Cards Row
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

Replace the current stats card with three separate metric cards in a horizontal row (Sketch 003-A):

- Three cards: Today, This Week, Total
- Each card: white background, centered number + label, subtle shadow
- "This Week" card gets highlight gradient: `linear-gradient(135deg, theme.colors.primary, theme.colors.primaryDark)`
- Numbers: 24px bold. Labels: 12px muted.
- Horizontal padding: 20px. Gap between cards: 12px.

**Current code to replace:**
```tsx
<View style={styles.statsCard}>
  <View style={styles.statItem}>...</View>
  <View style={styles.statDivider} />
  ...
</View>
```

**New structure:**
```tsx
<View style={styles.metricsRow}>
  <View style={styles.metricCard}>
    <Text style={styles.metricNumber}>{todayCount}</Text>
    <Text style={styles.metricLabel}>Today</Text>
  </View>
  <View style={[styles.metricCard, styles.metricCardHighlight]}>
    <Text style={[styles.metricNumber, styles.metricNumberWhite]}>{weekCount}</Text>
    <Text style={[styles.metricLabel, styles.metricLabelWhite]}>This Week</Text>
  </View>
  <View style={styles.metricCard}>
    <Text style={styles.metricNumber}>{totalCount}</Text>
    <Text style={styles.metricLabel}>Total</Text>
  </View>
</View>
```

**Acceptance:** Three cards render in a row, middle one has pink gradient background with white text, numbers display correctly.

---

## Task 4: Rewrite Entry Card Component
**File:** `mhat-tan/src/components/EntryCard.tsx` (modify)

Update to match Sketch 002-A card feed design:

- **Left border:** 4px solid with category color (e.g., `borderLeftColor: CATEGORIES[entry.category].color`)
- **Header row:** emoji icon (16px) + category label (bold, colored) + time string (right-aligned, muted)
- **Summary:** 14px text, 1.5 line height, max 2 lines
- **Footer row:** mood emoji + mood text (muted), pinned badge (if `isPinned`)
- **Card style:** white bg, borderRadius 16, padding 16, marginBottom 12, shadow
- **Press feedback:** `translateY(-1px)` on hover (use `onPressIn`/`onPressOut` for RN)

**Current code issues:**
- No left border color
- No time display
- No pinned badge
- No footer row layout

**Acceptance:** Card shows colored left border, category header with time, summary, mood+pin footer. Tapping provides subtle lift feedback.

---

## Task 5: Add "Recent Entries" Section Header
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

Add a section header above the entry list:

- Left: "Recent Entries" title (16px, semi-bold)
- Right: "See all →" link (14px, primary color)
- Container: horizontal padding 20px, margin-top 24px

```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Recent Entries</Text>
  <TouchableOpacity>
    <Text style={styles.sectionLink}>See all →</Text>
  </TouchableOpacity>
</View>
```

**Acceptance:** Section header renders with title and tappable "See all" link.

---

## Task 6: Add Empty State
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

When no entries exist, show an empty state below the metrics:

- Centered content
- Document icon (Ionicons `document-text-outline`, 48px, #E0E0E0)
- "No entries yet" title (16px, semi-bold, #666)
- "Tap the mic to record your first entry" subtitle (14px, #999)

**Acceptance:** Empty state renders centered with icon, title, and subtitle when entries array is empty.

---

## Task 7: Populate Entry List with Mock Data
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

Add mock entries array to render the card feed (for visual verification before real data integration):

```typescript
const MOCK_ENTRIES: Entry[] = [
  {
    id: '1',
    transcript: '',
    category: 'money',
    summary: 'Bought lunch at the market — 3,500 kyat for mohinga and tea',
    items: [],
    mood: '😊 Content',
    audioUri: '',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPinned: true,
    userId: 'mock',
  },
  {
    id: '2',
    transcript: '',
    category: 'work',
    summary: 'Finished the database schema review with the team',
    items: [],
    mood: '💪 Productive',
    audioUri: '',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isPinned: false,
    userId: 'mock',
  },
  {
    id: '3',
    transcript: '',
    category: 'feelings',
    summary: 'Called family back home. Miss them but feeling grateful.',
    items: [],
    mood: '🥰 Grateful',
    audioUri: '',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isPinned: false,
    userId: 'mock',
  },
];
```

Render with `<FlatList>` for performance, with `showsVerticalScrollIndicator={false}`.

**Acceptance:** Three entry cards render in a scrollable list with correct category colors, icons, and content.

---

## Task 8: Style Cleanup
**File:** `mhat-tan/src/screens/HomeScreen.tsx` (modify)

Remove all old styles that are no longer used:
- `statsCard`, `statItem`, `statNumber`, `statLabel`, `statDivider`
- `actionsContainer`, `actionCard`, `actionIcon`, `actionTitle`, `actionSubtitle`
- `header` (old pink gradient version)

Add all new styles for:
- `header`, `headerRow`, `headerGreeting`, `headerDate`, `headerAvatar`, `avatarText`
- `metricsRow`, `metricCard`, `metricCardHighlight`, `metricNumber`, `metricNumberWhite`, `metricLabel`, `metricLabelWhite`
- `sectionHeader`, `sectionTitle`, `sectionLink`
- `entriesList`, `emptyContainer`, `emptyIcon`, `emptyText`, `emptySubtext`

**Acceptance:** No unused styles remain, all new styles compile, visual appearance matches sketches.

---

## Verification Checklist
After all tasks, verify:
- [ ] Header: white background, greeting + date on left, avatar circle on right
- [ ] Metrics: three cards in a row, middle one pink gradient with white text
- [ ] Section: "Recent Entries" with "See all →" link
- [ ] Cards: colored left border, category icon + label + time, summary, mood + pinned footer
- [ ] Empty state: centered icon + text when no entries
- [ ] Scroll: smooth vertical scroll through all content
- [ ] No TypeScript errors
- [ ] No visual regressions on other screens

## Files Modified
1. `mhat-tan/src/theme/index.ts` (new)
2. `mhat-tan/src/screens/HomeScreen.tsx` (major rewrite)
3. `mhat-tan/src/components/EntryCard.tsx` (update)

## Estimated Effort
~2-3 hours of focused implementation.
