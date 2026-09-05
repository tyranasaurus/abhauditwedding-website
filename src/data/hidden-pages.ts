/**
 * Pages that exist but are switched off.
 *
 * The Carnival's live page, and every standalone map page, are built and still
 * in the tree — they are simply not part of the site right now. This list is
 * the only switch: a path in it never renders (`App.tsx` sends the guest to
 * the homepage instead), and the links that would have pointed at it are drawn
 * from the same list, so nothing anywhere offers a way in. The Shaadi and the
 * Reception stay live, each keeping its map inside its own page.
 *
 * To bring a page back, take its path out of here — the route, the nav link
 * and the floating live pill all come back with it. Nothing else needs
 * editing.
 *
 * The rewrites in vercel.json deliberately stay: a link already handed out
 * should land a guest gently on the homepage, not on Vercel's 404.
 */
export const hiddenPaths: string[] = [
  // The Carnival's live page, under both its names.
  '/carnival',
  '/passport',
  // The map pages: the grounds map the nav used to link to, and the per-event
  // map browser under both its names. The Reception's inline map is part of
  // that page and is untouched.
  '/map',
  '/map-view',
  '/grounds',
]

/** Whether a path (already stripped of its trailing slash) is switched off. */
export function isHidden(path: string): boolean {
  return hiddenPaths.includes(path)
}
