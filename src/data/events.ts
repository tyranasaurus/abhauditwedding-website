export interface TimelineEntry {
  time: string
  label: string
}

export interface WeddingEvent {
  /** Section accent palette, set per className in index.css. */
  className: 'sunset-ceremony' | 'carnival-garden' | 'forest-gala' | 'seahawks-opener'
  /** Anchor id, so other pages can deep-link to /schedule#<anchor>. */
  anchor: string
  title: string
  /** Date line under the title. Start times live in the timeline, not here. */
  date: string
  /** Outdoor events only: the hours to read the live forecast across. */
  forecastWindow?: { date: string; from: number; to: number }
  /** Dress code, rendered as the caption over the artwork. */
  vibe: string
  /** Two colours sampled from this event's own artwork. The first leads; the
   *  second takes the timeline marks and whichever words `vibeAccents` names. */
  accents: [string, string]
  /** Accent index per word of `vibe`. Unlisted words take the first colour. */
  vibeAccents?: number[]
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  /** Each webp carries a transparent band above and below the painting. These pull
   *  the image box in to the real edges so the caption lands on the artwork rather
   *  than below empty space. Percentage margins resolve against WIDTH, so each value
   *  is the measured alpha padding scaled by the image's height/width ratio, then
   *  nudged by eye. A negative value pushes the caption down instead. */
  trimTop: string
  trimBottom: string
  /** Width of the artwork column; the watch party runs wider. */
  artWidth?: string
  timeline?: TimelineEntry[]
  /** What the event is and what to wear to it, in one voice. */
  note: string
  /** Optional venue link rendered as a button (the watch party). */
  venue?: { label: string; url: string }
  /** Draws an ornament divider before the panel, marking it as an optional extra. */
  divider?: boolean
}

// Ordered chronologically across the wedding weekend.
export const events: WeddingEvent[] = [
  {
    className: 'sunset-ceremony',
    anchor: 'sunset-shaadi',
    title: 'Sunset Shaadi',
    date: 'Saturday, September 5',
    forecastWindow: { date: '2026-09-05', from: 15, to: 22 },
    vibe: 'Traditional Elegance',
    // Sunset orange from the figures, dark goldenrod from the sky.
    accents: ['#d0601e', '#ac7815'],
    vibeAccents: [0, 1],
    image: '/art/shaadi.webp',
    imageAlt: 'Four guests dressed for the Sunset Shaadi ceremony',
    imageWidth: 800,
    imageHeight: 1200,
    trimTop: '16.35%',
    trimBottom: '25.5%',
    timeline: [
      { time: '3:30 PM', label: 'Refreshments' },
      { time: '4:00 PM', label: 'Ceremony' },
      { time: '7:00 PM', label: 'Dinner' },
      { time: '8:00 PM', label: 'Speeches' },
    ],
    note: 'Dinner will be at dusk, so light layers could help ward off the evening chill.',
  },
  {
    className: 'carnival-garden',
    anchor: 'carnegie-to-carnation',
    title: 'From Carnegie to Carnation',
    date: 'Sunday, September 6',
    forecastWindow: { date: '2026-09-06', from: 10, to: 15 },
    vibe: 'Colors in Bloom',
    accents: ['#d94b6d', '#9344a7'],
    vibeAccents: [0, 0, 1],
    image: '/art/carnival.webp',
    imageAlt: 'Four guests dressed for the Baraat and Carnival',
    imageWidth: 800,
    imageHeight: 960,
    trimTop: '4%',
    trimBottom: '4.81%',
    timeline: [
      { time: '10:00 AM', label: "Abha and Udit's Baraat" },
      { time: '11:00 AM', label: 'Carnival Booths Open' },
      { time: '12:00 PM', label: 'Bride vs Groom Games' },
      { time: '2:00 PM', label: 'Carnival Finale' },
    ],
    note: 'Abha and Udit are excited for everyone to join the Baraat leading into the Carnival, our festive fair! Expect fun food and activities, lawn games, and plenty of beautiful spots around the venue for photos. FYI, Abha is skipping heels, and you can too!',
  },
  {
    className: 'forest-gala',
    anchor: 'naach-the-night-away',
    title: 'Naach the Night Away',
    date: 'Sunday, September 6',
    vibe: 'Glitz and Glam',
    accents: ['#28433a', '#9b643a'],
    vibeAccents: [0, 0, 1],
    image: '/art/reception.webp',
    imageAlt: 'Four guests dressed for the Sangeet reception',
    imageWidth: 800,
    imageHeight: 1132,
    trimTop: '18.6%',
    trimBottom: '21.4%',
    timeline: [
      { time: '4:30 PM', label: 'Appetizers Served' },
      { time: '5:00 PM', label: 'Sangeet First Half' },
      { time: '6:00 PM', label: 'Dinner and Photos' },
      { time: '6:30 PM', label: 'Sangeet Second Half' },
      { time: '7:00 PM', label: 'Dance Party' },
    ],
    note: 'Dinner, dosti, and dance!',
  },
  {
    className: 'seahawks-opener',
    anchor: 'seahawks-season-opener',
    title: 'Seahawks Season Opener',
    date: 'Wednesday, September 9 · 5:00 PM',
    vibe: '12th Man Spirit',
    accents: ['#33486e', '#5c8330'],
    vibeAccents: [0, 0, 1],
    image: '/art/seahawks.webp',
    imageAlt: 'Four guests in Seahawks gear at a game-day watch party',
    imageWidth: 1300,
    imageHeight: 1257,
    trimTop: '0.8%',
    trimBottom: '-3.47%',
    artWidth: '420px',
    divider: true,
    venue: {
      label: 'Sam’s Tavern SLU',
      url: 'https://maps.app.goo.gl/GnV7sKQTn7k1LSkr6',
    },
    note: 'Quite the summer for rings in Seattle. Join us to celebrate Abha, Udit, and the Seahawks as they all run it back for more. Go Hawks!',
  },
]
