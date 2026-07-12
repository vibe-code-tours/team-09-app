---
marp: true
---

# မှတ်တမ်း
## Voice-first daily record for Burmese speakers — speak your day, AI organizes it
@heinthaw-dev · vibecode.tours

---

### The Problem
# Why it exists
- Typing Burmese on mobile is **slow and painful** — diaries, expense logs, and notes die within a week
- Speaking is effortless, but a folder of voice memos is a **graveyard nobody replays**
- Nobody has built this for Burmese, where the typing pain is worst and the need is highest

---

### Overview
# What it is
**Mhat Tan** is a voice-first daily record app for Burmese speakers:
- Press record, speak your day in Burmese
- AI transcribes it and files it into the right category
- Categories: **Money, Feelings, Work, Health, Ideas, Other**
- Your whole life is organized without typing a single word

---

### Story
# A real user
At 10 p.m. in Bangkok, **Ko Aung** lies down after a 12-hour shift.
He wants to note his day — lunch 60 baht, sent 5,000 baht home, felt homesick, an idea for a small side business — but typing Burmese on his phone is slow and painful, so like every other night, he skips it.
With Mhat Tan, he holds the record button and speaks for **40 seconds** in plain Burmese.

---

### Story (cont.)
# What happens next
Seconds later the text appears on screen, already sorted:
- The lunch and remittance under **Money**
- The homesick line under **Feelings**
- The side-business thought under **Ideas**
He fixes one wrong word and taps save.
At the end of the month, one chart shows him exactly where his baht went, and a timeline shows how his days really felt.

---

### Why Not
# Scope boundaries
- **Not an expense-only tracker.** Money is just one of six categories; the product is a whole-life log
- **No advice, judging, or insights in V1.** V1 only captures and organizes. AI advice is V2 — it only becomes smart after V1 has collected months of real data
- **No custom categories, no shortcut, no own STT model.** Six fixed categories only; recording starts from an in-app button and a home-screen widget

---

### Tech Spec
# Stack
**React Native** (Android first) · **ElevenLabs Scribe v2** · **Gemini API** · **Firebase** · **Google Play Billing**

---

### Tech Spec
# How it works
- **Capture** — In-app recorder + home-screen widget. Max 1 minute per entry
- **Transcription** — Audio sent to ElevenLabs Scribe v2 batch API (Burmese, $0.22/hr) with keyterm prompting
- **Categorization** — Transcript posted to Gemini returning {category, summary, items, mood, date}
- **Storage & display** — Firebase Auth + Firestore. Home screen = today's timeline; category list views; Money view adds monthly total + bar chart
- **Billing** — Google Play Billing subscription. Free: 3 recordings/day. Pro: unlimited

---

### Risks
# Challenges & mitigations
-
**Burmese transcription accuracy** — the #1 risk
→ Keyterm prompting, Gemini cleanup pass, edit-before-save flow, logging corrections for future fine-tuning
-
**API cost abuse**
→ Hard limits: 1 min/recording, 3 free/day, batch API
-
**Privacy — diaries and money data**
→ Encryption at rest, clear Burmese-language privacy policy, explicit opt-in consent

---

### V1 Scope
# Definition of Done
- [ ] Record a 1-minute Burmese entry, transcript within seconds
- [ ] Edit transcript before saving
- [ ] Gemini assigns correct category with ≥80% accuracy on 100-entry test set
- [ ] One-tap category override that persists
- [ ] Home timeline + category list views
- [ ] Expense screen with monthly total + top-5 chart
- [ ] Notes can be pinned / favourited
- [ ] Free limit (3/day) enforced
- [ ] Offline recording with auto-transcription on reconnect
- [ ] Tested with 10 real Burmese speakers; edit rate documented

---

# Thank You
## Mhat Tan — speak your day, AI organizes it
@heinthaw-dev