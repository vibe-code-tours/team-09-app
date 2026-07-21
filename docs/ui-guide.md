# Mhat Tan — UI Guide

> How the UI is built, themed, and structured. A developer should be able to read
> this and build a new screen or component that fits the app perfectly.

---

## Table of Contents

1. [Theme System](#theme-system)
2. [Colors](#colors)
3. [Spacing & Radius](#spacing--radius)
4. [Shadows](#shadows)
5. [Categories](#categories)
6. [Component Patterns](#component-patterns)
7. [Recording Flow UI](#recording-flow-ui)
8. [Icons](#icons)
9. [Dark Mode](#dark-mode)
10. [Do's and Don'ts](#dos-and-donts)

---

## Theme System

All styling uses a centralized theme. Never hardcode colors or spacing values.

```tsx
import { useTheme } from '../theme/ThemeContext';
import { createShadows } from '../theme';

const MyComponent = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

### Available Theme Values

| Property | Description |
|----------|-------------|
| `theme.colors` | All color tokens (see below) |
| `theme.borderRadius` | Global border radius |
| `isDark` | Boolean for dark/light mode |

---

## Colors

Access via `theme.colors`:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | `#E91E63` | `#F48FB1` | Buttons, links, accents |
| `primaryLight` | `#FCE4EC` | `#F8BBD0` | Light backgrounds, badges |
| `primaryDark` | `#AD1457` | `#F06292` | Pressed states |
| `accent` | `#FF6F00` | `#FFB74D` | Secondary accent |
| `bg` | `#F5F5F5` | `#121212` | Screen background |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cards, modals |
| `surfaceAlt` | `#FAFAFA` | `#2A2A2A` | Alternate surfaces |
| `text` | `#212121` | `#E0E0E0` | Primary text |
| `textSecondary` | `#666666` | `#BDBDBD` | Secondary text |
| `textMuted` | `#9E9E9E` | `#757575` | Hints, labels |
| `border` | `#F0F0F0` | `#333333` | Borders, dividers |
| `divider` | `#EEEEEE` | `#2C2C2C` | Section dividers |
| `danger` | `#F44336` | `#EF5350` | Errors, delete |
| `success` | `#4CAF50` | `#66BB6A` | Success states |
| `successLight` | `#E8F5E9` | `#1B5E20` | Success backgrounds |
| `overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modal overlays |

---

## Spacing & Radius

### Spacing

```tsx
import { spacing } from '../theme';

spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 12
spacing.lg   // 16
spacing.xl   // 24
```

### Border Radius

```tsx
import { radius } from '../theme';

radius.sm     // 8
radius.md     // 12
radius.lg     // 16
radius.full   // 9999 (pill shape)
```

---

## Shadows

Always use `createShadows()` — it adapts to light/dark mode:

```tsx
import { createShadows } from '../theme';

const shadows = createShadows(isDark, colors.primary);

// Available sizes:
shadows.sm   // Subtle elevation
shadows.md   // Medium elevation (cards)
shadows.lg   // High elevation (modals, FABs)
```

---

## Categories

6 entry categories, each with an icon, label, and color:

| Key | Icon | Color | Label |
|-----|------|-------|-------|
| `money` | 💰 | `#4CAF50` | Money |
| `feelings` | 😊 | `#E91E63` | Feelings |
| `work` | 💼 | `#2196F3` | Work |
| `health` | 🏥 | `#FF9800` | Health |
| `ideas` | 💡 | `#9C27B0` | Ideas |
| `other` | 📝 | `#607D8B` | Other |

### Usage

```tsx
import { CATEGORIES, Category } from '../types';

const cat = CATEGORIES[category as Category];

<View style={{ backgroundColor: cat.color + '20' }}>
  <Text>{cat.icon} {cat.label}</Text>
</View>
```

---

## Component Patterns

### File Structure

```
src/
├── components/       # Reusable UI components
│   ├── ElevatedTabBar.tsx
│   ├── EntryCard.tsx
│   ├── EmptyState.tsx
│   └── RecordButton.tsx
├── screens/          # Full screen components
│   ├── HomeScreen.tsx
│   └── RecordScreen.tsx
├── hooks/            # Custom React hooks
│   └── useRecording.ts
├── services/         # API calls, storage
│   ├── transcription.ts
│   ├── categorization.ts
│   └── storage.ts
└── theme/            # Design tokens
    ├── index.ts
    └── ThemeContext.tsx
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | `EntryCard.tsx` |
| Hook file | camelCase + `use` | `useRecording.ts` |
| Service file | camelCase | `transcription.ts` |
| Type file | camelCase | `index.ts` |

### Component Template

```tsx
// MyComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { createShadows } from '../theme';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, shadows.md]}>
      <Text style={{ color: colors.text }}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
});
```

---

## Recording Flow UI

The recording flow has two entry points:

### 1. RecordScreen (Full Screen)

Navigation: `Home tab → Record (stack push)`

```
┌──────────────────────────────┐
│  ✕ Record Entry              │  ← Header with close button
├──────────────────────────────┤
│                              │
│         0:00                 │  ← Timer
│     Max 60 seconds           │  ← Status label
│                              │
│        [ ● ]                 │  ← Record button
│                              │
├──────────────────────────────┤  (after recording)
│         [ ▶ ]                │  ← Play/pause
│                              │
│    [ 😊 Feelings ]           │  ← Category badge
│                              │
│  ┌────────────────────────┐  │
│  │ Editable transcript... │  │  ← TextInput (scrollable)
│  └────────────────────────┘  │
│                              │
│   [ Discard ]  [ Save ]     │  ← Action buttons
└──────────────────────────────┘
```

### 2. RecordingOverlay (Floating Card)

Triggered by center tab button. Same recording logic, different presentation.

### Recording States

| State | UI Shows |
|-------|----------|
| `idle` | Record button, "Max 60 seconds" |
| `recording` | Pause + Stop buttons, "Recording..." |
| `recorded` | Play button, category badge, editable transcript, Save/Discard |
| `saving` | ActivityIndicator spinner, "Saving..." |

---

## Icons

Always use Ionicons from `@expo/vector-icons`:

```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="close" size={28} color={colors.text} />
<Ionicons name="play" size={32} color={colors.primary} />
<Ionicons name="pause" size={28} color={colors.primary} />
<Ionicons name="stop" size={28} color="#FFFFFF" />
```

### Common Icons

| Action | Icon Name |
|--------|-----------|
| Close/Cancel | `close` |
| Play | `play` |
| Pause | `pause` |
| Stop | `stop` |
| Delete/Trash | `trash` |
| Edit | `pencil` |
| Pin | `pin` |
| Search | `search` |
| Settings | `settings` |

---

## Dark Mode

The theme system handles dark mode automatically:

```tsx
const { theme, isDark } = useTheme();

// Colors auto-switch based on system setting
// Shadows adapt (lighter in dark mode)
// Create shadows with isDark flag
const shadows = createShadows(isDark, colors.primary);
```

### Switching Theme

The `ThemeContext` supports `light`, `dark`, and `system` modes:

```tsx
const { theme, isDark, setTheme } = useTheme();

setTheme('dark');   // Force dark
setTheme('light');  // Force light
setTheme('system'); // Follow system setting
```

---

## Do's and Don'ts

### ✅ Do

- Use `useTheme()` for all colors, spacing, shadows
- Use `createShadows(isDark, colors.primary)` for elevation
- Use `expo install` for new packages
- Use Ionicons for all icons
- Use `CATEGORIES[category]` for category styling
- Test on both iOS and Android
- Keep components small and focused

### ❌ Don't

- Don't hardcode colors (`#FFFFFF`, `#000000`, etc.)
- Don't hardcode spacing values (use `spacing` tokens)
- Don't use class components (use functional + hooks)
- Don't use `@react-native-firebase/*` (use Web JS SDK)
- Don't use Expo Go (use dev builds with SDK 54)
- Don't commit `.env`, `node_modules/`, or platform files
- Don't use `any` type (define proper interfaces)

---

## Quick Reference

```tsx
// Theme access
const { theme, isDark } = useTheme();
const { colors } = theme;

// Shadows
const shadows = createShadows(isDark, colors.primary);

// Category
import { CATEGORIES, Category } from '../types';
const cat = CATEGORIES[category as Category];

// Spacing
import { spacing, radius } from '../theme';
padding: spacing.md,    // 12
borderRadius: radius.md, // 12

// Icons
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="close" size={28} color={colors.text} />
```
