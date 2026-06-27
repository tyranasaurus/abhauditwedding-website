# Abha & Udit — Signature Artwork Style

The visual reference for every image asset on this site. The
[`generate-image-asset`](./SKILL.md) skill reads this file to build prompts. Edit
this file (not the skill) when the art direction changes.

## The medium

Traditional hand-painted **watercolor on textured paper** — rustic, romantic,
organic, painterly. The core technique is soft, expressive, bleeding wet-on-wet
washes where colours melt into one another with **no hard boundaries**, creating
soft-focus, hazy forms and an atmospheric quality.

The paint should feel intentionally **splotchy and imperfect**: visible,
unpredictable pools, blooming edges, and organic transitions inside each wash.
For a natural raw feel, scatter small irregular **paint flecks and splatter**
lightly as accents.

Use the soft splotchy treatment for **backgrounds and mid-grounds**. Let the
**foreground subject** (a barn, a couple, attire figures) become sharper and
more precise — cleaner edges, clearer definition — so the focal point reads in
focus against softer surroundings.

Avoid: polished digital gradients, vector flatness, hard outlines, glossy 3D
renders, photographic realism, stock-illustration "corporate" look.

## Palette

Old-world Indian wedding stationery: warm ivory paper, copper ink, forest green.

| Token          | Hex       | Use                                   |
| -------------- | --------- | ------------------------------------- |
| Forest green   | `#2c683c` | Primary accent, foliage               |
| Deep forest    | `#173d29` | Shadows, depth                        |
| Copper         | `#9b643a` | Ink, linework, warm accent            |
| Rust           | `#8c572e` | Secondary warm accent                 |
| Burnt copper   | `#724826` | Deepest warm tone                     |
| Warm ivory     | `#f6eedf` | Paper base (the background of most art) |
| Warm paper     | `#ead9bd` | Paper variation / soft shadow         |
| Paper shadow   | `#d4b991` | Texture ribbing, vignette             |
| Ink            | `#2f2a21` | Fine detail, near-black accents       |

These match the live design tokens in `src/index.css` (`@theme`). Keep generated
art inside this system so it sits naturally on the page.

### Per-event palettes

Individual event art may introduce its own accents while staying on the same
ivory paper + watercolor system:

- **Sangeet / Reception** — forest green, copper, antique gold, midnight blue.
- **Baraat / Carnival** — carnation pink (`#d94e78`), turquoise, lilac, marigold.
- **Ceremony / Shaadi** — saffron, peach, terracotta (`#d86a22`), pale blue, soft greenery.

## Composition for web

- Art is an **atmospheric anchor, not generic decoration**. Let paper texture and
  soft wash carry the background.
- **Never bake text into artwork.** All headings and body copy are rendered as
  live HTML in the site fonts (Carattere script, Cormorant Garamond display,
  Libre Baskerville body). Generate art *without* lettering, then let the page
  set the words on top. Prompt explicitly: "no text, no lettering, no words."
- Keep a calm, uncluttered focal subject so live text stays legible over it.
- Prefer imperfect edges, flecks, and softened transitions over clean gradients.

## Transparency / cutouts (important)

Gemini (Nano Banana Pro) **cannot emit a real alpha channel.** If you ask for a
"transparent background" it paints a fake grey checkerboard into an opaque image.
To get a true cutout (a figure or sprig that floats over the page):

1. Prompt the subject on a **flat magenta key field** — pure magenta `#FF00FF`,
   far from any cream/green/copper in the art. **Critically, you must stop Gemini
   from painting a paper card:** left to itself it renders the art as a
   *photograph of a watercolour on an ivory card sitting on a magenta surface*,
   and then only the border keys out. Force a flat graphic instead, e.g.:

   > "…this is a flat digital graphic, NOT a photograph of a painting. The
   > watercolour subject sits directly on a solid pure magenta `#FF00FF`
   > background that fills the entire frame edge to edge. No paper, no card, no
   > sheet, no border, no surface, no drop shadow."

2. Key it out with `cutout.mjs` (ships next to the skill):
   `node .claude/skills/generate-image-asset/cutout.mjs in.png out.png`. It
   **auto-samples the real background from the corners** (Gemini rarely paints
   the exact `#FF00FF` — often a lighter hot-pink), flood-fills the connected
   background to transparent, feathers the edge, and trims to the subject. If a
   pink halo remains, raise the tolerance (4th arg, default `115`); if the art
   itself gets eaten, lower it.

For art that sits *on* the ivory paper as a full panel (like `barn.webp`,
`shaadi.webp`), you don't need a cutout — just generate it with a warm ivory
`#f6eedf` paper background and use it as-is.

## Output conventions for this repo

- Live assets go in `public/art/` and are referenced as `/art/<name>.webp`
  (see `src/data/*.ts`). Map assets live in `public/art/map/`.
- The site ships **WebP**. Generate as PNG, then convert:
  `cwebp -q 88 in.png -o public/art/<name>.webp` (or `npx @squoosh/cli`).
- Full art panels are roughly square-to-portrait; the couple/photo assets are
  `1200x1200`. Match aspect ratio to the slot you're filling.
- Name files by **purpose**, not content: `shaadi.webp`, `icon-parking.webp`,
  `compass-rose.webp` — match the existing naming in `public/art/`.

## Prompt skeleton

> Traditional hand-painted watercolor on textured ivory paper, rustic romantic
> Indian wedding stationery style. Soft wet-on-wet bleeding washes, splotchy
> imperfect pools, light paint-fleck splatter, hazy atmospheric background.
> **Subject:** `<what>`, rendered with sharper foreground detail against soft
> surroundings. Palette: warm ivory `#f6eedf`, forest green `#2c683c`, copper
> `#9b643a`, rust `#8c572e`. No text, no lettering, no words. `<for a cutout, add:
> "flat digital graphic, NOT a photograph of a painting; subject directly on a
> solid pure magenta #FF00FF background filling the frame edge to edge; no paper,
> card, border, surface, or shadow">`.
