# Skills audit — what to add for a no-code design workflow

Goal: hand an **inexperienced dev** Claude Code + this repo and let them change
how the site looks by prompting — look at the result, tweak, repeat — with as
little direct code interaction as possible.

This repo already ships two purpose-built skills for that loop:

- **`preview-design-change`** — branch → change → push → live Vercel preview link.
  The backbone of the loop.
- **`generate-image-asset`** — on-brand watercolor art via Gemini, following
  `artwork-style.md`.

Below is the audit of the user's other (global) skills and which are worth
pulling into this repo to support the same loop. "Add" = copy/adapt into
`.claude/skills/` so it ships with the repo; "Use as-is" = already available
globally, just rely on it; "Skip" = irrelevant here.

## Recommended core set (add or lean on these)

| Skill | Verdict | Why it helps a non-coder design loop |
| ----- | ------- | ------------------------------------ |
| **`browser`** | **Add / rely on** | The "look at the output" half of the loop. Screenshot the Vercel preview (or local dev) and show it inline so the user sees the change without leaving the chat. Highest-value companion to `preview-design-change`. |
| **`frontend-design`** | **Rely on** | Raises design quality and steers away from generic "AI default" aesthetics. Good default lens whenever proposing visual changes. Already global; just invoke it. |
| **`generate-diff-html`** | **Add** | Shows a readable, highlighted view of *what changed* in plain terms — friendlier than a raw `git diff` for someone who doesn't read code. |
| **`review-changes`** | **Rely on** | Cheap guardrail before pushing: catches over-broad edits and scope creep. Keeps the inexperienced dev from shipping a mess. |
| **`oracle`** | **Rely on (escape hatch)** | When a change won't behave or the CSS fights back, escalate instead of flailing. Not part of the happy path, but the right pressure valve. |

## Nice-to-have (situational)

| Skill | Verdict | Why |
| ----- | ------- | --- |
| `web-perf` | Situational | Audit Core Web Vitals after big visual/art changes (watercolor WebP can get heavy). Run occasionally, not every loop. |
| `image-generator` (global) | Superseded here | Replaced by repo-local `generate-image-asset`, which wraps the same Gemini script + adds the brand guide. Keep the global one for non-repo work. |
| `create-new-skill` | Meta | Only when extending this very setup (e.g. adding a "swap a font" skill). Not for daily design work. |
| `team` | Overkill (usually) | Multi-worker orchestration is more than a solo design tweak needs. Reach for it only on a big multi-section redesign. |
| `goblins-copy` | Situational | If the user wants help writing the actual wedding copy (not just styling it). Tone may need adjusting from product-marketing to wedding-invitation. |

## Skip (not relevant to this repo)

`speak`, `read-aloud`, `calendar`, `linear`, `intercom`, `sentry`, `postgres` /
all `zero-*` / `drizzle` / database skills, `cloudflare*` / `wrangler` /
`durable-objects` / `workers-*`, `aws-cli`, `sst`, `devbox` / `open-devbox` /
`codespace`, `ralph`, and the various `*-zero-*` / curriculum / OKR skills — all
tied to other stacks or backends this static Vite site doesn't have.

## Suggested setup for the inexperienced dev

1. Start every visual request with **`preview-design-change`** — it owns the
   branch/commit/push/preview loop.
2. Pair it with **`browser`** to screenshot the preview and confirm the look.
3. For new or restyled art, call **`generate-image-asset`** (it reads
   `artwork-style.md` to stay on-brand).
4. Before merging to `main`, glance at **`review-changes`** and optionally
   **`generate-diff-html`**.
5. When stuck, **`oracle`**.

Everything else is out of scope for "make the wedding site look nicer."
