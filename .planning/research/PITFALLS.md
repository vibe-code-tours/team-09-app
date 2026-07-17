# Pitfalls Research

**Domain:** React Native note editor, bottom sheet overlay, empty states in Expo SDK 54
**Researched:** 2026-07-17
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Autosave Race Condition via Stale Closure

**What goes wrong:**
The `CreateNoteScreen` autosave (2s debounce) captures `title`, `content`, `category`, `isPinned` in the `scheduleAutosave` callback. When the user types rapidly, the setTimeout callback may execute with stale values from a previous render cycle. The current code at line 128 of `CreateNoteScreen.tsx` includes these values in the `useCallback` dependency array, which recreates the callback on every change -- but this causes the debounce timer to be cleared and restarted, losing intermediate saves entirely.

**Why it happens:**
React state updates asynchronously. The `useCallback` + `setTimeout` pattern creates a tension: either the callback is stable (stale closure risk) or it is recreated on every keystroke (timer reset, no actual debouncing). The current implementation falls into the second trap -- `scheduleAutosave` is recreated on every `[title, content, category, isPinned]` change, so the useEffect at line 131 clears and restarts the timer on every keystroke, meaning the 2s debounce never actually fires during continuous typing.

**Resolution (decided):**
Replace autosave with a manual "Save Changes" button in the edit page. This eliminates the debounce race condition entirely -- the user explicitly triggers save, so there is no stale closure or timer reset issue. The button should be prominent and clearly labeled.

**How to implement:**
1. Remove the `scheduleAutosave` function and its associated useEffect
2. Add a visible "Save Changes" button (primary style, matching design tokens)
3. Disable the button while saving to prevent double-taps
4. Show confirmation toast on successful save
5. Optionally add a dirty state indicator ("Unsaved changes") to prompt the user

**Warning signs:**
- Toast "Changes saved automatically" never appears during rapid typing
- Entries are saved with partial/old content
- Console shows multiple overlapping save attempts

**Phase to address:**
Phase 1 (Note Editor) -- replace autosave with manual save button.

---

### Pitfall 2: navigation.setParams() Race Condition in Autosave

**What goes wrong:**
After creating a new entry, `CreateNoteScreen` calls `navigation.setParams({ entryId: newEntryId })` at line 116. This triggers a navigation state update, which causes a re-render. If the user continues editing during this re-render, the autosave may fire with the old state (no `entryId`) and create a duplicate entry instead of updating the existing one.

**Why it happens:**
`setParams` is async from React's perspective -- the navigation state update propagates through React Navigation's internal state machine. Between the `setParams` call and the next render where `entryId` is available in route params, any autosave triggered will see `entryId` as `undefined` and execute the "create new" path.

**Resolution (decided):**
Use the same UI for both create and update flows. The CreateNoteScreen handles both cases -- when `entryId` is present it loads and updates, when absent it creates. With the manual save button (Pitfall 1 resolution), the setParams race is no longer a concern because save is user-triggered, not timer-triggered. The entry ID ref pattern is still recommended as a safety measure:

```typescript
const entryIdRef = useRef(entryId);
// After saveEntry returns newEntryId:
entryIdRef.current = newEntryId;
// Use entryIdRef.current for all subsequent save decisions
```

**Warning signs:**
- Duplicate entries appearing in the timeline
- Entry count increasing unexpectedly after editing
- Database has multiple entries with identical content and timestamps

**Phase to address:**
Phase 1 (Note Editor) -- use ref-based ID tracking alongside manual save.

---

### Pitfall 3: Audio.Sound Resource Leak on Screen Unmount

**What goes wrong:**
`AudioPlayer` creates an `Audio.Sound` instance via `Audio.Sound.createAsync()` in a useEffect. The cleanup calls `sound.unloadAsync()`, but if the component unmounts while the async load is still in progress, the `soundRef.current` is still `null` -- the loaded sound is assigned to a local variable that goes out of scope, and `unloadAsync()` is never called. This leaks native audio resources.

**Why it happens:**
The race condition is between the async `createAsync` resolving and the component unmounting. The `cancelled` flag at line 39 of `AudioPlayer.tsx` correctly prevents assigning to `soundRef` after unmount, but the loaded sound is only unloaded in the `else` branch (line 58). If the component unmounts AFTER `soundRef.current = sound` executes but BEFORE the cleanup runs, the cleanup reads `soundRef.current` which is valid -- but if the timing is slightly different (unmount during the `setIsLoading(true)` + `await createAsync` window), the local `sound` variable holds the reference and it is not cleaned up.

**Resolution (decided):**
Fix the AudioPlayer cleanup properly. The goal is to make it "as good as possible" -- eliminate the race condition and ensure no native resources leak.

**How to implement:**
1. Always unload in cleanup regardless of the `cancelled` flag
2. Track the loaded sound in a ref from the moment `createAsync` resolves
3. Add a status callback guard to prevent state updates after unmount

```typescript
const soundRef = useRef<Audio.Sound | null>(null);

useEffect(() => {
  let cancelled = false;
  const loadAudio = async () => {
    const { sound } = await Audio.Sound.createAsync(...);
    if (cancelled) {
      await sound.unloadAsync(); // Always clean up
      return;
    }
    soundRef.current = sound;
  };
  loadAudio();
  return () => {
    cancelled = true;
    soundRef.current?.unloadAsync();
    soundRef.current = null;
  };
}, [audioUri]);
```

**Warning signs:**
- "Cannot set property of undefined" errors after navigating away from a note with audio
- Increasing memory usage when navigating between notes with audio multiple times
- Audio playback continuing after leaving the screen

**Phase to address:**
Phase 1 (Note Editor) -- must be resolved before audio playback is considered stable.

---

### Pitfall 4: Markdown Rendering Performance with Large Content

**What goes wrong:**
When markdown rendering is enabled, long notes with thousands of characters create deeply nested `<Text>` components that are expensive to layout. The library parses the entire markdown string on every render, causing lag when switching between View and Edit modes.

**Why it happens:**
`react-native-markdown-display` converts markdown into a tree of React Native `<Text>` elements. Each heading, list item, code block, and inline format becomes a separate component. For a 5000-character note with multiple headings and lists, this can result in hundreds of nested Text components. React Native's text layout engine is single-threaded and must measure each text node synchronously.

**Resolution (decided):**
Remove markdown rendering for now. The View/Edit toggle can show plain text in both modes -- View mode renders the text as-is, Edit mode shows it in a TextInput. This eliminates the markdown library dependency and its performance concerns entirely. Markdown support can be added later as an optional enhancement if users request it.

**How to implement:**
1. Remove `react-native-markdown-display` import and `<Markdown>` component usage
2. View mode: render `content` as a plain `<Text>` element
3. Edit mode: render `content` in a `<TextInput>` (already implemented)
4. The View/Edit toggle remains for switching between read-only and editable states

**Warning signs:**
- N/A -- this pitfall is eliminated by removing the feature

**Phase to address:**
Phase 1 (Note Editor) -- remove markdown rendering dependency.

---

### Pitfall 5: Bottom Sheet Z-Index and Touch Passthrough

**What goes wrong:**
The current bottom sheet implementation in `App.tsx` (lines 114-188) uses `position: 'absolute'` with a backdrop overlay. On Android, there are known issues where touch events can "passthrough" the backdrop to the content underneath, especially when the sheet is animating. Additionally, the sheet's `maxHeight: SCREEN_HEIGHT * 0.5` is computed once at module load time via `Dimensions.get('window')` and does not update on rotation or split-screen.

**Why it happens:**
React Native's `Animated.View` with absolute positioning does not always intercept touch events reliably on Android, particularly during spring animations when the transform is being interpolated. The `TouchableOpacity` backdrop may not capture taps if the animation frame where the touch lands has not yet completed the opacity transition. The `Dimensions` API returns the value at import time and does not listen for changes (unlike `useWindowDimensions` hook).

**How to avoid:**
1. Replace `Dimensions.get('window')` with `useWindowDimensions()` hook to handle rotation and resize
2. Add `pointerEvents="box-none"` to the overlay container and `pointerEvents="auto"` to the backdrop to ensure touch interception
3. Consider using `react-native-gesture-handler`'s `GestureDetector` for more reliable touch handling if the custom sheet is retained
4. Test on multiple Android devices with different screen sizes and keyboard states

**Warning signs:**
- Tapping the backdrop does not close the sheet on some Android devices
- Sheet appears clipped or wrong size after rotating the device
- Touches on the sheet "leak" through to the tabs underneath

**Phase to address:**
Phase 2 (Bottom Sheet Menu) -- must be verified on physical Android devices during implementation.

---

### Pitfall 6: Empty State Animation Causing Layout Thrashing

**What goes wrong:**
The sketch 012 design calls for a pulse animation on the microphone illustration circle using CSS `@keyframes pulse` with `transform: scale()`. In the current React Native implementation, using `Animated.timing` with layout-affecting properties (width, height) and `useNativeDriver: true` will throw a warning and fall back to JS-thread animation, causing jank. The existing `EmptyState` component has no animation at all -- it is a static icon.

**Why it happens:**
React Native's `Animated` API with `useNativeDriver: true` only supports `opacity` and `transform` properties. Animating `width`, `height`, `top`, `left`, `margin`, or `padding` forces JS-thread execution, which blocks the main thread and causes frame drops. The pulse effect from the sketch uses `scale()` (which IS transform-compatible) but developers often mistakenly animate the container dimensions instead.

**How to avoid:**
1. Use `transform: [{ scale: animatedValue }]` with `useNativeDriver: true` for the pulse -- this runs on the UI thread
2. Never animate `width`/`height`/`padding` with `useNativeDriver: true`
3. If layout animation is needed (e.g., the empty state fading in and pushing content down), use `LayoutAnimation` or `react-native-reanimated`'s `useAnimatedStyle`
4. Keep the animation simple -- a single `scale` pulse on the icon is sufficient and performant

**Warning signs:**
- "useNativeDriver is not supported for animated property X" warning in console
- Visible jank/stuttering when the empty state appears
- Frame rate drops below 30fps on low-end Android devices during animation

**Phase to address:**
Phase 3 (Empty States) -- straightforward to avoid if the correct animation API is used from the start.

---

### Pitfall 7: Keyboard Avoiding View Conflict with Bottom Sheet

**What goes wrong:**
If the bottom sheet (Phase 2) is implemented with any text input (e.g., a future "quick note" option), the `KeyboardAvoidingView` used in `CreateNoteScreen` can conflict with the sheet's position. On Android with `softwareKeyboardLayoutMode: "adjustResize"`, the keyboard resize pushes the bottom sheet up while it is open, causing visual glitches. On iOS with `behavior="padding"`, the keyboard offset calculation may be incorrect when a modal overlay is active.

**Why it happens:**
`KeyboardAvoidingView` calculates keyboard height from the window, not from the nearest positioned ancestor. When a bottom sheet overlay is active (absolute positioned, full-screen), the keyboard offset applies to the wrong coordinate space. The `behavior` prop works differently on iOS vs Android -- iOS uses `UIKeyboardWillShow` notifications while Android relies on `windowSoftInputMode`.

**How to avoid:**
1. Disable `KeyboardAvoidingView` when the bottom sheet is open (pass `enabled` prop based on sheet state)
2. On Android, set `softwareKeyboardLayoutMode: "adjustResize"` in `app.json` and test that the sheet respects it
3. For the current bottom sheet (which has no text inputs), this is a non-issue -- but document it for future extensibility
4. If text inputs are added to the sheet later, use `@gorhom/bottom-sheet`'s `keyboardBehavior="interactive"` instead of `KeyboardAvoidingView`

**Warning signs:**
- Bottom sheet jumps or resizes when the keyboard appears
- Sheet content is pushed behind the keyboard with no way to scroll
- iOS shows a gap between the keyboard and the sheet

**Phase to address:**
Phase 2 (Bottom Sheet Menu) -- preventive measure, document for future text input additions.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `navigation.setParams()` to pass new entry ID back | Avoids adding a callback prop or context | Race condition with autosave, duplicate entries | Acceptable with manual save button + ref-based ID tracking |
| Hardcoding `SCREEN_HEIGHT` at module load | Simple sheet height calculation | Breaks on rotation, split-screen, foldables | Only in MVP if rotation is explicitly unsupported |
| Bottom sheet as Animated.View overlay (no gesture handler) | Zero dependencies, simple code | No swipe-to-dismiss, no keyboard integration, Android touch issues | Acceptable for 2-option sheet; must upgrade if options grow |
| EmptyState as static component (no animation) | Zero complexity | Does not match sketch design, feels lifeless | Never -- animation is a core design requirement from sketch 012 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| expo-av Audio.Sound | Not calling `unloadAsync()` on component unmount | Always unload in useEffect cleanup; use `isMounted` ref for async guards |
| React Navigation setParams | Using setParams to pass data that should be in React state | Use refs or context for data that changes frequently; reserve setParams for route metadata |
| SQLite via Drizzle ORM | Not handling concurrent writes from autosave + navigation | With manual save, concurrent writes are unlikely; but still guard with try-catch |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Audio.Sound instances not unloaded | Memory usage grows per navigation | Always unload in cleanup; track loaded sounds in refs | After 10-20 note navigations |
| Bottom sheet animation on JS thread | Visible jank during open/close on low-end Android | Use `useNativeDriver: true` for transform/opacity only | Any device with < 3GB RAM |
| Full entry list re-render on focus | HomeScreen re-fetches all entries on every focus | Cache entries in a ref; only re-fetch on mutation | > 100 entries in database |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Audio files stored in app's document directory without encryption | Voice recordings accessible via adb pull on rooted devices | Use `expo-file-system` secure directory or encrypt at rest for sensitive recordings |
| API keys in EXPO_PUBLIC_* environment variables | Keys bundled into the APK, extractable via decompilation | Use a backend proxy for API calls in production; EXPO_PUBLIC is acceptable for dev/prototype only |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback on save | User does not know if changes were saved | Show "Saving..." indicator and confirmation toast on manual save |
| Bottom sheet without swipe-to-dismiss | Feels unnatural on mobile, user must tap backdrop | Add gesture-based dismiss if the sheet grows beyond 2 options |
| Empty state without clear CTAs | User does not know what to do next | Always include action buttons, not just text (sketch 012 design addresses this) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Note Editor save:** With manual save button, verify it actually persists to database and shows confirmation
- [ ] **Note Editor entry creation vs update:** Verify the same UI handles both flows without creating duplicates
- [ ] **AudioPlayer cleanup:** Looks like it stops on unmount, but may leak if unmount happens during load -- verify by navigating in/out of notes with audio 20 times and monitoring memory
- [ ] **Bottom sheet dismiss:** Looks like tapping backdrop closes it, but Android touch passthrough may allow taps underneath -- verify on physical Android device with developer options "Show touches" enabled
- [ ] **Empty state animation:** Currently has NO animation -- the static EmptyState component does not match sketch 012 design requirements

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Audio.Sound memory leak | LOW | Force unload all sounds on screen blur/focus; add a global cleanup in the navigation focus listener |
| Bottom sheet touch passthrough | LOW | Add a timeout check after sheet close animation completes before allowing underlying touches |
| Empty state animation jank | LOW | Replace Animated with LayoutAnimation or react-native-reanimated; simple fix if caught early |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Autosave race condition | Phase 1 (Note Editor) | Manual save button works; no timer-based saves |
| navigation.setParams duplicate entries | Phase 1 (Note Editor) | Create note, save, edit, save again -- check DB for single entry |
| Audio.Sound memory leak | Phase 1 (Note Editor) | Navigate in/out of 20 notes with audio; monitor memory |
| Markdown rendering removed | Phase 1 (Note Editor) | No markdown library in bundle; View mode shows plain text |
| Bottom sheet z-index/touch | Phase 2 (Bottom Sheet) | Test on 3+ Android devices; verify backdrop tap dismisses |
| Keyboard avoidance conflict | Phase 2 (Bottom Sheet) | Open sheet while keyboard visible; verify no visual glitch |
| Empty state animation | Phase 3 (Empty States) | Verify pulse animation runs at 60fps on low-end device |
| Entry list re-render on focus | Phase 1 (Note Editor) | Add 50 entries; verify < 50ms focus-to-render time |

## Sources

- Codebase analysis: `CreateNoteScreen.tsx` (autosave pattern, setParams usage), `AudioPlayer.tsx` (sound lifecycle), `App.tsx` (bottom sheet implementation), `EmptyState.tsx` (static, no animation)
- Architecture documentation: `.planning/codebase/ARCHITECTURE.md` (anti-patterns section confirms recording state staleness and DB rebuild issues)
- Sketch findings: `.claude/skills/sketch-findings-mhat-tan/references/` (design requirements for all three features)
- React Native Animated API documentation: useNativeDriver limitations for layout properties
- expo-av documentation: Audio.Sound lifecycle and cleanup requirements
- React Navigation documentation: setParams behavior in nested navigators
- Community knowledge: Bottom sheet + keyboard avoidance patterns on Android/iOS

---
*Pitfalls research for: Note editor, bottom sheet menu, empty states*
*Researched: 2026-07-17*
