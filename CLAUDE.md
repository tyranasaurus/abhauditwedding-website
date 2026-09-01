# abhauditwedding-website

A static wedding site built with Vite + React 19 + TypeScript. Styling is hand
written CSS in `src/index.css` (Tailwind 4 is imported only for `@theme` design
tokens and the base reset, not for utility classes in markup). One built bundle
is served on several paths via `vercel.json` rewrites: `/` (homepage),
`/schedule`, `/wardrobe`, `/seating-chart`, `/registry`, `/now`, `/passport`,
`/map-view` (with `/grounds` as its old name), and `/map-editor`; `App.tsx`
picks the view from the path. `/wardrobe` is an alias for `/schedule` — the two pages merged, and
neither redirects, so links already handed out keep resolving. Adding a page means adding both the branch in `App.tsx` and the
rewrite in `vercel.json` — without the rewrite the URL 404s at Vercel's edge.
`MapPage.tsx` (the original venue map) is built but deliberately unrouted —
there is no `/map` rewrite, so that URL 404s until one is added.

## The venue map

`src/data/venue-map.json` is the single source of truth for everything drawn on
the grounds artwork (`public/art/map/grounds.webp`). Each event layer is four
independent lists — **regions** (arbitrary polygons), **paths**, **labels**,
**stickers** (which may check off a passport activity) — plus one **focus**
rectangle the guest view may never zoom out past. Nothing is implied from
anything else: a region's `name` only identifies it in the editor, words appear
on the map only where a label is placed, and a label can sit anywhere. All
geometry is a percentage of the artwork, so it survives the painting being
re-exported.

The focus rectangle is reference geometry, not content: it paints beneath every
drawn thing and takes no clicks unless the Focus tool is up, so it never blocks
selecting what is inside it.

A label's `size` is in **map units** (percent of the artwork's width), not
pixels, so it holds the same relationship to the ground it names on a phone as
on a desktop and at every zoom — lay it out once and it reads the same
everywhere. The one exception is the site's 14px minimum, applied after the
canvas zoom, which stops a label rendering as unreadable specks on very small
screens; a label sized comfortably (see `labelSizeFor`) never reaches it.

- `/map-editor` (`MapEditor.tsx`) edits that document. Every change lands in a
  localStorage draft immediately; **Save JSON** writes `venue-map.json`
  outright while `npm run dev` is running (via the dev-only endpoint in
  `vite.config.ts`) and falls back to downloading the file anywhere else.
- `EventMap.tsx` is the one guest-facing map surface. Inline, its frame is cut
  to the shape of the event's **own focus rectangle** (`--focus-ar`), so a
  guest sees the focused area and nothing spare; it shrinks with the viewport
  rather than cropping, and always keeps a `--map-gutter` margin from the
  screen edges. Derive the width from the height budget through that ratio —
  never cap it with `max-height`, which wins over `aspect-ratio` and silently
  letterboxes the focus instead of scaling it. Both `/map-view` and
  `/now` render it, so there is a single pan/zoom feel, a single expand
  animation, and one set of interactive stickers rather than a separate map per
  page. A sticker carrying an `activity` is tappable and stamps the carnival
  passport (shared state via `useCarnivalStamps`, so a tap on the map and a tap
  on the passport light each other). The passport lists its activities in the
  order a guest walking the lawn meets them — a clockwise circuit from the
  top-left — computed from where the stickers sit in `venue-map.json`, so
  moving a stall in the editor reorders the checklist to match. The focus
  rect **limits the view; it never crops the painting** — the whole artwork is
  always drawn, and whatever falls outside the focus but inside the viewport is
  painted like everything else. Two rules, the second outranking the first:
  (1) the furthest anyone can zoom out is the zoom at which the whole focus is
  on screen, and panning is held inside it; (2) **no whitespace, ever** — the
  artwork covers the viewport at every zoom and pan, so a focus near the
  painting's edge pulls flush with that edge and stops. Expanding takes the map
  fullscreen and, on a portrait phone, turns it a quarter turn so the landscape
  painting fills the long side — the web cannot ask a device to rotate, so the
  map rotates. The zoom buttons glide rather than jump, and are hidden below
  760px where pinch, double-tap and drag are the real controls.
- `/map-view` (`MapView.tsx`) is the chooser around `EventMap`: pick an event,
  see its layer.
- Both the guest map and the editor share the pan/zoom engine in
  `useMapViewport.ts`. **The view is a ref, and React state only trails it**: a
  pinch or a drag changes nothing about what the map contains, so every gesture
  writes the transform straight onto the canvas element and the state mirror
  catches up once the movement stops. Pushing each event through `setState` is
  what made zooming feel like it was chasing the finger. `canvasStyle` is built
  from the ref for the same reason, so a render landing mid-gesture paints
  where the map actually is., which also carries the
  guest's zoom across a stage resize in *relative* terms, so going fullscreen
  shows the same ground rather than the same pixels.

The grounds artwork is painted from an aerial captured at a heading of 224°, so
north is not up; `grounds` in `src/data/map.ts` carries the heading and the
136° compass rotation that follows from it.

`CarnivalMap.tsx` and `NowMapEditor.tsx` are no longer rendered anywhere —
`/now` shows `EventMap` for the active event, and `/map-editor` supersedes both
of their editors. The files and `carnival-lawn-base.webp` are still in the tree
but are dead code; the carnival's stall layout now lives in `venue-map.json`
like everything else. The `highlights` and `route` fields in `active-events.ts`
are likewise unread. Delete them when you are confident the new map has
replaced them for good.

Note the carnival's stall art is 512px per sticker while its footprint on the
map is a few dozen CSS pixels, so it only looks as good as the browser's
rasterization allows: do not put `will-change: transform` on `.mv-canvas`. That
pins the layer's raster at the canvas's layout size and lets the GPU stretch
it, which drew every 512px sticker from a ~22px bitmap.

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
