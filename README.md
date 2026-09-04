# Abha & Udit — Wedding Site

The wedding site for Abha & Udit's weekend, live at
<https://abhaudit.wedding>.

Built with **Vite + React 19 + TypeScript**, deployed as a static site on
Vercel. Tailwind CSS 4 is imported for its `@theme` design tokens and base
reset only — the styling itself is hand written CSS in `src/index.css`.

## Routes

One built bundle is served on every path; `App.tsx` picks the view from
`window.location.pathname`, and `vercel.json` supplies the rewrites that stop
those URLs 404ing at Vercel's edge.

- `/` — the homepage, which now carries the schedule and wardrobe guidance.
- `/seating-chart` — the seating chart.
- `/schedule`, `/wardrobe` — kept alive for links already handed out. An
  inline script in `index.html` sends them to the matching homepage anchor
  before the app boots.
- `/registry` — a Vercel redirect out to the registry on withjoy.com.

`MapPage.tsx` (venue map) is built but deliberately unrouted — there is no
`/map` rewrite, so that URL 404s until one is added.

## Develop

```bash
npm install
npm run dev        # vite dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build
npm run lint
npm run typecheck
npm run icons      # regenerate favicons + share card from art-src/
```

Vercel builds from `main`, so a push to `main` is a deploy. Work on a branch
and merge when it is ready for guests.

## Structure

- `src/App.tsx` — path-to-view routing.
- `src/components/` — `HomePage`, `SeatingChart`, `EventPanel`, `SiteNav`,
  `SkyGlyph`, and the unrouted `MapPage`.
- `src/data/` — typed content for the homepage, events, and map.
- `src/lib/` — per-word span helper, date formatting, forecast hook.
- `src/index.css` — Tailwind import, `@theme` tokens, and the art-directed
  styles.
- `public/art/` — optimized WebP artwork (originals stay in the gitignored
  `art-src/`).
