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

export interface ActiveEvent {
  event: WeddingEvent
  /** Short name for the admin preview control. */
  shortName: string
  /** The locations that matter for this event, and nothing else. */
  highlights: MapHighlight[]
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
    event: byAnchor('carnegie-to-carnation'),
    shortName: 'Carnival',
    highlights: [
      // The big field the Baraat leads into.
      { x: 40.3, y: 74.3, w: 18, h: 15.5, angle: -40 },
    ],
    intro: {
      before:
        'The Baraat leads into the Carnival on the big field — here is where to be, when to be there, and what to wear.',
      // No during blurb: the map and passport speak for themselves.
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
