<!--
  Vibe Code Tours — Project Starter
  A ready-to-build repo with CI, security scanning, and team practices baked in.
  Click "Use this template" → "Create a new repository" to start your project.
  Then replace THIS README with your project's own (keep the Quickstart working).
-->

# {{PROJECT_NAME}}

> One line: what you're building, and for which real user.

![ci](../../actions/workflows/ci.yml/badge.svg) ![security](../../actions/workflows/security.yml/badge.svg)

<!-- A screenshot or GIF of the app goes here — it's the best README section. -->

---

## Quickstart

```bash
git clone <your-repo-url> && cd <repo>
cp .env.example .env        # fill in real values LOCALLY — never commit .env
# then, for your stack:
npm install && npm run dev  # Node    (or)
# pip install -r requirements.txt && python -m app   # Python
```

Keep this Quickstart working — it's how a new teammate onboards in 2 minutes.

## Stack

<!-- Languages, frameworks, hosting/deploy target, AI/LLM provider. -->

## Project structure

| Path | What |
|---|---|
| `src/` (or `app/`) | application code |
| `tests/` | tests |
| `docs/` | ARCHITECTURE.md + decision records |
| `.github/` | CI, security, PR/issue templates |

## Team

<!-- Members + this week's roles (Anchor / Reviewer). Link your board. -->

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
