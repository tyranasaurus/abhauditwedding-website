/**
 * The live-weekend schedule: while a phase's window is open, the homepage
 * auto-scrolls to that event's card, and — for phases with an interactive
 * page — a floating pill opens it. The static site carries no map (decided
 * 2026-08-31); wayfinding lives in the interactive pages.
 *
 * The windows are the editable heart of this file. All times are the
 * venue's own clock (Carnation, WA — PDT in September).
 */
export interface LivePhase {
  id: string
  /** Short name for the ?live= preview control. */
  shortName: string
  /** The homepage event section (anchor) this phase lands guests on. */
  anchor: string
  /** Window bounds, ISO with the venue's UTC offset. */
  start: string
  end: string
  /** The floating pill into this phase's interactive page, when one exists. */
  pill?: { label: string; href: string }
}

export const livePhases: LivePhase[] = [
  {
    // Pre-shaadi and the shaadi itself: all of Saturday until the evening
    // winds down after speeches.
    id: 'shaadi',
    shortName: 'Shaadi',
    anchor: 'sunset-shaadi',
    start: '2026-09-05T00:00:00-07:00',
    end: '2026-09-05T22:30:00-07:00',
  },
  {
    // Sunday morning up to the carnival's opening: the Baraat's window.
    id: 'pre-baraat',
    shortName: 'Baraat',
    anchor: 'carnegie-to-carnation',
    start: '2026-09-06T00:00:00-07:00',
    end: '2026-09-06T11:00:00-07:00',
  },
  {
    // Carnival begins at 11; finale at 2, plus a little wind-down.
    id: 'during-carnival',
    shortName: 'Carnival',
    anchor: 'carnegie-to-carnation',
    start: '2026-09-06T11:00:00-07:00',
    end: '2026-09-06T14:30:00-07:00',
    pill: { label: 'Open your Carnival Passport', href: '/passport' },
  },
  {
    // The gap between the carnival and appetizers at 4:45.
    id: 'pre-reception',
    shortName: 'Pre-Naach',
    anchor: 'naach-the-night-away',
    start: '2026-09-06T14:30:00-07:00',
    end: '2026-09-06T16:45:00-07:00',
  },
  {
    id: 'during-reception',
    shortName: 'Naach',
    anchor: 'naach-the-night-away',
    start: '2026-09-06T16:45:00-07:00',
    end: '2026-09-06T23:00:00-07:00',
    pill: { label: 'See the Seating Chart', href: '/seating-chart' },
  },
]

export function currentLivePhase(nowMs: number): LivePhase | null {
  return (
    livePhases.find(
      (p) => nowMs >= Date.parse(p.start) && nowMs < Date.parse(p.end),
    ) ?? null
  )
}
