---
name: preview-design-change
description: Make a design change to the wedding site and ship it to a live Vercel preview the user can click. Use for any "change how it looks" request — colors, fonts, spacing, copy, layout, art swaps. Auto-creates a branch, commits, pushes, and surfaces the preview URL so a non-coder can prompt → look → repeat without touching code.
allowed-tools: Read, Edit, Write, Bash
---

# Preview a Design Change

This is the **design loop** for people who don't want to read code: describe a
change, the agent makes it, ships it to a real URL, and shows the result. Repeat
until it looks right.

The flow each time: **branch → change → preview → look → iterate**, then merge
when happy.

## When to use

Any visual/content request on the site: palette and fonts, spacing and layout,
section copy, swapping or regenerating art (pair with
[`generate-image-asset`](../generate-image-asset/SKILL.md)). Not for build/deploy
plumbing or data-model work.

## Where things live (so you edit the right file)

- **Look & feel:** `src/index.css` — hand-written CSS, all the colors/fonts/spacing.
  Design tokens are in the `@theme` block at the top.
- **Words / events / map data:** `src/data/*.ts` (`home.ts`, `events.ts`, `map.ts`).
- **Structure:** `src/components/*.tsx` (HomePage, Wardrobe, MapPage, EventPanel…).
- **Art:** `public/art/*.webp`, referenced as `/art/<name>.webp`.
- **Honor `CLAUDE.md`:** minimum font size is `text-sm` / `0.875rem` — never smaller.

## The loop

### 1. Branch (once per change idea)

If on `main`, cut a descriptive branch first — never commit design experiments to
`main`:

```bash
git checkout -b design/<short-slug>   # e.g. design/warmer-hero
```

If already on a `design/*` branch for this idea, stay on it.

### 2. Make the change

Edit the relevant file(s) above. Keep the diff small and focused on what was
asked. After editing, sanity-check it builds:

```bash
npm run typecheck && npm run build
```

Optionally preview locally first with `npm run dev` (faster than waiting on Vercel
for tiny tweaks).

### 3. Commit & push

```bash
git add -A
git commit -m "🎨 design: <what changed>"
git push -u origin HEAD
```

(Per repo convention, commit messages start with an emoji + type. This skill's
auto-commit step IS the explicit request to commit — no need to ask again.)

### 4. Surface the live preview

Vercel auto-builds a Preview for the push. Resolve and show the clickable URL:

```bash
.claude/skills/preview-design-change/preview-url.sh
```

It prints the preview URL once the build is green (and a stable branch-alias URL
immediately). The wedding site is password-gated past the splash — the preview is
too. Send the URL to the user so they can look on their phone.

> Tip: paste `<preview-url>/wardrobe` or `<preview-url>/map` to jump straight to
> those views.

### 5. Look, then iterate

Confirm the change looks right — either ask the user to open the link, or use the
`browser` skill to screenshot the preview and show it inline. If it needs
tweaking, go back to step 2 on the **same branch** (steps 1's branch already
exists). Each push refreshes the same preview URL.

### 6. Ship it

When the user is happy, merge to `main` (which deploys to production):

```bash
git checkout main && git merge --ff-only design/<short-slug> && git push
```

Or open a PR with `gh pr create` if they want a review step first. Don't merge to
`main` until the user signs off — `main` is live.

## Notes

- **Stay on-brand.** The site is old-world Indian wedding stationery; the art
  direction lives in `generate-image-asset/artwork-style.md`. Read it before
  changing colors or fonts.
- **One idea per branch.** Keeps previews and merges clean.
- **Don't touch `main` directly.** Always branch; only merge after sign-off.
- If `preview-url.sh` times out, the build may still be running — check
  https://vercel.com/arpit-ranasarias-projects/abhauditwedding.
