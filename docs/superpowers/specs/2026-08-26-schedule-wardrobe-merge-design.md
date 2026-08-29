# Schedule + Wardrobe merge, and the fold into the homepage

**Date:** 2026-08-26 · **Branch:** `schedule-wardrobe-merge`

Two passes, in order. The first merged `/schedule` and `/wardrobe` into one
page. The second folded that page into the homepage and gave the whole site an
arch. Sections below marked **(pass 2)** supersede what pass 1 says.

## Problem

Event information lived in two places. The homepage `#schedule` list gave day,
time and title; `/wardrobe` gave the watercolour and the dress code. Neither
told a guest what actually happens during an event, and the two carried
overlapping copy (event name, vibe) that could drift apart.

## Decision

One page, served on **both `/schedule` and `/wardrobe`** — and, after pass 2,
folded into the homepage with both old paths redirecting to it. Every
`/wardrobe#anchor` link already handed out still resolves. Anchors are
unchanged: `#sunset-shaadi`, `#carnegie-to-carnation`,
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

A WMO code maps to a `SkyKind` — one value that both picks the drawing and reads
out in `aria-label` (phrased direction-neutrally, since the carnival warms while
the ceremony cools). The drawing is `aria-hidden` so it is not read twice.
**(pass 2)** it is line art in `currentColor`, not an emoji: the emoji were the
only glossy raster artwork on a hand-painted page and took their colour from
whichever font the device shipped. One cloud is drawn at three sizes and reused
across the nine conditions; the two sun-and-cloud glyphs fill the cloud with
`--paper` so the sun reads as behind it. Any failure — offline, blocked,
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

## Pass 2 — one long page

The site is now a single scroll: hero → `#schedule` (the four events, in full) →
`#travel` → `#faq` → footer. Nothing links away except `/registry`.

**Routing.** `/schedule` and `/wardrobe` redirect to `/#anchor` from an inline
script in `index.html` `<head>`, before the module script and before anything
paints. A Vercel `redirects` entry was rejected: `/schedule` needs to land on
`#schedule`, but a `Location` that carries its own fragment *replaces* the
request's fragment, which would break every `/wardrobe#sunset-shaadi` link in
the wild. The client-side redirect can tell the two cases apart. The rewrites in
`vercel.json` stay — without them those paths 404 at the edge and the script
never runs.

**Deleted.** `SchedulePage.tsx`, `ScrollCue.tsx` (it targeted `.intro-frame`,
which stopped existing two passes ago), the compact four-row `#schedule` list,
the `#explore` "Wardrobe Guide" card, and with them `schedule`/`ScheduleStop`
and `exploreCards` from `home.ts`. About 700 lines of CSS went too — the old
`/wardrobe` page's `.event-panel` / `.attire-*` / `.intro-*` blocks, the scroll
cue, `.schedule-*`, `.explore-*`, `.btn-ghost`. The `.accent-*` tokens stayed:
`/map` still uses them.

**Deep links** re-run on a `ResizeObserver` over `documentElement` for three
seconds, not on a fixed delay. The page keeps growing after the initial jump —
display faces swap in, artwork decodes, and the forecast arrives and adds its
credit line, which alone moved `#naach-the-night-away` 77px. The observer stops
the moment the guest scrolls, so it never fights them.

**The countdown** counts calendar days in `America/Los_Angeles` rather than
milliseconds to a timestamp, so it turns over at midnight in Carnation instead
of at whatever hour the ceremony starts. Both days of the weekend read "It's
today!"; after that it retires rather than counting up.

**The nav** doubles as a position indicator — whichever section owns the top
third of the viewport takes `aria-current` and a small arch under its name.

## The arch (pass 2)

The motif, taken from the couple's own withjoy page: a photo in a paper mat,
traced further out by a single forest line. It carries the hero portrait, the
three couple photos, both buttons, the venue link, every ornament rule, and the
nav's position marker.

Two shapes, and which one an element gets is decided by its content:

- **Round.** Radii are **lengths** — `calc(var(--portrait-w) / 2)` — so the arch
  is a true semicircle and the mat and the line stay concentric. A percentage
  cannot do this: the vertical half resolves against *height*, so the dome turns
  elliptical the moment the box stops being square. Used on the hero, whose box
  is `1 / 1.08` so the square portrait lands in it whole.
- **Segmental.** Radii are **percentages**, `50%` horizontally so the springing
  points sit at the corners and the apex is dead centre. Only works where the
  aspect ratio is fixed, which it is on the section photos (`16 / 10`, vertical
  `40%`) and effectively is on the buttons and the venue link. Used wherever a
  full dome would crop into the tops of their heads.

The timeline bullets stayed circles. They are 8px punctuation on a spine, not a
frame, and an arch at that size is mush.

**The buttons and the venue link.** One `.btn`, arch-topped, no pill. The venue
link is not a `.btn` at all: nothing else in the schedule is a filled box, and
one drop-shadowed green pill on watercolour paper read as a control borrowed
from another site. It is an outlined doorway in the event's own `--accent`
carrying three lines — Sam's Tavern / South Lake Union / GET DIRECTIONS → — so
it names the place, locates it, and says what tapping it does. "SLU" is gone;
out-of-town guests have no reason to know it.

**Travel and Q&A** dropped their cream cards for the hairlines the schedule
already used, and `--rule` moved to `:root` so every rule on the site is the
same weight.

## The arch, corrected (pass 2b)

A design review measured the five arches and found them to be five shapes, not
one motif. Normalising each dome to **rise ÷ half-width** (1.000 = a true
semicircle):

| element | before | after |
|---|---|---|
| hero portrait + its outer line | 1.000 | 1.000 |
| ornament bead | 1.099 | 1.000 |
| section photo | 0.500 | 0.550 |
| venue doorway | 0.408 | 0.550 |
| button | **0.279** | 0.550 |

The cause: the vertical radius was a **percentage of each element's own
height**, and the five boxes have aspect ratios from 0.27 to 3.7 — so even one
shared percentage would have produced different arches. Every rise is now
derived from the element's **width**, and takes one of two deliberate values:
1.000 where the shape is an opening (the portrait, the beads), and
`--arch-rise` (0.55) where it is a wide field holding content. The button was
the flattest because at 62.7px tall there was no room for a dome; it is taller
now.

Both buttons became **outlined** doorways. A filled 240×102 block of forest was
the heaviest element on a watercolour page — heavier than the portrait — and the
venue link had already arrived at an outlined doorway on its own. Hover fills
it. The hero portrait also lost its drop shadow, for the reason the section
photos never had one.

## Contrast and focus (pass 2b)

**Seventeen failures to zero**, at 1440 / 768 / 390 / 320, measured with the
opacity chain and the real background under each element.

- **`opacity` was being used for de-emphasis**, which is dilution, not
  emphasis: the am/pm on every timeline row measured **2.00:1** on the
  carnival's pink, and rendered at **11.04px** on a phone — the only break of
  the project's 14px floor. It is now a neutral ink at full strength with a
  `max(0.875rem, 0.6em)` floor.
- **`--copper-light` (#ba5919) failed 4.5:1 on every ground it was used on**
  and is gone. Running text moved to `--rust`, the footer band to
  `--burnt-copper`.
- **Timeline labels went to 700.** This spec previously claimed 21.6px
  semibold counts as large text; it does not — WCAG's large-text line is 24px,
  or 18.66px **bold**. 700 is what actually puts the labels over it, which is
  the bar the shaadi's sunflower was always pitched against. On phones the
  times and labels step up so they stay above it there too.
- **One focus indicator.** Fifteen controls had none: eight rules paired
  `:hover` with `:focus-visible` and set `outline: none`, so focus inherited
  hover styling (1.82:1 change contrast on the primary CTA) and everything else
  fell back to Chrome's blue default on warm cream. `--focus-ring` is a
  box-shadow rather than an outline, so it follows `border-radius` and arches
  with the doorways.

## Rhythm (pass 2b)

The seam between two events was drawn more strongly than the seam between two
whole sections. The event rule now stops short of the column, the section gap
outweighs the divider, and the forecast credit is pulled inside the carnival's
own trailing space — as a sibling it opened the largest gap in the section. The
order is monotonic: **credit 107 < peer 112 < divider 143 < section 144/200**.

Carattere is centred on advance width, not ink, so "Abha & Udit" sat 15.6px
left of the date line beneath it and "Travel" 8.3px right of its ornament. A
`padding-left`/`padding-right` in em corrects each; all three titles now centre
to within 0.2px. This only works where the element is full-width — the hero's
h1 was shrink-to-fit inside `.hero-copy`, so its own padding grew the parent
and the correction cancelled itself out.

## Deliberately not done

- **The event palettes were left alone.** Timeline times run 3.55:1 (carnival)
  to 9.40:1 (sangeet) against the paper — a 2.6× spread across four things that
  are meant to be peers, and the carnival visibly recedes. Every one of them
  clears the large-text bar they are used at, and the colours were chosen and
  reviewed by the couple from their own artwork, so evening them out is their
  call, not a defect to fix.
- Travel's two columns are equal-height containers whose content ends ~143px
  apart, leaving a ragged bottom left. It is content-driven.
- `/map` remains built and unrouted.
- The seating chart is still a placeholder, blocked on full guest names.
