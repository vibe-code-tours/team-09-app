# Mhat Tan (မှတ်တမ်း)

> Voice-first daily record for Burmese speakers — speak your day, AI organizes it.

![ci](../../actions/workflows/ci.yml/badge.svg) ![security](../../actions/workflows/security.yml/badge.svg)

<!-- A screenshot or GIF of the app goes here — it's the best README section. -->

---

## Quickstart

```bash
git clone https://github.com/vibe-code-tours/team-09-app.git && cd team-09-app
cp .env.example .env        # fill in real values LOCALLY — never commit .env
npm install && npx expo start  # press 'w' for web, 'i' for iOS, 'a' for Android
```

Keep this Quickstart working — it's how a new teammate onboards in 2 minutes.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | React Navigation 6 |
| Recording | expo-av |
| Transcription | ElevenLabs Scribe v2 |
| Categorization | Gemini 2.0 Flash |
| Database | Cloud Firestore |
| Auth | Firebase Auth |

## Project structure

| Path | What |
|---|---|
| `src/` | application code |
| `tests/` | tests |
| `docs/` | ARCHITECTURE.md + decision records |
| `.github/` | CI, security, PR/issue templates |

## Team

| Member | Role | Responsibility |
|--------|------|----------------|
| Member A | Anchor | UI Components + APIs |
| Member B | Driver | Screens + Types |
| Member C | Reviewer | Hooks + Config |

---

## What's already set up for you

This repo was created from the **Vibe Code Tours project starter**. It ships with:

| File | Gives you |
|---|---|
| `.github/workflows/ci.yml` | lint · typecheck · test · build on every PR (stays green until you add each script) |
| `.github/workflows/security.yml` | gitleaks (leaked keys) + semgrep (SAST) — advisory, report-only |
| `.github/dependabot.yml` | weekly PRs for vulnerable / outdated dependencies |
| `.env.example` | secret hygiene — copy to `.env`, never commit real keys |
| `.github/pull_request_template.md` · `ISSUE_TEMPLATE/` · `CODEOWNERS` | small reviewed PRs, one-owner issues |
| `docs/ARCHITECTURE.md` · `docs/decisions/` | a 1-page overview + lightweight ADRs |
| `working-agreement.md` | how your team works (GitHub Flow + rotating roles) |

**First thing to do:** follow [`SETUP.md`](./SETUP.md) — a ~1-hour checklist to turn it all on.

**Git rule:** branch → PR → 1 teammate review → merge. No push to `main`, no self-merge.

> A green pipeline ≠ secure. Scanners catch leaked keys, known-CVE deps, and injection
> patterns. They do **not** catch prompt-injection, over-scoped tokens, or hallucinated
> packages — a human still reviews for those.
