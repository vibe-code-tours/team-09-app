# Stack Research

**Domain:** Note editor, bottom sheet menu, and empty states for Expo SDK 54 React Native app
**Researched:** 2026-07-17
**Confidence:** HIGH (npm registry + existing codebase analysis)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `react-native-markdown-display` | 7.0.2 | Markdown rendering in View mode | Already installed and working in CreateNoteScreen. Uses markdown-it under the hood, lightweight, no native deps. No upgrade needed. |
| `@gorhom/bottom-sheet` | 5.2.14 | Bottom sheet creation menu | De facto standard for RN bottom sheets. 15k+ GitHub stars, actively maintained, native spring animations via Reanimated. Required for sketch 011 slide-up menu. |
| `@simform_solutions/react-native-audio-waveform` | 2.1.6 | Audio waveform visualization | Most popular RN waveform library. Shows live recording waveform and playback waveform. No peer deps beyond React/RN. Works with expo-av audio data. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-reanimated` | ~4.1.1 (Expo bundled) | Animations for bottom sheet | Required by @gorhom/bottom-sheet. Already bundled with Expo SDK 54 -- just needs `npx expo install`. |
| `react-native-gesture-handler` | ~2.28.0 (Expo bundled) | Gesture handling for bottom sheet | Required by @gorhom/bottom-sheet. Already bundled with Expo SDK 54 -- just needs `npx expo install`. |
| `react-native-webview` | latest compatible | Required by @10play/tentap-editor IF rich text editing is needed | Only needed if switching from TextInput to WebView-based editor. Current TextInput approach works fine for markdown. |

### What Already Works (No Changes Needed)

| Component | Status | Notes |
|-----------|--------|-------|
| `react-native-markdown-display` | Installed (7.0.2) | Already used in CreateNoteScreen with styled markdown rendering |
| `AudioPlayer` component | Implemented | Play/pause, progress bar, time display. Needs waveform enhancement. |
| `TextInput` editing | Working | Markdown editing via plain TextInput. Adequate for markdown content. |
| View/Edit toggle | Implemented | CreateNoteScreen already switches between markdown view and TextInput edit |

## Installation

```bash
# Bottom sheet (new dependencies)
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler

# Audio waveform (new dependency)
npm install @simform_solutions/react-native-audio-waveform

# No install needed -- already present
# react-native-markdown-display@7.0.2
# expo-av@16.0.8
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@gorhom/bottom-sheet` | `react-native-modal` (v14 RC) | If you want zero additional native deps and can accept a simpler animation. Modal is a plain overlay without snap points. |
| `@gorhom/bottom-sheet` | Custom `Modal` + `Animated.View` | If the bottom sheet is truly minimal (2 buttons, no scrollable content). The sketch spec calls for a polished slide-up, so gorhom is worth the deps. |
| `@simform_solutions/react-native-audio-waveform` | Custom `expo-av` + `Animated` bars | If you need zero extra deps and can build a simple bar visualization yourself. Simform library gives production-ready waveform out of the box. |
| `TextInput` (current) | `@10play/tentap-editor` | Only if you need WYSIWYG rich text editing with formatting toolbar. Markdown-in-TextInput is simpler and already working. |
| `react-native-markdown-display` | `react-native-simple-markdown` | Only if you need more control over markdown parsing. The current library covers headings, bold, italic, code blocks, lists -- everything the sketch needs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-native-pell-rich-editor` | WebView-based, slow updates, known issues with newer RN versions. Tentap is its actively maintained fork. | `@10play/tentap-editor` IF you need rich text (you probably don't) |
| `react-native-audio-waveform` (without scope) | Does not exist on npm registry (404). Common confusion with simform's package. | `@simform_solutions/react-native-audio-waveform` |
| `expo-modules-core` bottom sheet | Not a real bottom sheet solution. Expo does not ship a bottom sheet module. | `@gorhom/bottom-sheet` |
| `react-native-reanimated` v4.5.x | Latest release requires RN 0.83+ and `react-native-worklets`. Expo SDK 54 ships RN 0.81.5 and bundles reanimated ~4.1.1. | Use the Expo-bundled version (~4.1.1) via `npx expo install` |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@gorhom/bottom-sheet@5.2.14` | `react-native-reanimated >=3.16.0 \|\| >=4.0.0-` | Expo SDK 54 bundles 4.1.1 -- satisfies this |
| `@gorhom/bottom-sheet@5.2.14` | `react-native-gesture-handler >=2.16.1` | Expo SDK 54 bundles ~2.28.0 -- satisfies this |
| `@simform_solutions/react-native-audio-waveform@2.1.6` | `react: *`, `react-native: *` | No version constraints -- universal compat |
| `react-native-markdown-display@7.0.2` | `react >=16.2.0`, `react-native >=0.50.4` | Very permissive -- works with anything |
| `react-native-reanimated@4.1.1` | `react-native-worklets >=0.5.0` | Expo SDK 54 handles this transitively |

## Key Decision: Bottom Sheet vs Modal

The sketch (011) specifies a bottom sheet creation menu that slides up from the center FAB. Two viable approaches:

**Option A: `@gorhom/bottom-sheet` (recommended)**
- Native spring physics, snap points, gesture-driven dismissal
- Adds 2 native dependencies (reanimated, gesture handler) but both are already Expo-bundled
- Handles scroll prevention, backdrop, and keyboard avoidance automatically
- Standard pattern used by Instagram, Notion, and most polished RN apps

**Option B: Custom `Modal` + `Animated.View`**
- Zero additional dependencies
- Must implement spring animation, backdrop, dismiss gesture manually
- Adequate for a simple 2-option sheet but harder to extend
- More code to maintain and test

**Recommendation:** Option A. The reanimated and gesture handler deps are already bundled by Expo SDK 54 -- they just need to be installed. The gorhom bottom sheet gives production-quality behavior for free.

## Key Decision: Waveform vs Simple Progress Bar

The existing `AudioPlayer` component shows a play/pause button with a progress bar. The sketch (010) calls for a waveform-style player.

**Option A: `@simform_solutions/react-native-audio-waveform` (recommended)**
- Pre-built waveform visualization with playback integration
- Customizable colors, bar width, spacing
- Works with audio URIs from expo-av
- Drop-in replacement for the progress bar section

**Option B: Keep existing progress bar**
- Zero additional deps
- Already working and tested
- Simpler, less visual flair

**Recommendation:** Option A for the Note Editor (sketch 010) full player. Keep the existing compact progress bar for HomeScreen entry cards (it's already appropriate for card-sized UI).

## Sources

- npm registry queries (direct, HIGH confidence): package versions, peer dependencies, compatibility
- `node_modules/expo/bundledNativeModules.json` (direct, HIGH confidence): Expo SDK 54 bundled versions
- Existing codebase: `CreateNoteScreen.tsx`, `AudioPlayer.tsx`, `ElevatedTabBar.tsx` (direct, HIGH confidence)
- `@gorhom/bottom-sheet` GitHub: 15k+ stars, v5.x line, Reanimated 3/4 support (MEDIUM confidence, training data)
- `@simform_solutions/react-native-audio-waveform` npm: v2.1.6, 2.1k+ weekly downloads (MEDIUM confidence, npm registry)

---
*Stack research for: Note editor, bottom sheet menu, empty states (sketches 010, 011, 012)*
*Researched: 2026-07-17*
