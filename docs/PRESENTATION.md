# Demo Presentation Script & Template — Mhat Tan (မှတ်တမ်း)

This template is adapted from `DEMO-VIDEO-GUIDE.md` for live and slide-based presentations. Use this document to script your presentation, assign speaking parts, and align the team on the demo flow.

- **Total Time Limit:** 6 minutes (hard cap).
- **Goal:** Showcase Mhat Tan's value proposition, a smooth end-to-end user flow, and the technical implementation.
- **Presenters:** Every team member should speak at least once (**Thet Naing Lin**, **Min Tay Za**, and **Ant Htoo Aung**).

---

## 1. Presentation Structure (6-Minute Breakdown)

| Time | Segment | Presenter(s) | Key Objective |
|------|---------|--------------|---------------|
| **0:00–0:05** | **Title Card** | Team | Introduce the app name and team. |
| **0:05–0:35** | **Hook** | *[Name]* | State the problem clearly: who hurts and why it matters. |
| **0:35–1:05** | **Solution** | *[Name]* | Present Mhat Tan as the solution and what it does in one breath. |
| **1:05–4:30** | **Live Demo** | *[Name(s)]* | Walk through the core flow live (record voice, transcribe, categorize, search). |
| **4:30–5:15** | **Tech Highlight** | *[Name]* | Highlight the hardest engineering challenge + AI collaboration. |
| **5:15–5:45** | **What's Next** | *[Name]* | Future roadmap for the real user. |
| **5:45–6:00** | **Outro** | Team | Final team closing. |

---

## 2. Script Template

Fill in this script with the exact words and clicks. Practice speaking it aloud to ensure it fits within the time limits.

### HOOK (30s)
*Goal: Frame the problem.*

> **Presenter:** `[Name]`  
> **Visuals:** `[Title slide or initial screen showing empty state]`

- **The Hook Sentence:** "Burmese speakers who want to keep daily journals or records often find typing in Burmese on mobile devices slow and tedious, especially on the go, which leads to abandoned journals and lost memories."
- **Why it matters:** "For busy users like Ko Aung—who works 12-hour shifts—typing out a daily log on a mobile keyboard is too painful. Keeping a record shouldn't feel like work; when capturing thoughts is hard, we stop doing it, losing track of our daily lives, expenses, and emotions."

---

### SOLUTION (30s)
*Goal: Introduce Mhat Tan.*

> **Presenter:** `[Name]`  
> **Visuals:** `[Slide showing high-level app features or app home screen]`

- **The Solution Sentence:** "So we built Mhat Tan (မှတ်တမ်း) — a voice-first daily record app that lets Burmese speakers speak their day in natural Burmese, and automatically transcribes, categorizes, and organizes it for them."
- **For:** "It's designed for busy individuals who want to track their daily activities, finances, feelings, and ideas entirely offline and hands-free."

---

### LIVE DEMO (3.5 minutes)
*Goal: Show the one key user flow. Run this from a live build (or direct emulator/device projection), NOT local mock data if possible.*

> **Presenter(s):** `[Name(s)]`  
> **Visuals:** `[Live screen share of the app]`

#### **Step 2.1: The First Tap & Recording**
- **Action:** Click the microphone button and record a sample Burmese voice entry (e.g., "ဒီနေ့ နေ့လည်စာအတွက် ၁၅၀၀၀ ကျပ် သုံးလိုက်တယ်" - "Spent 15,000 Kyats for lunch today").
- **Presenter says:** "Imagine our user, Min, just bought lunch. Instead of typing it out, they just tap the record button and say: *'ဒီနေ့ နေ့လည်စာအတွက် ၁၅၀၀၀ ကျပ် သုံးလိုက်တယ်'*..."
- **Viewer sees:** The recording screen with the animated microphone pulse, indicating recording is active.

#### **Step 2.2: The Payoff (Transcription & Auto-Categorization)**
- **Action:** Stop recording, wait for transcription and categorization, and view the new card.
- **Presenter says:** "Our app immediately sends the audio to ElevenLabs Scribe v2 for high-accuracy Burmese transcription. The text is then processed to extract the core category. As you can see, in seconds, the entry is saved as 'Money' with the transcribed text ready to read."
- **Viewer sees:** The entry appearing on the timeline, styled beautifully, tagged as **Money**, and showing a clean layout.

#### **Step 2.3: Organizing & Retrieving (Search & Filters)**
- **Action:** Tap the 'Money' category filter, then run a search query.
- **Presenter says:** "But Mhat Tan isn't just a list. We can filter our timeline to see only our spending. And with SQLite FTS5 integration, we can perform instant full-text search in Burmese. Let's search for *'နေ့လည်စာ'* (lunch) — and there it is."
- **Viewer sees:** Timeline filtering in real-time, then search results narrowing down instantly to the recorded entry.

---

### TECH HIGHLIGHT (45s)
*Goal: Share the engineering pride.*

> **Presenter:** `[Name]`  
> **Visuals:** `[Slide showing architecture diagram, Drizzle SQLite schema, or the CreateNoteScreen autosave debounce hook]`

- **Hardest engineering challenge:** Designing a local-first architecture with SQLite and Drizzle ORM that supports high-fidelity Burmese full-text search (FTS5), alongside the automated routing flow: recording voice (using `expo-av`), transcribing (using ElevenLabs Scribe v2), and auto-categorizing (using Gemini) into a unified JSON structure, all while maintaining a background autosave engine with a 2-second debounce to ensure no user data is lost.
- **AI Collaboration:** We paired with Gemini to draft our database schemas, design our Drizzle migrations, structure the structured JSON schema prompt for category extraction, and design the React Native spring-animated Bottom Sheet drawer in the navigation bar.

---

### WHAT'S NEXT (30s)
*Goal: Future vision.*

> **Presenter:** `[Name]`  
> **Visuals:** `[Slide with future features roadmap]`

- **Next steps for the user:**
  1. **Offline Queue & Sync:** Support queueing audio recordings and caching text logs locally when offline, automatically triggering NineLabs transcription and Gemini categorization once internet is restored.
  2. **Interactive Money Analytics:** Expand the `MoneyScreen` with interactive bar/line charts tracking budget limits, and generate weekly AI summaries of spending patterns.
  3. **Custom Categories & Tags:** Allow users to create custom categories and tags to organize their daily voice notes beyond the default six categories.

---

### OUTRO (15s)
*Goal: Say thank you and conclude.*

> **Presenter:** `All members`  
> **Visuals:** `[Final slide with team members' names/GitHub handles and project link]`

- **Team says:** "We are Team 09 — Thet Naing Lin, Min Tay Za, and Ant Htoo Aung. Thank you for watching Mhat Tan."

---

## 3. DOs and DON'Ts for Live / Slides Presentations

### DOs
*   ✅ **Demo from the deployed/live build** (or a clean release build on the device/emulator). Avoid using localhost if possible to demonstrate deployment stability.
*   ✅ **Clean up your screen:** Close all personal tabs, bookmarks, or background notifications. Use incognito or a clean browser profile.
*   ✅ **Zoom in the UI:** Make sure the font sizes on your app are readable on standard projector screens or video streams.
*   ✅ **Involve everyone:** Divide speaking sections evenly. Ensure smooth transitions between presenters (e.g., *"Now I'll hand over to Min Tay Za to show the tech highlight..."*).
*   ✅ **Time rehearsals:** Practice with a stopwatch. The 6-minute cap is strict.

### DON'Ts
*   ❌ **Don't show secrets:** Never expose API keys, `.env` files, or actual personal databases on screen.
*   ❌ **Don't improvise live clicks:** Follow the exact script steps. Ad-libbing can lead to bugs or time overruns.
*   ❌ **Don't spend too much time on slides:** Keep slides to a minimum (3-4 slides max). The live demo should be the star of the show.

---

## 4. Presentation Readiness Checklist

- [ ] Presentation scripted and roles assigned
- [ ] Deployed app / release build is fully functional (recording, transcribing, saving, searching)
- [ ] Sample voice input phrases pre-tested and reliable
- [ ] Visual assets and slides ready and proofread
- [ ] Screen sharing/device mirror environment tested
- [ ] Rehearsed at least twice with a timer (under 6:00)
