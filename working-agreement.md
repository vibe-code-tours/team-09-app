# Working Agreement — {{PROJECT_NAME}}

> How this team works together. Agreed by all members. Sensible defaults — edit to fit,
> but keep each section answered.

## Communication
- Main channel: <!-- your team chat -->
- Async **standup** daily: post *yesterday / today / blockers*.
- Weekly **planning** (30–60 min) + a short **retro** each week.
- Expected response time on a mention: ~24h.

## Decisions
- Default: consensus. If stuck, the week's **Anchor** decides and records it as an ADR
  (`docs/decisions/`).
- Big choices (framework, DB, AI model, hosting) get a one-line ADR.

## Code & reviews
- **GitHub Flow:** branch off `main` (`feat/…` / `fix/…`) → PR → **1 review from a
  teammate (not the author)** → merge. **No direct push to `main`. No self-merge.**
- Keep PRs small (< ~300 lines). Open a **Draft PR** early.
- CI (`ci`) must be green. Never commit secrets or `.env`.
- Pull `main` daily to avoid merge conflicts.

## Roles (rotate weekly)
- **Anchor** — owns the board + `main` health + unblocking. (this week: ____)
- **Driver / Navigator** — pair on hard issues, swap who types.
- **Reviewer of the week** — first to review open PRs. (this week: ____)

## When someone is stuck or absent
- Say so early — being blocked is normal, staying silent is the problem.
- Pair with the Anchor or a teammate. Use `good-first-issue` labels for newer members.
- If a member goes quiet 3+ days, the Anchor checks in privately first.

---

_Signed (all members):_
-
