# Architecture — Team {{PROJECT_NAME}}

> One page. Keep it true as the project grows. A teammate should be able to read
> this and find their way around in 5 minutes.

## What it does
<!-- One paragraph: the product and the real user it serves. -->

## Diagram
<!-- Boxes and arrows. Text is fine. Example:

  [ Browser UI ] --> [ API / server ] --> [ Database ]
                          |
                          v
                   [ AI / LLM proxy ]
-->

```
[ frontend ] --> [ backend ] --> [ data ]
                     |
                     v
               [ AI / LLM proxy ]
```

## Where things live
| Path | What |
|---|---|
| `src/` (or `app/`) | application code |
| `tests/` | tests |
| `.github/workflows/` | CI + security |
| `docs/` | this file, demo script, decisions |

## External services
<!-- LLM proxy, DB, auth, hosting/deploy target, analytics. Which keys they need
     (names only — real values live in .env / GitHub Secrets). -->

## How to run
<!-- Point to the README Quickstart; don't duplicate it here. -->
See the [README](../README.md) Quickstart.
