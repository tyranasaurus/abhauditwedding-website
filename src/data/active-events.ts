import { events, type WeddingEvent } from '@/data/events'

/** An area lit on the venue aerial: center, size, and angle as percentages
 *  and degrees on the square artwork, traced off the painted feature. */
export interface MapHighlight {
  x: number
  y: number
  w: number
  h: number
  angle: number
}

/** A route walked during an event, drawn over the aerial as a dashed line:
 *  waypoints as percentages of the square artwork, traced along the painted
 *  roads, plus a labeled start and finish. */
export interface MapRoute {
  /** The line runs first point to last; interior points become bends. */
  points: { x: number; y: number }[]
  startLabel: { x: number; y: number; text: string }
  endLabel: { x: number; y: number; text: string }
}

/** Waypoints to a smooth SVG path in the aerial's 0–100 space: straight runs
 *  to the midpoints, each interior waypoint becoming the control of a
 *  quadratic bend, so the line rounds the corners the way a walk does. */
export function routePath(points: { x: number; y: number }[]): string {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ''
  const parts = [`M ${first.x} ${first.y}`]
  if (points.length < 3) {
    parts.push(`L ${last.x} ${last.y}`)
    return parts.join(' ')
  }
  for (let i = 1; i < points.length - 1; i++) {
    const bend = points[i]!
    const next = points[i + 1]!
    const endX = i === points.length - 2 ? next.x : (bend.x + next.x) / 2
    const endY = i === points.length - 2 ? next.y : (bend.y + next.y) / 2
    parts.push(`Q ${bend.x} ${bend.y} ${endX} ${endY}`)
  }
  return parts.join(' ')
}

export interface ActiveEvent {
  event: WeddingEvent
  /** Short name for the admin preview control. */
  shortName: string
  /** The locations that matter for this event, and nothing else. */
  highlights: MapHighlight[]
  /** The procession's path, for events that walk somewhere (the Baraat). */
  route?: MapRoute
  intro: { before: string; during: string }
  /** What During Event swaps in. The reception has the seating experience,
   *  the carnival has the activity passport (rendered with its map in both
   *  phases), and the shaadi keeps the schedule until procession guidance
   *  and friends exist — see the design doc. */
  duringModule: 'schedule' | 'seating' | 'passport'
}

const byAnchor = (anchor: string) =>
  events.find((event) => event.anchor === anchor)!

// The farm events only: the watch party is off-site at a tavern and has no
// venue-map experience to build.
export const activeEvents: ActiveEvent[] = [
  {
    event: byAnchor('sunset-shaadi'),
    shortName: 'Shaadi',
    highlights: [
      // The ceremony meadow, and the dinner lawn by the pavilion.
      { x: 30.5, y: 60.5, w: 9, h: 7, angle: -42 },
      { x: 23, y: 43.8, w: 7, h: 6, angle: -40 },
    ],
    intro: {
      before:
        'This afternoon in the meadow — here is where to be, when to be there, and what to wear.',
      during:
        'Happening now in the meadow — here is how the afternoon and evening unfold.',
    },
    duringModule: 'schedule',
  },
  {
    // One event, two faces. Before is the Baraat: the aerial with the
    // procession's route. During swaps in the carnival map and passport,
    // keeping the route aerial as a mini map.
    event: byAnchor('carnegie-to-carnation'),
    shortName: 'Carnival',
    highlights: [
      // Where the procession lands: the carnival's big field.
      { x: 40.6, y: 75.1, w: 18, h: 15.5, angle: 41 },
    ],
    route: {
      // Hand-traced in the aerial trace editor.
      points: [
        { x: 30.4, y: 38.9 },
        { x: 42.6, y: 43.3 },
        { x: 44.7, y: 47.6 },
        { x: 41.3, y: 50.3 },
        { x: 35.1, y: 53.7 },
        { x: 39.1, y: 58.2 },
        { x: 39.7, y: 60.4 },
      ],
      startLabel: { x: 30.2, y: 32.8, text: 'Baraat starts here' },
      endLabel: { x: 56.5, y: 62.7, text: '…into the Carnival!' },
    },
    intro: {
      before:
        'The Baraat winds down through the farm to the big field, where the Carnival takes over — here is the route, plus where to be and what to wear.',
      // No during blurb: the maps and passport speak for themselves.
      during: '',
    },
    duringModule: 'passport',
  },
  {
    event: byAnchor('naach-the-night-away'),
    shortName: 'Sangeet',
    highlights: [
      // The Hippodrome barn.
      { x: 49.55, y: 85.8, w: 18.2, h: 7.4, angle: -50 },
    ],
    intro: {
      before:
        'Tonight in the Hippodrome — here is where to be, when to be there, and what to wear.',
      during: 'Welcome to the Hippodrome! Find your table below.',
    },
    duringModule: 'seating',
  },
]

export const defaultActiveEvent = activeEvents.find(
  (a) => a.event.anchor === 'naach-the-night-away',
)!
