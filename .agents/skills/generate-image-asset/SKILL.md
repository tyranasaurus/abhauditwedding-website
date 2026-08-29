---
name: generate-image-asset
description: Generate watercolor image assets for the Abha & Udit wedding site (Gemini / Nano Banana Pro), on-brand by following the site's signature artwork style. Use when asked to create, redraw, or restyle any art on the site — event panels, map icons, sprigs, cutouts, backgrounds.
allowed-tools: Read, Bash, Write, Edit
---

# Generate Image Asset

Generates **on-brand watercolor art** for this wedding site using Google's Gemini
image models, then drops it into `public/art/`. The look is defined in a separate
guide — read it before writing any prompt.

## Always read the style guide first

**[`artwork-style.md`](./artwork-style.md)** (next to this file) is the source of
truth for medium, palette, per-event accents, transparency handling, and the
prompt skeleton. Every prompt must follow it. If the user wants a different look,
update `artwork-style.md` first, then generate — don't silently drift off-brand.

## Generate

`generate.sh` ships next to this file. Call it from the repo root:

```bash
SKILL=".claude/skills/generate-image-asset"
"$SKILL/generate.sh" "<prompt built from artwork-style.md>" "/tmp/new-asset.png" "1:1" "2K"
```

Arguments: `generate.sh "<prompt>" [out.png] [aspectRatio] [imageSize]`

- `out.png` — output path (default `./gemini-image.png`). Render to `/tmp` first,
  review, then place into `public/art/`.
- `aspectRatio` — one of `1:1 2:3 3:2 3:4 4:3 4:5 5:4 9:16 16:9 21:9`. Match the
  slot: full panels lean square/portrait, the couple/photo assets are `1:1`.
- `imageSize` — `1K`, `2K`, or `4K` (default `2K`).

Env overrides: `GEMINI_MODEL=gemini-2.5-flash-image` (cheaper Nano Banana),
`GEMINI_API_KEY=...` (skip 1Password).

### Key & billing

`generate.sh` uses `$GEMINI_API_KEY` if set, and only falls back to 1Password
(`op://Private/Gemini Image API Key/credential`) when it isn't. Where the env var
comes from, per surface (no 1Password prompts, nothing committed to this repo):

- **GitHub Codespaces** — injected automatically from the repository-level
  Codespaces secret `GEMINI_API_KEY`. A fresh Codespace just has it. Manage at
  repo **Settings → Secrets and variables → Codespaces**, or
  `gh secret set GEMINI_API_KEY --app codespaces --repo tyranasaurus/abhauditwedding-website`.
- **Local Claude Code** — injected from the `env` block in `~/.claude/settings.json`.
- **Claude web / cloud agents** — *not* covered by the Codespaces secret (different
  sandbox). Set `GEMINI_API_KEY` once in the Claude cloud environment's variables,
  or do image generation from a Codespace.
- **Any other machine** — export `GEMINI_API_KEY`, or sign into 1Password (fallback).

**Billing must be enabled** on the key's Google Cloud project — image models are
`limit: 0` on the free tier and return HTTP 429. Enable at
https://aistudio.google.com/apikey.

## Transparent cutouts

Gemini can't emit a real alpha channel (see `artwork-style.md` → Transparency).
For a floating figure/sprig, prompt it as a **flat magenta graphic, not a photo
of a painting** (see `artwork-style.md` → Transparency for the exact wording —
this matters, or Gemini paints an ivory paper card and only the border keys out),
then key it out (`sharp` is a devDependency, so plain `node` works after
`npm install`):

```bash
node "$SKILL/cutout.mjs" /tmp/new-asset.png /tmp/new-asset-cut.png
```

`cutout.mjs` auto-detects the real background colour, flood-fills it to
transparent, feathers the edge, and trims to the subject. Tune with optional
`[padding] [tolerance]` args if a halo remains (raise tolerance) or the art gets
eaten (lower it).

Full panels that sit on the ivory paper (e.g. `barn.webp`, `shaadi.webp`) don't
need this — generate them on a warm ivory `#f6eedf` background and use as-is.

## Place it in the site

1. Review the PNG with the Read tool. Regenerate if it drifts off the guide.
2. Convert to WebP (the site ships WebP):
   `cwebp -q 88 /tmp/new-asset-cut.png -o public/art/<purpose>.webp`
   (or `npx @squoosh/cli --webp auto /tmp/new-asset-cut.png -d public/art`).
3. Reference it as `/art/<purpose>.webp` from `src/data/*.ts` (or `public/art/map/`
   for map assets). Name by **purpose**, matching existing files.
4. Run `npm run dev` (or the [`preview-design-change`](../preview-design-change/SKILL.md)
   skill) to see it on the page.

## Troubleshooting

- **HTTP 429 / `limit: 0` FreeTier** — billing not enabled on the project.
- **`op read` fails** — 1Password CLI not signed in (enable the desktop-app
  integration and unlock the app), or export `GEMINI_API_KEY`.
- **Fake checkerboard / opaque "transparent" art** — expected; use the magenta
  key + `cutout.mjs` flow above.
- **Looks generic / too digital** — re-read `artwork-style.md`; push wet-on-wet
  bleed, splotchy imperfection, paint flecks, and "no text, no lettering."
