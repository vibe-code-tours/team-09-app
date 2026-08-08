---
phase: 260805-krn-fix-github-issue-70-ui-ux-audit-findings
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/Skeleton.tsx
  - src/screens/HomeScreen.tsx
  - src/screens/NotesScreen.tsx
  - src/screens/DayDetailScreen.tsx
  - src/screens/RecordScreen.tsx
  - src/screens/CreateNoteScreen.tsx
  - src/components/EntryCard.tsx
  - src/components/AudioPlayer.tsx
  - src/components/EmptyState.tsx
  - src/components/WeeklySummaryCard.tsx
autonomous: true
requirements: []
user_setup: []
---

<objective>
Resolve GitHub issue #70 UI/UX audit findings: (1) replace non-responsive hardcoded pixel values with the existing design token system (`spacing` / `radius` from `src/theme/index.ts`) plus fluid flex layouts, and (2) add skeleton loading states to the data-fetching screens.

Purpose: The app has a validated design token system (src/theme/index.ts) but ~314 hardcoded numeric style values still exist across src/, so small-screen rendering is inconsistent and unmaintainable. Screens that fetch data (Home, Notes, DayDetail) render an empty/zeroed state and populate later — a perceived-performance gap the audit flagged.

Output: A reusable animated `Skeleton` component (theme-aware pulse, token-based), token-mapped styles across the listed screens/components, and skeleton loading states in the three data-fetching screens.

Note: The user reviews, commits, and pushes changes THEMSELVES. Leave ALL code changes uncommitted in the working tree. Do NOT run `git commit` or `git add` on code.
</objective>

<execution_context>
@/Users/thetnainglin/ForMyImprovement/kokoye/team-09-app/.claude/skills/sketch-findings-mhat-tan/SKILL.md
</execution_context>

<context>
Design tokens: `src/theme/index.ts` — `spacing` {xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32}, `radius` {sm:8, md:12, lg:16, xl:20, full:9999}, `createShadows(isDark, primaryColor)`. Theme via `useTheme()` → `{ theme, isDark }`, `colors` from `theme.colors`.

Existing animated-pulse pattern to mirror: `src/components/EmptyState.tsx` (Animated.loop + sequence + timing with useNativeDriver: true) and `src/components/RecordButton.tsx`.

Existing token-based style reference (already converted): HomeScreen, NotesScreen styles use `spacing.*` / `radius.*` throughout — follow the same mapping style.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create reusable animated Skeleton component</name>
  <files>src/components/Skeleton.tsx</files>
  <action>
    Create `src/components/Skeleton.tsx`, a theme-aware placeholder component used by the skeleton loading states in Task 3.

    Design and props:
    - Named export `Skeleton` (arrow function `const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = radius.md, style }) => { ... }`). One component per file, per convention.
    - Props interface `SkeletonProps` (inline above component, per convention): `width?: DimensionValue`, `height?: DimensionValue`, `borderRadius?: number`, `style?: StyleProp<ViewStyle>`. No `any` types — use `DimensionValue` from react-native for width/height.
    - Theme-aware base color: `backgroundColor: colors.surfaceAlt` (dark theme #2A2A2A, light #FAFAFA — visible in both modes without hardcoded color literals).
    - Pulse animation (mirror the EmptyState.tsx pattern, lines 21-55): `const pulseAnim = useRef(new Animated.Value(1)).current;` plus `Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true })]))` started in a `useEffect` with cleanup calling `pulse.stop()`.
    - Render an `Animated.View` with `style={[styles.base, { width, height, borderRadius, backgroundColor: colors.surfaceAlt, opacity: pulseAnim }, style]}`. `styles.base` holds only `overflow: 'hidden'` — width/height/borderRadius/backgroundColor are prop-driven.
    - Static styles via `StyleSheet.create()` at the bottom of the file; no inline static styles (convention).
    - Imports: `React, { useEffect, useRef }`, `Animated`, `StyleSheet`, `ViewStyle, StyleProp, DimensionValue` types from react-native, `useTheme` from `../theme/ThemeContext`, `radius` from `../theme`.

    Do NOT add any shimmer/gradient — the pulse opacity loop above is the full animation. Do NOT create a composite "SkeletonCard" in this component; composites are composed by the screens in Task 3 with arrays of this primitive.
  </action>
  <verify>
    npx tsc --noEmit passes (no type errors introduced)
  </verify>
  <done>Skeleton.tsx exists with pulse animation, theme-aware surfaceAlt color, token-based default radius, and passes `npx tsc --noEmit`.</done>
</task>

<task type="auto">
  <name>Task 2: Map hardcoded pixel values to design tokens (responsive CSS fix)</name>
  <files>src/screens/RecordScreen.tsx, src/screens/CreateNoteScreen.tsx, src/components/EntryCard.tsx, src/components/AudioPlayer.tsx, src/components/EmptyState.tsx, src/components/WeeklySummaryCard.tsx</files>
  <action>
    Convert hardcoded numeric pixel values to design tokens in the listed files, addressing audit finding 1 (non-responsive hardcoded CSS).

    Import tokens where missing: `spacing` and `radius` from `../theme` (these files already import `useTheme` from `../theme/ThemeContext`; screens also already import `createShadows`).

    Mapping rules — ONLY convert values that map exactly onto the token scale:
    - Spacing values 4/8/12/16/20/24/32 → `spacing.xs/sm/md/lg/xl/xxl/xxxl` respectively (padding*, margin*, gap, top/left/right/bottom offsets, width/height on small layout elements like icon containers).
    - Radius values 8/12/16/20/9999 → `radius.sm/md/lg/xl/full`.
    - Compound expressions (e.g. `paddingTop: spacing.xxl + spacing.sm`, `marginLeft: spacing.lg + spacing.sm` in HomeScreen) are already the established house style — allowed where a token sum expresses the layout intent exactly.
    - `StyleSheet.hairlineWidth` for 1px borders (thin borders convention).

    Explicitly DO NOT convert (legitimately fixed sizes — avoid churn):
    - Icon `fontSize` values inside Ionicons/emoji/text-icon circles (e.g. 16-24 emoji sizes, mic size 48 in EmptyState).
    - Fixed circular/avatar dimensions and their half-value radii (e.g. EmptyState illustration 120x120 / pulseRing 120 / iconCircle 96 with radius 48/60; WeeklySummaryCard 36x36 icon with radius 18; headerAvatar 40x40 with radius 20 in HomeScreen if touched).
    - Typography scales (fontSize 10-24, lineHeight) — no font token system exists yet; leave unchanged.
    - Swipe-action widths (80) and list `paddingBottom: 100` (scroll clearance).
    - Fixed hitSlop values.

    Per-file specifics (focus on the clearly-token-able spacing/borderRadius literals — grep each file for `: [0-9]+` in StyleSheet blocks and convert exact matches):
    1. `src/screens/RecordScreen.tsx` (~48 values, most of any file): convert all exact-token spacing and borderRadius literals. The screen already uses `spacing`/`radius` in places — extend the same usage to the remaining literals.
    2. `src/screens/CreateNoteScreen.tsx`: same treatment (it already imports tokens — verify and extend).
    3. `src/components/EntryCard.tsx`: small values — e.g. borderRadius 12 → radius.md, 8 → radius.sm, padding/margin 4/8/12/16 → spacing tokens. Note `gap: 4` → `spacing.xs` in content containers.
    4. `src/components/AudioPlayer.tsx`: convert padding/margin/borderRadius literals that match tokens; keep fixed height/width that define the progress bar track/thumb.
    5. `src/components/EmptyState.tsx`: `paddingVertical: 60` → `spacing.xxxl * 2` (existing house-style compound, mirrors `spacing.xxxl * 2` used in WeeklySummaryScreen line 331); leave the 120/96/60/48 illustration circle literals (fixed-size illustration).
    6. `src/components/WeeklySummaryCard.tsx`: `height: 36`/`borderRadius: 18` are the fixed icon chip — leave; convert any surrounding spacing literals that match tokens.

    Files intentionally NOT touched by this task (already token-based or out of scope for churn): HomeScreen.tsx, NotesScreen.tsx, DayDetailScreen.tsx, SearchScreen.tsx, SettingsScreen.tsx, WeeklySummaryScreen.tsx (already token-heavy), ElevatedTabBar.tsx, RecordButton.tsx, TimePickerModal.tsx, CreateSheet.tsx, PinLimitModal.tsx, BackgroundTitleModal.tsx (leave unless a literal is trivially token-able — do not spend context on these).

    Do NOT change any functional behavior: no layout structure changes, no width/height changes on fixed-size elements, no reordering. This is a pure style-literal swap.
  </action>
  <verify>
    npx tsc --noEmit passes
  </verify>
  <done>Hardcoded spacing/borderRadius literals that map exactly onto the token scale are replaced with `spacing.*`/`radius.*` in the six listed files; fixed-size elements (icon circles, illustration, typography, swipe widths) untouched; `npx tsc --noEmit` passes.</done>
</task>

<task type="auto">
  <name>Task 3: Add skeleton loading states to data-fetching screens</name>
  <files>src/screens/HomeScreen.tsx, src/screens/NotesScreen.tsx, src/screens/DayDetailScreen.tsx, src/components/Skeleton.tsx</files>
  <action>
    Add `isLoading` state plus skeleton placeholder rendering to the three screens that fetch data asynchronously with NO loading state today, addressing audit finding 2. Import `Skeleton` from `../components/Skeleton` in each screen.

    Common pattern (identical shape across all three screens):
    - Add `const [isLoading, setIsLoading] = useState(true);`
    - In the existing `loadData`/`loadEntries` function: set `isLoading` true at the start (before the try), set `isLoading(false)` in the `finally` block (or immediately after the state setters in the try and in the catch — but prefer finally so both paths clear it). Keep the existing `cancelled` flag guard: inside `finally`, guard with `if (cancelled) return;` before `setIsLoading(false)`.
    - Render: `{isLoading ? (skeleton) : (existing content)}` — skeleton must mirror the real layout's outer structure so no layout shift occurs when content replaces it.

    1. **HomeScreen.tsx** — replace the `<ScrollView contentContainerStyle={styles.listContent}>` block's content: when `isLoading`, render `<ScrollView contentContainerStyle={styles.listContent} scrollEnabled={false}>` containing:
       - Metrics row: `<View style={styles.metricsRow}>` with three `<Skeleton height={72} borderRadius={radius.lg} style={styles.metricCardSkeleton} />` (use `styles.metricCard` dims — metricCard is `flex: 1` in a row with `gap: spacing.md`, so width can be omitted; give each an explicit height matching the card).
       - Category chips: one row with ~5 `<Skeleton width={88} height={32} borderRadius={radius.full} />` separated by `gap: spacing.sm` (chip height = paddingVertical 8*2 + fontSize 14 ≈ 32).
       - Section header: `<Skeleton width={120} height={16} borderRadius={radius.sm} />`.
       - Entry cards: 4 skeleton cards, each `<View style={[styles.entryCard, { backgroundColor: colors.surface }, shadows.sm]}>` (mirror real card structure) containing an icon square `<Skeleton width={36} height={36} borderRadius={radius.sm} />`, a content column (`flex: 1, gap: spacing.sm`) with title `<Skeleton width="70%" height={14} />` and tag `<Skeleton width={56} height={18} borderRadius={radius.sm} />`, all wrapped in a row with `gap: spacing.sm`. Add `marginBottom: spacing.sm` between cards.
       - Add a `styles.metricCardSkeleton` style (`flex: 1`).
       - `import { Skeleton } from '../components/Skeleton';` and add `radius` to the existing `../theme` import if not present (already imported).

    2. **NotesScreen.tsx** — when `isLoading`, render `<FlatList>` (or plain ScrollView) with 5 day-card skeletons: each `<View style={[styles.dayCard, { backgroundColor: colors.surface }, shadows.sm]}>` (mirror real card: `marginHorizontal: spacing.xl, marginVertical: spacing.xs, borderRadius: radius.md, padding: spacing.md`) containing a header row (title `<Skeleton width={96} height={16} />` + count `<Skeleton width={48} height={12} />`) and a preview row (icon `<Skeleton width={24} height={24} borderRadius={radius.sm} />` + `flex: 1` column with two lines `<Skeleton width="80%" height={14} />` and `<Skeleton width="55%" height={12} />`). `scrollEnabled={false}`.

    3. **DayDetailScreen.tsx** — when `isLoading`, render `<ScrollView contentContainerStyle={styles.listContent} scrollEnabled={false}>` with 3-4 entry-card skeletons built exactly like the HomeScreen card skeleton (icon square 36x36 + title/tag lines), using this screen's `styles.entryCard` (`borderRadius: radius.md, padding: spacing.md, marginHorizontal: spacing.xl, marginVertical: spacing.xs`).

    Do NOT change SearchScreen (its `isSearching` state already shows a "Searching..." empty state with icon — acceptable, and search results populate from existing data) or WeeklySummaryScreen (its `loading` state shows an ActivityIndicator + message; the summary is AI-generated so its wait is legitimately longer — spinner is appropriate).

    Do NOT touch App.tsx, navigation, or any non-listed file. Do NOT alter the data-loading logic beyond adding the loading flag. Keep all skeleton styles inside the screen's existing `StyleSheet.create()` block or inline style arrays where theme-dependent.
  </action>
  <verify>
    npx tsc --noEmit passes
  </verify>
  <done>HomeScreen, NotesScreen, and DayDetailScreen each show a token-based skeleton layout while their async data loads (loading flag set in the load functions, cleared in finally) and render real content after; no layout structure changes to the loaded state; `npx tsc --noEmit` passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| N/A | UI-only change; no new data or network surface. Loading flags and skeleton rendering touch no user-controlled input. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-01 | Tampering | npm/pip/cargo installs | high | mitigate | No package installs in this plan — no new dependencies; zero risk surface. |
| T-02 | Denial of Service | Skeleton pulse animation | low | accept | Animated.loop with native driver runs only while skeletons render; screens unmount it on load completion (existing pattern in EmptyState/RecordButton). Leftover animation would be cosmetic, not harmful. |
</threat_model>

<verification>
- `npx tsc --noEmit` from repo root passes after all three tasks (strict mode — the only executable check available; no test runner configured in package.json).
- Grep gate: `grep -rn "Skeleton" src/screens/ | grep import` shows the three screens import Skeleton from `../components/Skeleton`; `src/components/Skeleton.tsx` contains an `Animated.loop` usage.
- Manual (user): open app on Android, observe skeleton pulse on Home/Notes/DayDetail during data load, then content replaces it; verify layout widths on a small screen (e.g. Mi 6) look consistent with the token-mapped styles.
</verification>

<success_criteria>
- [ ] `src/components/Skeleton.tsx` created: theme-aware, token-based, animated pulse, `npx tsc --noEmit` clean.
- [ ] Hardcoded spacing/borderRadius literals converted to `spacing.*`/`radius.*` in the six listed files; fixed-size elements untouched.
- [ ] HomeScreen, NotesScreen, DayDetailScreen show skeleton loading states during async fetch.
- [ ] No functional behavior changed, no new dependencies, all code changes left uncommitted for user review.
</success_criteria>

<output>
Create `.planning/quick/260805-krn-fix-github-issue-70-ui-ux-audit-findings/260805-krn-SUMMARY.md` when done. Do NOT git-commit code changes — the user reviews, commits, and pushes themselves.
</output>
