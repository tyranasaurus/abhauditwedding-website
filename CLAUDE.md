# abhauditwedding-website

A static wedding site built with Vite + React 19 + TypeScript. Styling is hand
written CSS in `src/index.css` (Tailwind 4 is imported only for `@theme` design
tokens and the base reset, not for utility classes in markup). One built bundle
is served on five paths via `vercel.json` rewrites: `/` (homepage), `/schedule`,
`/wardrobe`, `/seating-chart`, and `/registry`; `App.tsx` picks the view from
the path. `/wardrobe` is an alias for `/schedule` — the two pages merged, and
neither redirects, so links already handed out keep resolving. Adding a page means adding both the branch in `App.tsx` and the
rewrite in `vercel.json` — without the rewrite the URL 404s at Vercel's edge.
`MapPage.tsx` (venue map) is built but deliberately unrouted — there is no
`/map` rewrite, so that URL 404s until one is added.

## Typography

**Minimum font size is `text-sm` (0.875rem / 14px) — no exceptions, anywhere.**
Nothing renders smaller than this: not body copy, not blurbs, dates, times, helper
"cue" lines, captions, fine print, and not letter-spaced uppercase labels (kickers
and eyebrows) either. Never use `text-xs` (0.75rem). This applies to Tailwind
classes, raw `font-size` declarations, inline styles, and `px` values alike. For
`clamp()`, the minimum (first) argument is the floor that matters: keep it
`>= 0.875rem` (and never let the max fall below it). Quick audit:
`rg 'font-size:' src/index.css`.

## Build

- `npm run build` — production build (also the Vercel build command)
- `npm run dev` — local dev server
- `npm run typecheck` — `tsc -b`
- `npm run icons` — regenerate the favicons and the share card from
  `art-src/barn_wedding_logo.png`. Run it only when the artwork or the crop
  changes; the outputs are committed under `public/`.

## Art

Large originals live in `art-src/`, which is gitignored. Committed output is a
webp in `public/art/`. Add art the same way: convert, commit the webp, keep the
original in `art-src/`.

## Deploying

Vercel builds from `main`, so a push to `main` is a deploy to
<https://abhaudit.wedding>. Work on a branch and merge when it is ready to be
seen by guests.
