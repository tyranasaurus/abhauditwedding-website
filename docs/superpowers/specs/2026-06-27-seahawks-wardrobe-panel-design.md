# Seahawks Season Opener — Wardrobe Planner Panel

**Date:** 2026-06-27
**Status:** Approved (design)

## Goal

Add the "Seahawks Season Opener" event (already on the homepage schedule via PR #6)
as a fourth panel on the `/wardrobe` planner page, and process its new artwork
(`public/art/seahawks.png`) into a transparent webp that matches the existing
wardrobe images.

This panel is an **event reminder**, not a dress-code guide — so it omits the
ethnic/Western attire guidance the other three panels carry, but keeps the
large decorative "vibe" phrase for visual consistency and adds an RSVP button
(this is the one event with its own RSVP form).

## Image processing

Source: `public/art/seahawks.png` (2048×2048) — a watercolor sports-bar scene
with four guests in Seahawks gear. Unlike the other wardrobe art, its outer area
is a hard **black rectangle** and it carries a **Gemini sparkle watermark** in
the bottom-right corner.

Output: `public/art/seahawks.webp` — transparent background, watermark removed,
trimmed tight to the artwork (matching the other three webps, which are
alpha-trimmed, e.g. 958×1038).

Steps (Python + Pillow, in a throwaway venv — no `magick`/`cwebp`/Pillow on the system):

1. Open as RGBA.
2. **Edge flood-fill** from the four corners: flood connected near-black pixels
   (e.g. `max(r,g,b) < ~40`, tunable) to transparent. Flood-fill — NOT global
   black removal — so the dark-navy jerseys/banner *inside* the artwork are
   preserved (they're enclosed by non-black watercolor and unreachable from the
   border).
3. **Erase the watermark**: after the fill, clear the watermark's bottom-right
   corner region to transparent. Locate it precisely first (save/inspect a corner
   crop) so the clear box stays off the artwork.
4. **Trim** the fully-transparent margin to the alpha bounding box (small padding).
5. Export webp with alpha (quality ~90). Record final width/height for the data.

Verify by reading the output webp: clean transparent edges, no black halo, no
watermark, navy clothing intact.

## Data model — `src/data/events.ts`

- Add `seahawks-opener` to the `className` union.
- Make `ethnic` and `western` **optional** (`ethnic?: string`, `western?: string`).
  The three existing events keep their values; the Seahawks entry omits them.
- Add optional `rsvpUrl?: string`.
- Append the fourth event (chronologically last):

  | Field | Value |
  |---|---|
  | className | `seahawks-opener` |
  | anchor | `seahawks-season-opener` |
  | label | `SEASON OPENER WATCH PARTY` |
  | datetime | `Wednesday, September 9, 2026 · 5:00 PM` |
  | title | `Seahawks Season Opener` |
  | vibe | `Twelfth Man Spirit` |
  | vibeAccentIndexes | `[1, 2]` (navy / green / grey across the three words) |
  | image | `/art/seahawks.webp` |
  | imageAlt | `Four guests in Seahawks gear at a game-day watch party` |
  | imageWidth / imageHeight | from the trimmed webp |
  | ethnic / western | *(omitted)* |
  | note | `Quite the summer for rings in Seattle. Join us to celebrate Abha, Udit, and the Seahawks as they all run it back for more. Go Hawks!` |
  | rsvpUrl | `https://docs.google.com/forms/d/e/1FAIpQLScxUkCDBMpNt1xRp4Qe1BiSN5k7LaoW-4j6-K7MjtFxvmhWCg/viewform` |

## Rendering — `src/components/EventPanel.tsx`

- Render the `.attire-grid` (Ethnic/Western) block **only when** the event has
  `ethnic`/`western`. The Seahawks panel therefore reads:
  heading → image → vibe phrase → footer(note + RSVP button).
- In the footer, when `event.rsvpUrl` is set, render an `RSVP` link styled as a
  button (`target="_blank" rel="noopener noreferrer"`) below the note. The other
  three events have no `rsvpUrl`, so they're visually unchanged.

## Styling — `src/index.css`

- New accent palette `.event-panel.seahawks-opener`, softened to fit the
  watercolor site (not raw team hex):
  - `--accent: #33486e` (softened College Navy) — giant title, dividers, button
  - `--accent-2: #6f9c3c` (muted Action Green) — vibe word 1
  - `--accent-3: #5b6f78` (blue-grey ≈ Wolf Grey) — vibe word 2
- RSVP button: reuse the base `.btn` shape, new modifier tinted with the panel
  `--accent` (filled navy, light text; hover darkens via `color-mix`). Centered
  in the footer under the note.
- Respect the project minimum font-size rule (≥ 0.875rem): `.btn` floor is
  already 0.95rem; add no smaller type.

## Out of scope

- Homepage Seahawks schedule card — unchanged (already links to the RSVP form).
- Wardrobe intro copy — unchanged (it describes the wedding weekend; the watch
  party is the separate add-on).
- No new dependency added to the project (Pillow lives only in a throwaway venv
  used to produce the webp).

## Verification

- `npm run typecheck` and `npm run build` pass.
- `/wardrobe` shows four panels; the Seahawks panel has the processed image,
  the vibe phrase in the new palette, the note, and a working RSVP button; no
  attire grid.
- The other three panels are unchanged.
