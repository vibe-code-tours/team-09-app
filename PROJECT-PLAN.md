# Mhat Tan (မှတ်တမ်း) — Detailed Project Plan

> Voice-first daily record for Burmese speakers — speak your day, AI organizes it.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Team & Roles](#team--roles)
3. [Tech Stack](#tech-stack)
4. [5-Day Sprint Plan](#5-day-sprint-plan)
5. [Day 1: Foundation](#day-1-foundation)
6. [Day 2: Recording](#day-2-recording)
7. [Day 3: AI Integration](#day-3-ai-integration)
8. [Day 4: Data & Views](#day-4-data--views)
9. [Day 5: Polish & Launch](#day-5-polish--launch)
10. [Folder Structure](#folder-structure)
11. [API Setup Guide](#api-setup-guide)
12. [Firebase Setup Guide](#firebase-setup-guide)
13. [Testing Checklist](#testing-checklist)
14. [Git Workflow](#git-workflow)

---

## Project Overview

### What is Mhat Tan?
Mhat Tan is a mobile app that lets Burmese speakers record their daily life by voice. The app:
- Records spoken Burmese (1 minute max)
- Transcribes speech to text using AI
- Automatically categorizes entries into 6 types
- Shows a timeline of your days
- Tracks money separately with charts

### The Problem We Solve
- Typing Burmese on mobile is **slow and difficult**
- Voice memos pile up and nobody listens to them
- No existing app does this for Burmese speakers

### Who Is Our User?
**Ko Aung** — a Burmese worker in Bangkok, 12-hour shifts, wants to记录 his day but typing is too painful. He speaks for 40 seconds and the app organizes everything.

---

## Team & Roles

### 3 Members — Weekly Rotation

| Role | Responsibility | This Week |
|------|---------------|-----------|
| **Anchor** | Manages the board, keeps main branch healthy, helps unblock teammates | Member A |
| **Driver** | Leads coding on complex features, pair programs | Member B |
| **Reviewer** | Reviews all PRs first, ensures code quality | Member C |

### How to Rotate
- **Monday morning**: Decide who is Anchor/Driver/Reviewer for the week
- **Anchor** checks: Is everyone unblocked? Are PRs merging smoothly?
- **Driver** takes the hardest task, pairs with someone if stuck
- **Reviewer** checks PRs within 4 hours of opening

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React Native (Expo) | Cross-platform, easy testing with Expo Go |
| **Language** | TypeScript | Type safety, fewer bugs |
| **Navigation** | React Navigation | Standard for React Native |
| **Recording** | expo-av | Built-in Expo audio recording |
| **Transcription** | ElevenLabs Scribe v2 | Best Burmese support, $0.22/hr |
| **AI Categorization** | Gemini API | Free tier, fast, good at categorization |
| **Database** | Cloud Firestore | Real-time sync, easy to use |
| **Auth** | Firebase Auth | Phone number login (easy for Myanmar) |
| **Charts** | react-native-chart-kit | Simple charts for Money view |
| **State** | React Context | Simple enough for this project |

### Why NOT a Separate Backend?
Firebase handles everything:
- **Authentication** → Firebase Auth
- **Database** → Cloud Firestore
- **API calls** → Made directly from the app (ElevenLabs, Gemini)

For a 5-day project, this is the fastest approach.

---

## 5-Day Sprint Plan

```
Day 1: Foundation      → Project setup, Firebase, Auth, basic UI
Day 2: Recording       → Audio capture, playback, recording UI
Day 3: AI Integration  → ElevenLabs transcription, Gemini categorization
Day 4: Data & Views    → Firestore storage, timeline, category views
Day 5: Polish & Launch → Money chart, free limit, testing, final touches
```

---

## Day 1: Foundation

### Goal
Project is running, user can log in, see the home screen.

### Tasks

#### Member A (Anchor)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up folder structure
- [ ] Install all dependencies
- [ ] Create `.env` file with placeholder API keys
- [ ] Set up Git repository and push to GitHub

#### Member B (Driver)
- [ ] Set up Firebase project (console.firebase.google.com)
- [ ] Enable Firebase Auth (Phone number method)
- [ ] Create Firestore database (test mode)
- [ ] Download `google-services.json` and `GoogleService-Info.plist`
- [ ] Install Firebase packages:
  ```bash
  npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
  ```

#### Member C (Reviewer)
- [ ] Set up React Navigation
- [ ] Create basic screen structure:
  - `HomeScreen.tsx` — today's timeline
  - `RecordScreen.tsx` — recording interface
  - `CategoriesScreen.tsx` — category list
  - `MoneyScreen.tsx` — expense view
  - `SettingsScreen.tsx` — app settings
- [ ] Create bottom tab navigation
- [ ] Style the navigation bar

### End of Day 1 Checklist
- [ ] App runs on Expo Go on iPhone
- [ ] Can navigate between all screens
- [ ] Firebase project created
- [ ] Git repo exists with initial commit

---

## Day 2: Recording

### Goal
User can record audio, play it back, and see the recording duration.

### Tasks

#### Member A (Anchor)
- [ ] Install expo-av:
  ```bash
  npx expo install expo-av
  ```
- [ ] Create `src/services/recording.ts`:
  ```typescript
  import { Audio } from 'expo-av';

  export const startRecording = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  };

  export const stopRecording = async (recording: Audio.Recording) => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    return uri;
  };
  ```
- [ ] Create recording timer (max 60 seconds)

#### Member B (Driver)
- [ ] Build `RecordScreen.tsx` UI:
  - Large circular record button (red when recording)
  - Timer display (0:00 / 1:00)
  - Playback button after recording
  - "Save" and "Discard" buttons
- [ ] Handle recording states:
  - Idle → Recording → Recorded → Saving

#### Member C (Reviewer)
- [ ] Create `src/hooks/useRecording.ts` custom hook
- [ ] Add haptic feedback when recording starts/stops
- [ ] Add recording animation (pulsing red circle)
- [ ] Test on real iPhone device

### End of Day 2 Checklist
- [ ] Can record audio for up to 60 seconds
- [ ] Can play back recording
- [ ] Timer shows correctly
- [ ] UI looks good on iPhone

---

## Day 3: AI Integration

### Goal
Recording is transcribed and automatically categorized.

### Tasks

#### Member A (Anchor)
- [ ] Set up ElevenLabs account:
  1. Go to elevenlabs.io
  2. Sign up (free tier available)
  3. Get API key from Profile → API Keys
  4. Add to `.env`: `ELEVENLABS_API_KEY=your_key`

- [ ] Create `src/services/transcription.ts`:
  ```typescript
  const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

  export const transcribeAudio = async (audioUri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model_id', 'scribe_v2');
    formData.append('language_code', 'my'); // Burmese

    const response = await fetch(`${ELEVENLABS_API}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    const result = await response.json();
    return result.text;
  };
  ```

#### Member B (Driver)
- [ ] Set up Gemini API:
  1. Go to aistudio.google.com
  2. Get API key
  3. Add to `.env`: `GEMINI_API_KEY=your_key`

- [ ] Create `src/services/categorization.ts`:
  ```typescript
  const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';

  export interface CategorizedEntry {
    category: 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other';
    summary: string;
    items: string[];
    mood: string;
    date: string;
  }

  export const categorizeEntry = async (transcript: string): Promise<CategorizedEntry> => {
    const prompt = `Categorize this Burmese diary entry into one of 6 categories:
    money, feelings, work, health, ideas, other.
    Return JSON with: category, summary (in English), items (array), mood, date.

    Entry: "${transcript}"`;

    const response = await fetch(
      `${GEMINI_API}/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  };
  ```

#### Member C (Reviewer)
- [ ] Create loading states for transcription
- [ ] Create error handling (network errors, API failures)
- [ ] Add "Transcribing..." animation
- [ ] Test with sample Burmese audio

### End of Day 3 Checklist
- [ ] Recording is transcribed to Burmese text
- [ ] Text is automatically categorized
- [ ] User can see category before saving
- [ ] Error handling works

---

## Day 4: Data & Views

### Goal
Entries are saved to Firestore, user can see timeline and categories.

### Tasks

#### Member A (Anchor)
- [ ] Create Firestore data model:
  ```
  users/
  └── {userId}/
      └── entries/
          └── {entryId}/
              ├── transcript: string
              ├── category: string
              ├── summary: string
              ├── items: array
              ├── mood: string
              ├── audioUrl: string
              ├── createdAt: timestamp
              └── isPinned: boolean
  ```

- [ ] Create `src/services/firestore.ts`:
  ```typescript
  import { db } from '../config/firebase';
  import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';

  export const saveEntry = async (userId: string, entry: any) => {
    await addDoc(collection(db, 'users', userId, 'entries'), {
      ...entry,
      createdAt: new Date(),
      isPinned: false,
    });
  };

  export const getEntries = async (userId: string) => {
    const q = query(
      collection(db, 'users', userId, 'entries'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };
  ```

#### Member B (Driver)
- [ ] Build `HomeScreen.tsx` (Today's Timeline):
  - Show today's entries in chronological order
  - Each entry shows: time, category icon, summary
  - Pull-to-refresh
  - Empty state: "Record your day!"

- [ ] Build `CategoriesScreen.tsx`:
  - 6 category buttons with icons:
    - 💰 Money
    - 😊 Feelings
    - 💼 Work
    - 🏥 Health
    - 💡 Ideas
    - 📝 Other
  - Tap category → show entries in that category

#### Member C (Reviewer)
- [ ] Build entry detail view
- [ ] Add pin/favorite functionality
- [ ] Add swipe-to-delete
- [ ] Handle empty states gracefully

### End of Day 4 Checklist
- [ ] Entries save to Firestore
- [ ] Timeline shows today's entries
- [ ] Categories filter entries correctly
- [ ] Data persists after app restart

---

## Day 5: Polish & Launch

### Goal
App is complete, tested, and ready to show.

### Tasks

#### Member A (Anchor)
- [ ] Build `MoneyScreen.tsx`:
  - Monthly total expenses
  - Bar chart of spending by day
  - List of money entries

- [ ] Implement free limit (3 recordings/day):
  ```typescript
  const checkFreeLimit = async (userId: string): Promise<boolean> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'users', userId, 'entries'),
      where('createdAt', '>=', today)
    );
    const snapshot = await getDocs(q);
    return snapshot.size < 3;
  };
  ```

#### Member B (Driver)
- [ ] Add offline support:
  - Queue recordings when offline
  - Auto-transcribe when back online
  - Show "Offline" indicator

- [ ] Polish UI:
  - Add app icon
  - Add splash screen
  - Smooth animations

#### Member C (Reviewer)
- [ ] Final testing on real iPhone:
  - [ ] Record and save entry
  - [ ] Transcription works
  - [ ] Categories correct
  - [ ] Timeline displays
  - [ ] Money chart shows
  - [ ] Free limit works
  - [ ] Offline mode works

- [ ] Create demo video or screenshots
- [ ] Write README.md

### End of Day 5 Checklist
- [ ] All features working
- [ ] Tested on real device
- [ ] No crashes
- [ ] Demo ready

---

## Folder Structure

```
mhat-tan/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── RecordButton.tsx
│   │   ├── EntryCard.tsx
│   │   ├── CategoryIcon.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── screens/              # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── RecordScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   ├── MoneyScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── services/             # API and external services
│   │   ├── firebase.ts
│   │   ├── transcription.ts  # ElevenLabs
│   │   ├── categorization.ts # Gemini
│   │   └── storage.ts        # Firestore
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useRecording.ts
│   │   └── useEntries.ts
│   │
│   ├── utils/                # Helper functions
│   │   ├── categories.ts
│   │   └── constants.ts
│   │
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   │
│   └── config/               # Configuration
│       └── firebase.ts
│
├── assets/                   # Images, icons, sounds
│   ├── icon.png
│   └── splash.png
│
├── android/                  # Android native code (auto-generated)
├── ios/                      # iOS native code (auto-generated)
│
├── .env                      # API keys (NEVER commit this!)
├── .env.example              # Template for .env
├── app.json                  # Expo configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## API Setup Guide

### ElevenLabs (Transcription)

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up for free account
3. Go to Profile → API Keys
4. Copy your API key
5. Free tier: 10,000 characters/month
6. Pricing: $0.22 per hour of audio

**Add to `.env`:**
```
ELEVENLABS_API_KEY=your_api_key_here
```

### Gemini (Categorization)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click "Get API key"
4. Copy your API key
5. Free tier: 60 requests/minute

**Add to `.env`:**
```
GEMINI_API_KEY=your_api_key_here
```

---

## Firebase Setup Guide

### Step-by-Step

1. **Create Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Click "Add project"
   - Name: `mhat-tan`
   - Disable Google Analytics (faster setup)
   - Click "Create project"

2. **Enable Authentication**
   - Left menu → Authentication → Get started
   - Sign-in method → Phone → Enable
   - Save

3. **Create Firestore Database**
   - Left menu → Firestore Database → Create database
   - Start in test mode
   - Choose location (asia-southeast1 for Myanmar)
   - Click "Enable"

4. **Add iOS App**
   - Project Overview → Add app → iOS
   - Bundle ID: `com.yourteam.mhat-tan`
   - Download `GoogleService-Info.plist`
   - Place in `ios/` folder (Expo handles this)

5. **Add Android App**
   - Project Overview → Add app → Android
   - Package name: `com.yourteam.mhat-tan`
   - Download `google-services.json`
   - Place in `android/app/` folder

6. **Install Firebase SDK**
   ```bash
   npx expo install @react-native-firebase/app
   npx expo install @react-native-firebase/auth
   npx expo install @react-native-firebase/firestore
   ```

---

## Testing Checklist

### Device Testing (iPhone with Expo Go)

- [ ] App installs and opens
- [ ] Login with phone number works
- [ ] Can record audio
- [ ] Recording stops at 60 seconds
- [ ] Playback works
- [ ] Transcription shows Burmese text
- [ ] Category is assigned correctly
- [ ] Entry saves to Firestore
- [ ] Timeline shows entries
- [ ] Categories filter works
- [ ] Money chart displays
- [ ] Free limit (3/day) enforced
- [ ] App works offline (queue)
- [ ] No crashes during normal use

### Edge Cases

- [ ] What happens with no internet?
- [ ] What happens with bad audio?
- [ ] What happens when storage is full?
- [ ] What happens with very short recordings (<1 sec)?

---

## Git Workflow

### Branch Naming
```
feat/recording-screen
feat/elevenlabs-integration
fix/timer-bug
chore/firebase-setup
```

### Daily Workflow
```bash
# Start of day
git checkout main
git pull

# Create feature branch
git checkout -b feat/your-feature

# Work on feature
# ... make changes ...

# Commit often
git add .
git commit -m "feat: add recording button UI"

# Push and create PR
git push origin feat/your-feature
# Go to GitHub → Create Pull Request

# Get 1 review from teammate
# Merge to main
```

### Rules
1. **Never push directly to main**
2. **Never merge your own PR**
3. **Keep PRs small** (< 300 lines)
4. **Pull main daily** to avoid conflicts
5. **Write clear commit messages**

---

## Communication

### Daily Standup (Async)
Post in your team chat every morning:
```
Yesterday: [what you did]
Today: [what you plan to do]
Blockers: [anything stopping you]
```

### When Stuck
1. Try to solve for 30 minutes
2. Ask in team chat
3. Pair with a teammate
4. Ask Anchor for help

---

## Success Criteria

### V1 is done when:
- [ ] Record 1-minute Burmese entry → transcript within seconds
- [ ] Edit transcript before saving
- [ ] Gemini assigns correct category (≥80% accuracy)
- [ ] Home timeline shows today's entries
- [ ] Category list views work
- [ ] Money view shows monthly total + chart
- [ ] Free limit (3/day) enforced
- [ ] Tested with 3 real users (your team!)

---

## Notes for Team

### Important Links
- Expo Docs: https://docs.expo.dev
- Firebase Docs: https://firebase.google.com/docs
- ElevenLabs API: https://elevenlabs.io/docs
- Gemini API: https://ai.google.dev/docs

### API Key Security
- **NEVER** commit `.env` file to Git
- Add `.env` to `.gitignore`
- Share API keys via secure channel (not chat)

### When Things Go Wrong
1. Check the error message carefully
2. Search Stack Overflow
3. Check if API key is correct
4. Check if you're online
5. Ask teammate for help

---

**Last updated:** 2026-07-12
**Project:** Mhat Tan (မှတ်တမ်း)
**Team:** 3 members
**Timeline:** 5 days
