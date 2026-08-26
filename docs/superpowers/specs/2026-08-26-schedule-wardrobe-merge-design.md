# Schedule + Wardrobe merge

**Date:** 2026-08-26 · **Branch:** `schedule-wardrobe-merge`

## Problem

Event information lived in two places. The homepage `#schedule` list gave day,
time and title; `/wardrobe` gave the watercolour and the dress code. Neither
told a guest what actually happens during an event, and the two carried
overlapping copy (event name, vibe) that could drift apart.

## Decision

One page, `SchedulePage`, served on **both `/schedule` and `/wardrobe`**. Neither
redirects, so every `/wardrobe#anchor` link already handed out keeps resolving.
Anchors are unchanged: `#sunset-shaadi`, `#carnegie-to-carnation`,
`#naach-the-night-away`, `#seahawks-season-opener`.

Each event is a centred name and date, then a pair of columns sized to their own
content and centred as a unit — timeline left, artwork right with the dress code
set as an overlapping caption — then one note centred beneath the whole event.

Rejected along the way: a sticky day rail (removed — too much furniture for four
events), per-event standalone routes (anchors are enough), and keeping
`/wardrobe` as a separate page (the two duplicated too much).

## What changed

- `src/data/events.ts` — rebuilt around `WeddingEvent`. Gains `timeline`,
  `date` (no time; start times live in the timeline), `forecastWindow`,
  `venue`, `divider`, `artWidth`, `trimTop`/`trimBottom`. Drops `ethnic`,
  `western`, `label`, `rsvpUrl`, `vibeAccentIndexes`, `bonus`, and the `intro`
  block.
- `src/lib/use-forecast.ts` — new. Live weather, see below.
- `src/components/SchedulePage.tsx` — new; replaces `Wardrobe.tsx`.
- `src/components/EventPanel.tsx` — rewritten for the split layout.
- Deleted: `Wardrobe.tsx`, `Intro.tsx`, `lib/render-words.tsx` (no remaining
  callers once the per-word vibe accents went away).
- `App.tsx` routes `/schedule` and `/wardrobe`; `vercel.json` gains a
  `/schedule` rewrite. **Both are required** — without the rewrite the URL 404s
  at Vercel's edge.
- `SiteNav` drops Wardrobe; Schedule now points at `/schedule`.
- `src/data/home.ts` — schedule stops lead with **arrival** times (3:30 PM and
  4:45 PM, not 4:00 and 5:00) and link to `/schedule#…`; the watch-party RSVP
  form is removed; the weather Q&A is removed; a vegetarian-food Q&A is added;
  "What should I wear?" points at `/schedule`.

## Live forecast

Open-Meteo, no API key, CORS-friendly, ~16 days of range. Fetched in the
visitor's browser on each load, so there is nothing to rebuild or redeploy and
the numbers sharpen on their own as the wedding approaches. Repeat calls return
identical values — the figure only moves when the model re-runs, a few times a
day — so caching would buy nothing and would add a stale-value window.

**Hourly, across the hours each event actually runs**, not the daily summary.
Two reasons, both observed on real data for 5 September:

- The daily low happens around 4am. It said 48° for a ceremony that never drops
  below 58°, making the evening sound ten degrees colder than it will be.
- The daily condition code read "drizzle" off three afternoon hours whose
  precipitation probability was **4%** — a rain cloud on the wedding day for no
  reason.

So the page shows the temperature at the start and end of the window (which is
also the fact behind the "light layers" note: 3–10pm falls from 67° to 53°), and
surfaces a rain *probability* only at `RAIN_THRESHOLD` (25%) or above. Below
that the glyph is chosen from the sky codes alone, so a low-probability wet code
shows as the cloud cover it really is.

Windows live in `events.ts` as `forecastWindow: { date, from, to }` and only the
two outdoor events have one; the sangeet and the watch party are indoors.

A WMO code maps to an emoji plus words; the words go in `aria-label` (phrased
direction-neutrally, since the carnival warms while the ceremony cools) and the
emoji is `aria-hidden` so it is not read twice. Any failure — offline, blocked,
or dates outside the window — resolves to an empty map, and the date renders
bare with no stray separator. Attribution sits under the last event and only
appears when the fetch succeeded (the data is CC BY 4.0).

## Artwork

The three main watercolours were replaced with the background-removed masks from
the archived prototype repo (`Clean artwork alpha masks`, 2026-08-25), which had
never shipped. The old ones carried a hard arch edge with a white rim. Sources
live in `art-src/`; the committed webps are smaller than the files they replace.

Each webp keeps a transparent band above and below the painting — measured on
page at 19.3% below the shaadi, 15.1% below the reception, 9% below the
carnival. `trimTop`/`trimBottom` pull the image box in to the real edges so the
caption lands on the artwork. Percentage margins resolve against **width**, so
each value is the alpha padding scaled by the image's height/width ratio, then
nudged by eye. They are calibrated to give an 11 / 11 / 17 / 6 px overlap.

Because they are width-relative, **changing `artWidth` changes the overlap** —
widening the watch party from 320px to 420px moved its caption 6px and the
constant had to be corrected. Trimming the source art at conversion time would
let these constants go away entirely; worth doing when there is less time
pressure.

## Verified

`npm run typecheck`, `npx eslint src --max-warnings=0`, `npm run build` all
clean. Against a local preview: `/`, `/schedule`, `/wardrobe` all 200; the
`/wardrobe#naach-the-night-away` deep link lands with the panel exactly
`--nav-h` from the top; live forecast renders real values; no horizontal
overflow at 1440, 1024, 900, 820, 768, 600, 390 or 320px. The 320px case needed
a fix — the timeline's `max-content` label column could not shrink, so below
430px labels are allowed to wrap.

## Deliberately not done

- The homepage redesign (a single long scroll: landing → schedule → travel →
  Q&A) is the next piece of work. **`/schedule` then becomes a redirect to the
  homepage anchor** — deliberately not done yet, because redirecting before the
  homepage carries this content would send guests from the full page to a bare
  list with no artwork or dress codes.
- The homepage "Wardrobe Guide" explore card still says "Wardrobe Guide" and
  points at `/wardrobe`. It resolves via the alias, but the naming should be
  settled in the homepage pass.
- The old `.event-panel` / `.attire-*` CSS is now dead but left in place rather
  than risking a large deletion this close to the wedding.
- `/map` remains built and unrouted.
