# Setup — ~1 hour, once per repo

Do these in order. Each is high-value, low-effort. Ordered so nothing blocks you early.
Delete this file (or keep it) once you're set up.

> **Repo visibility:** if you can, make this repo **public** — GitHub Actions is free &
> unlimited, and secret-scanning + CodeQL become free too. Private repos share a small
> monthly Actions bucket and pay for native scanning.

---

## 1. Run it locally (5 min)

```bash
cp .env.example .env      # fill in real values LOCALLY
# add real CI/deploy secrets in GitHub, not in code (step 4)
```

Fill in the README **Quickstart** so a teammate can clone → run in 2 minutes. If that
doesn't work, fix it first — everything else depends on people being able to run the app.

## 2. Turn on Dependabot (2 min) — free on every repo

GitHub → **Settings → Code security** → enable **Dependabot alerts** + **Dependabot
security updates**. The included `.github/dependabot.yml` then opens weekly dependency PRs.
Reviewing and merging those is the habit.

## 3. Turn on secret scanning (5 min)

GitHub → **Settings → Code security**:
- **Secret scanning** → Enable  (free on public repos)
- **Push protection** → Enable  — blocks a commit that contains a detected key **before**
  it lands. This is the single biggest protection for AI-generated code.

The included `security.yml` (gitleaks + semgrep) is the portable backup that also runs in CI.

## 4. Store real secrets in GitHub (5 min)

GitHub → **Settings → Secrets and variables → Actions**. Add API keys / tokens as
**secrets** (used in workflows as `${{ secrets.NAME }}`), config flags as **variables**.
Never `echo` a secret in a workflow. If a key ever leaks: **rotate it** (regenerate) — a
key in git history is compromised forever.

## 5. Protect `main` (10 min)

GitHub → **Settings → Rules → New ruleset** → target `main`:

| Rule | Set |
|---|---|
| Require a pull request before merging | ON |
| Require **1** approval (not the author) | ON |
| Require status checks to pass → add `ci` | ON |
| Block force pushes | ON |
| Dismiss stale approvals on new commits | ON |

Now "no direct push, no self-merge" is structural, not a promise.

> Tip: keep the `ci` check **not required** for the first few days so beginners aren't
> blocked, then flip it required once the team can reliably pass it.

## 6. Connect a deploy target for PR previews (10 min)

Connect **Netlify** or **Cloudflare Pages** to the repo. They build a **preview URL on
every PR** — click to see the change live. Let the platform deploy; don't hand-write deploy
jobs. (Avoid Vercel Hobby for team projects — its free tier forbids teams/commercial use.)

## 7. Activate the CI checks (as you build)

`ci.yml` stays green until you add the matching scripts. Add them when ready:

```jsonc
// package.json
"scripts": {
  "lint": "eslint .",       // turns on the Lint check
  "test": "vitest run",     // turns on the Test check
  "build": "vite build"     // turns on the Build check
}
```

(Python: add `ruff`, `pytest`, and a `requirements.txt` — `ci.yml` detects them.)

## 8. Set up the board + first issues (10 min)

Create a **GitHub Project** (board) with columns `Backlog → To Do → In Progress → In
Review → Done`. Every task = an **issue with exactly one assignee**, small enough for ~1
day. WIP limit ~1–2 cards per person.

## 9. Write the team basics (10 min)

- Fill [`working-agreement.md`](./working-agreement.md) (roles, review rules, standup).
- Fill `docs/ARCHITECTURE.md` (1 page + a diagram).
- Add a first ADR in `docs/decisions/` when you pick a framework / DB / AI model.
- Replace the CODEOWNERS placeholders with real `@usernames`.

---

## Definition of Done (put this on your board)

A task is **Done** when: code merged to `main` via a **reviewed PR** · CI green · linked
issue closed · no secrets committed · demoable / documented.

## The skip-list (don't do these on a short sprint)

Multi-repo splits · git-flow branches · signed commits · story points · LOC/commit
leaderboards · `matrix` CI · Windows/macOS runners · enforcing every scanner from day 1.
