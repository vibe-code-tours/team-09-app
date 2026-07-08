# 1. Record architecture decisions

- Status: accepted
- Date: {{DATE}}

## Context

We make choices during the build — framework, database, auth, which AI model,
hosting. Six months later nobody remembers *why*. A one-file-per-decision log keeps
the reasoning next to the code so it diffs like code.

## Decision

We record each meaningful decision as a short markdown file in `docs/decisions/`,
numbered `0002-...`, `0003-...`. Use this one-line shape (a "Y-statement"):

> In the context of **\<situation\>**, facing **\<concern\>**, we chose **\<option\>**
> to achieve **\<benefit\>**, accepting **\<tradeoff\>**.

Five lines beats a page nobody writes. Add one when you pick a framework, DB, auth,
AI model, or hosting target.

## Consequences

New teammates (and graders) can see the reasoning. Reversing a decision = a new ADR
that supersedes the old one — don't edit history, add to it.
