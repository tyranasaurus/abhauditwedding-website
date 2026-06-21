# abhauditwedding-website

A static wedding site built with Vite + React 19 + TypeScript. Styling is hand
written CSS in `src/index.css` (Tailwind 4 is imported only for `@theme` design
tokens and the base reset, not for utility classes in markup). One built bundle
is served on three paths via `vercel.json` rewrites: `/` (homepage), `/wardrobe`
(attire guide), and `/map` (venue map); `App.tsx` picks the view from the path.

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
