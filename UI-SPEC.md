# Mhat Tan (မှတ်တမ်း) — UI Design Specification

> Voice-first daily diary for Burmese speakers. Users speak their day (1 min max), AI transcribes and categorizes it, and the app shows a timeline.

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Voice-First** | Primary interaction is speaking; UI supports with minimal taps |
| **Warm & Personal** | Pink/rose primary palette, friendly emojis, casual tone |
| **Burmese-Friendly** | Large touch targets, clear icons, simple navigation |
| **Dark Mode Support** | Full light/dark theme with system preference detection |

---

## 2. Color System

### Light Theme
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E91E63` | Buttons, active states, accents |
| `primaryLight` | `#FCE4EC` | Light backgrounds, avatar bg |
| `primaryDark` | `#AD1457` | Pressed states |
| `accent` | `#FF6F00` | Highlights, pinned indicators |
| `bg` | `#F5F5F5` | Screen background |
| `surface` | `#FFFFFF` | Cards, tab bar |
| `surfaceAlt` | `#FAFAFA` | Alternative surfaces |
| `text` | `#212121` | Primary text |
| `textSecondary` | `#666666` | Secondary labels |
| `textMuted` | `#9E9E9E` | Timestamps, hints |
| `border` | `#F0F0F0` | Card borders, dividers |
| `danger` | `#F44336` | Delete, recording indicator |
| `success` | `#4CAF50` | Success states |

### Dark Theme
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#F06292` | Buttons, active states |
| `primaryLight` | `#3D2C3E` | Light backgrounds |
| `bg` | `#121212` | Screen background |
| `surface` | `#1E1E1E` | Cards, tab bar |
| `text` | `#FFFFFF` | Primary text |
| `textSecondary` | `#B0B0B0` | Secondary labels |
| `textMuted` | `#757575` | Timestamps, hints |
| `border` | `#333333` | Card borders |

---

## 3. Typography Scale

| Size | Weight | Usage |
|------|--------|-------|
| 24px | 700 | Header greeting |
| 16px | 600 | Section titles |
| 14px | 500-600 | Body text, chip labels |
| 12px | 400-500 | Timestamps, meta text |
| 11px | 500 | Tab labels |

---

## 4. Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps |
| `sm` | 8px | Small padding |
| `md` | 12px | Medium gaps |
| `lg` | 16px | Standard padding |
| `xl` | 20px | Section padding |
| `xxl` | 24px | Large gaps |
| `xxxl` | 32px | Extra large spacing |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small cards |
| `md` | 12px | Chips, inputs |
| `lg` | 16px | Cards |
| `xl` | 20px | Large cards, overlays |
| `full` | 9999px | Pills, circular buttons |

---

## 6. Shadow System

| Level | Elevation | Dark Mode Opacity | Usage |
|-------|-----------|-------------------|-------|
| `sm` | 1 | 0.3 | Cards, chips |
| `md` | 3 | 0.4 | Elevated cards |
| `lg` | 5 | 0.5 | Floating elements |
| `primary` | 6 | 0.3 (colored) | CTA buttons |

---

## 7. Categories

| Key | Icon | Label | Color |
|-----|------|-------|-------|
| `money` | 💰 | Money | `#4CAF50` |
| `feelings` | 😊 | Feelings | `#E91E63` |
| `work` | 💼 | Work | `#2196F3` |
| `health` | 🏥 | Health | `#FF9800` |
| `ideas` | 💡 | Ideas | `#9C27B0` |
| `other` | 📝 | Other | `#607D8B` |

---

## 8. Navigation Structure

### Bottom Tab Navigator (5 tabs)

```
┌─────────────────────────────────────────────────────┐
│  Home    Search    [●]    Money    Settings         │
│          (🔍)   (MIC)    (💰)     (⚙️)             │
│                    ▲                                 │
│                    │                                 │
│            Elevated Center Button                    │
└─────────────────────────────────────────────────────┘
```

**Tab Configuration:**
- **Home**: `home-outline` / `home` (focused)
- **Search**: `search-outline` / `search` (focused)
- **Record**: Center elevated button (triggers overlay, not navigation)
- **Money**: `wallet-outline` / `wallet` (focused)
- **Settings**: `settings-outline` / `settings` (focused)

### Stack Navigators

| Stack | Screens |
|-------|---------|
| `HomeStack` | `HomeMain` → `Record` |
| `MoneyStack` | `MoneyMain` → `ExpenseList` |
| `SettingsStack` | `SettingsMain` |

---

## 9. Screen Specifications

### 9.1 HomeScreen

**Layout:**
```
┌─────────────────────────────────────┐
│ 🌅 Good Morning                     │
│     Monday, July 14         [KA]    │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────────┐ ┌─────┐       │
│ │  3  │ │   12    │ │ 47  │       │
│ │Today│ │This Week│ │Total│       │
│ └─────┘ └─────────┘ └─────┘       │
├─────────────────────────────────────┤
│ Categories                          │
│ [📋 All] [💰 Money] [😊 Feelings]  │
├─────────────────────────────────────┤
│ Recent Entries              See all →│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 💰 Money        2h ago          │ │
│ │ Bought lunch at the market...   │ │
│ │ 😊 Content     ⭐ Pinned        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💼 Work         5h ago          │ │
│ │ Finished the database...        │ │
│ │ 💪 Productive                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Components:**
- **Header**: Greeting (time-based), date, avatar circle
- **Metric Cards**: 3 cards (Today, This Week, Total) — center card highlighted with primary color
- **Category Chips**: Horizontal scrollable, pill-shaped, selected state fills with category color
- **Entry Cards**: Left border (4px, category color), icon, label, timestamp, summary, mood, pinned badge

**Interactions:**
- Tap category chip → filter entries
- Tap entry card → navigate to detail (placeholder)
- "See all →" → show full history

---

### 9.2 ElevatedTabBar

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│        ┌─────────┐                  │
│        │    🎤   │ ← Elevated      │
│        │  Record │    64×64 circle  │
│        └─────────┘    Primary bg    │
│            Record                   │
│                                     │
│  🏠      🔍            💰     ⚙️   │
│  Home    Search         Money  Settings│
└─────────────────────────────────────┘
```

**Center Button Specs:**
- Size: 64×64px circle
- Border: 4px white
- Background: `primary` (or `danger` when recording)
- Shadow: `primary` level (elevation 6)
- Offset: -24px from tab bar top

---

### 9.3 RecordingOverlay

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│    ┌───────────────────────────┐    │
│    │ 🔴 Recording...    0:45  │    │
│    │                           │    │
│    │   ||| ||| ||| ||| |||     │    │
│    │                           │    │
│    │      (✕)      (⏹)        │    │
│    └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Position:** Bottom 120px, centered horizontally

**Components:**
- **Indicator**: Red dot + "Recording..." text + timer (M:SS)
- **Waveform**: 5 animated bars (static placeholder)
- **Buttons**: Cancel (gray circle) + Stop (red circle, 56px)

**Animation:**
- Fade in: 200ms
- Fade out: 150ms

---

### 9.4 RecordScreen (Full Screen)

**Triggered from:** HomeStack → Record

**Layout:**
```
┌─────────────────────────────────────┐
│ ← Back                   Save      │
├─────────────────────────────────────┤
│                                     │
│           🎤                        │
│        Recording...                 │
│           0:45                      │
│                                     │
│     ||| ||| ||| ||| |||             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Select Category:            │   │
│  │ [💰] [😊] [💼] [🏥] [💡] [📝]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ How are you feeling?        │   │
│  │ 😊 Content  💪 Productive   │   │
│  │ 🥰 Grateful 😫 Tired        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### 9.5 SearchScreen

**Layout:**
```
┌─────────────────────────────────────┐
│ 🔍 Search entries...                │
├─────────────────────────────────────┤
│ Recent Searches                     │
│ • lunch market                      │
│ • morning run                       │
├─────────────────────────────────────┤
│ Results                              │
│ ┌─────────────────────────────────┐ │
│ │ 💰 Money — 2h ago              │ │
│ │ Bought lunch at the market...   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 9.6 MoneyScreen

**Layout:**
```
┌─────────────────────────────────────┐
│ 💰 Money                            │
├─────────────────────────────────────┤
│ This Month                          │
│ ┌─────────────────────────────────┐ │
│ │ Total Spent:    45,000 kyat    │ │
│ │ Entries:        12             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ By Category                         │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ 🍜  │ │ 🚌  │ │ 🎁  │           │
│ │Food │ │Trans│ │Gifts│           │
│ │25k  │ │12k  │ │8k   │           │
│ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│ Recent Expenses            See all →│
│ ...                                 │
└─────────────────────────────────────┘
```

---

### 9.7 SettingsScreen

**Layout:**
```
┌─────────────────────────────────────┐
│ ⚙️ Settings                         │
├─────────────────────────────────────┤
│ Appearance                          │
│ ┌─────────────────────────────────┐ │
│ │ Theme          [Light ▾]       │ │
│ │ Language       [English ▾]     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Account                             │
│ ┌─────────────────────────────────┐ │
│ │ Profile                       → │ │
│ │ Notifications                → │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Data                                │
│ ┌─────────────────────────────────┐ │
│ │ Export                        → │ │
│ │ Clear Data                    → │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ About                               │
│ ┌─────────────────────────────────┐ │
│ │ Version         1.0.0          │ │
│ │ Privacy Policy               → │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 10. Component Inventory

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| `ElevatedTabBar` | `src/components/ElevatedTabBar.tsx` | Custom bottom tab with elevated center button |
| `RecordingOverlay` | `App.tsx` (inline) | Floating recording card |
| `EntryCard` | `src/components/EntryCard.tsx` | Entry display card (unused — see note) |
| `EmptyState` | `src/components/EmptyState.tsx` | Empty state placeholder |
| `RecordButton` | `src/components/RecordButton.tsx` | Recording trigger button |

### Screens

| Screen | File | Navigator |
|--------|------|-----------|
| `HomeScreen` | `src/screens/HomeScreen.tsx` | HomeStack |
| `RecordScreen` | `src/screens/RecordScreen.tsx` | HomeStack, Tab |
| `SearchScreen` | `src/screens/SearchScreen.tsx` | Tab |
| `MoneyScreen` | `src/screens/MoneyScreen.tsx` | MoneyStack |
| `ExpenseListScreen` | `src/screens/ExpenseListScreen.tsx` | MoneyStack |
| `SettingsScreen` | `src/screens/SettingsScreen.tsx` | SettingsStack |

---

## 11. Entry Data Model

```typescript
interface Entry {
  id: string;
  transcript: string;        // Burmese speech-to-text
  category: Category;        // money | feelings | work | health | ideas | other
  summary: string;           // AI-generated summary
  items: string[];           // Extracted items (for money entries)
  mood: string;              // Emoji + label (e.g., "😊 Content")
  audioUri: string;          // Local audio file path
  createdAt: Date;
  isPinned: boolean;
  userId: string;
}
```

---

## 12. Design Sketches Reference

Design sketches are located in `.planning/sketches/`:

| Sketch | Description | Implementation |
|--------|-------------|----------------|
| `001-C` | Center Tab Elevated | `ElevatedTabBar.tsx` |
| `002-A` | Entry Cards | `HomeScreen.tsx` inline |
| `003-A` | Category Chips | `HomeScreen.tsx` |
| `006` | Settings Screen | `SettingsScreen.tsx` |
| `009-A` | Search Integration | `SearchScreen.tsx` |

---

## 13. Implementation Notes

### Current State
- ✅ Theme system (light/dark) fully implemented
- ✅ Custom elevated tab bar
- ✅ HomeScreen with mock data
- ✅ Recording overlay animation
- ⚠️ `EntryCard.tsx` exists but HomeScreen renders cards inline (consolidation needed)
- ⚠️ `RecordScreen.tsx` hardcodes colors (not using theme)
- ❌ No Firebase auth integration yet
- ❌ Services implemented but not wired to screens

### Pending Work
1. Wire `useRecording` hook to RecordScreen
2. Connect transcription/categorization services
3. Implement Firestore data persistence
4. Add Firebase Authentication
5. Replace mock data with real entries

---

*Last updated: July 14, 2026*
*Branch: feature/project-restructure*
