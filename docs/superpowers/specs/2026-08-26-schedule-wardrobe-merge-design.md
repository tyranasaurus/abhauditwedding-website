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

So the page shows the low and high **across the event's own hours** — 53° / 67°
for a 3–10pm ceremony, rather than the day's 48° that happens at 4am — and
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

## Colour

Two roles per event, and the mapping is the same for every event:

- **primary** — the event name and the times
- **secondary** — the timeline bullets, the spine, the timeline labels, and the
  accented word of the dress-code caption

| event | primary | secondary |
|---|---|---|
| Sunset Shaadi | `#a6350c` sunset vermilion | `#a07903` sunflower, from the sky |
| Carnival | `#d94b6d` pink | `#755798` purple |
| Sangeet | `#28433a` deep forest | `#9e521a` copper |
| Seahawks | `#33486e` navy | `#4f7029` action green |

Captions: *Traditional* / **Elegance** · *Colors* **in** *Bloom* · *Glitz*
**and** *Glam* · *12th Man* **Spirit** — the bold word taking the secondary.
Carnival's "Colors" is blue `#3685ad`, a caption-only third note, because that
artwork is a full rainbow and one accent under-sells it.

**Every secondary is pitched against the large-text bar**, which is what it is
actually used at: 48px in the caption and 21.6px semibold in the labels, both of
which WCAG counts as large, so the threshold is 3:1 rather than 4.5:1. The
purple, copper and green sit near 5:1; the shaadi's sunflower is deliberately
brighter at 3.49:1, because pushing it to 5:1 turns it olive and it stops being
a sunflower at all. That is a colour-role decision, not a contrast
afterthought: the secondary has to carry timeline label text as well as
decoration, and the artwork's own tones are far too pale for that (sampled
straight from the images they sit at 1.2–2.2:1). An earlier pass gave labels
their own per-event colour chosen purely for legibility, which fixed contrast
but broke the system — three of the four events ended up mapping roles
differently. One secondary doing all three jobs is what keeps it consistent.

The note paragraph and the
date/forecast line stay global (`--copper-light`) and are never event-coloured,
so nothing carrying sustained reading load depends on an event's palette.

## Timeline typography

The time is the thing worth seeing, so it is 1.45rem bold in the primary, and the
meridiem is a single lowercase letter at 0.6em and 55% opacity — `3:30p`. It
disambiguates without competing. The full `3:30 PM` stays in `aria-label`, and the
letter itself is `aria-hidden`, so screen readers still hear the real time.

The time column is right-aligned: the carnival mixes one- and two-digit hours, so
this lines the meridiems up and tucks each time against its own label.

## Caption placement

The caption is sized **from the artwork, not the viewport**:
`calc(var(--art) * 0.125)`. It was `clamp(2.28rem, 4.08vw, 3rem)` while the
artwork is a fixed width, so it drifted between 10.7% and 14.1% of the image
depending on the window — largest, against an image that never grew, exactly at
full screen. It is now a constant 12.5% everywhere: 42.5 / 37.5 / 32.5px as
`--art` steps 340 / 300 / 260.

`--art` must stay a plain length because it feeds a `font-size` calc, where a
percentage resolves against the parent's font size rather than its width.
`min(300px, 100%)` there produced a 2px caption.

Overlap is one constant, `-0.465em`, plus an optional per-event `captionDrop`.
That second value is not a fudge: the paintings leave different amounts of ground
beneath their figures — 4.9% of image height on the sangeet against 1.4–2.8% on
the others — so a single overlap crowds the shoes on three of them. The sangeet
is the baseline at zero; the rest are pitched so all four captions sit within
~2px of their own subject's feet.

## Artwork

The three main watercolours were replaced with the background-removed masks from
the archived prototype repo (`Clean artwork alpha masks`, 2026-08-25), which had
never shipped. The old ones carried a hard arch edge with a white rim. Sources
live in `art-src/`; the committed webps are smaller than the files they replace.

**Every webp is trimmed to its painted extent**, so the layout box is the visible
edge. That deleted eight per-asset magic numbers — each image used to carry
`trimTop`/`trimBottom` percentages that negative-margined the box in to
compensate for a transparent band, and those percentages resolve against *width*
while the padding they corrected lived in *height*, so across four aspect ratios
they could never all be right. The caption's own `-0.465em` is now the only thing
setting the overlap, and it measures an identical 22.3px on all four.

Trimming also made the assets consistent with each other: the aspect ratios were
1.50 / 1.20 / 1.42 / 0.97 and are now 1.06 / 1.09 / 1.04 / 0.95, because the
padding was what made them differ.

When re-encoding, work from the shipped webp, not the source PNG. The Seahawks
source is an uncropped 2048x2048 square; re-deriving from it silently discards
the crop.

## Type scale

65.7 (event name) / 48 (caption) / 25.6 (time) / 21.6 (label) / 19.2 (date) /
17 (note), at a 1440 viewport. Steps of roughly 1.2. Two pairs used to collide —
times against labels at 7% apart, and the date landing exactly on the label —
so neither read as a step in a scale.

Vertical rhythm per event: 8px name-to-date, 51px date-to-body, 19px
body-to-note. The last two used to be within 5px of each other, which made the
note read as a third peer block rather than a coda closing the event.

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
