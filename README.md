# Abha & Udit — Wardrobe Guidance

Wedding weekend wardrobe guidance for Abha & Udit's events.

Built with the Tabbit stack: **Vite + React 19 + Tailwind CSS 4 + TypeScript**,
deployed as a static site on Vercel.

## Routes

- `/wardrobe` — the wardrobe guidance page.
- `/` — redirects to the main wedding site (`withjoy.com/abhauditwedding`),
  configured in `vercel.json`.

## Develop

```bash
npm install
npm run dev        # vite dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build
npm run lint
npm run typecheck
```

## Structure

- `src/App.tsx` — page composition.
- `src/components/` — `Intro`, `EventPanel`.
- `src/data/events.ts` — typed event + intro content.
- `src/lib/render-words.tsx` — per-word span helper for vibe accents / spacing.
- `src/index.css` — Tailwind import, `@theme` font tokens, and the art-directed styles.
- `public/art/` — optimized WebP artwork.
