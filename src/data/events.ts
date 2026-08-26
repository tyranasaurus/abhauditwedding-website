export interface TimelineEntry {
  time: string
  label: string
}

export interface WeddingEvent {
  /** Section accent palette, set per className in index.css. */
  className: 'sunset-ceremony' | 'carnival-garden' | 'forest-gala' | 'seahawks-opener'
  /** Anchor id, so other pages can deep-link to /#<anchor>. */
  anchor: string
  title: string
  /** Date line under the title. Start times live in the timeline, not here. */
  date: string
  /** Outdoor events only: the hours to read the live forecast across. */
  forecastWindow?: { date: string; from: number; to: number }
  /** Dress code, rendered as the caption over the artwork. */
  vibe: string
  /** Two colours sampled from this event's own artwork.
   *  `primary` takes the event name and the times; `secondary` takes the
   *  timeline bullets, the spine and the timeline labels. Every secondary is
   *  deepened along its own hue to about 5:1 on the paper, because it has to
   *  carry label text as well as decoration. */
  accents: {
    primary: string
    secondary: string
    /** Bullets and spine, when they should differ from `secondary`. */
    marks?: string
  }
  /** One colour per word of `vibe`. */
  vibeColors: string[]
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  /** Width of the artwork column; the watch party runs wider. */
  artWidth?: string
  /** Extra room between the caption and the painting, in em. The paintings leave
   *  different amounts of ground beneath their figures — 3.2% of image height on
   *  the sangeet against 0.8-1.4% on the others — so a single overlap crowds the
   *  shoes on three of them. Sangeet is the baseline and takes none. */
  captionDrop?: string
  timeline?: TimelineEntry[]
  /** What the event is and what to wear to it, in one voice. */
  note: string
  /** Optional venue link rendered as a button (the watch party). */
  venue?: { name: string; area: string; url: string }
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
    // The sunset's vermilion against the sky's sunflower. The brighter orange
    // sat within 1 L* of the gold, so the two roles did no work against each other.
    accents: { primary: '#a6350c', secondary: '#a07903' },
    vibeColors: ['#a6350c', '#a07903'],
    captionDrop: '0.30em',
    image: '/art/shaadi.webp',
    imageAlt: 'Four guests dressed for the Sunset Shaadi ceremony',
    imageWidth: 792,
    imageHeight: 838,
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
    // The one event with four colours, so the bullets take the blue rather
    // than doubling the purple.
    accents: { primary: '#d94b6d', secondary: '#755798', marks: '#3685ad' },
    vibeColors: ['#3685ad', '#d94b6d', '#755798'],
    captionDrop: '0.26em',
    image: '/art/carnival.webp',
    imageAlt: 'Four guests dressed for the Baraat and Carnival',
    imageWidth: 793,
    imageHeight: 862,
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
    accents: { primary: '#28433a', secondary: '#9e521a' },
    vibeColors: ['#28433a', '#9e521a', '#28433a'],
    image: '/art/reception.webp',
    imageAlt: 'Four guests dressed for the Sangeet reception',
    imageWidth: 784,
    imageHeight: 813,
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
    accents: { primary: '#33486e', secondary: '#4f7029' },
    vibeColors: ['#33486e', '#33486e', '#4f7029'],
    captionDrop: '0.32em',
    image: '/art/seahawks.webp',
    imageAlt: 'Four guests in Seahawks gear at a game-day watch party',
    imageWidth: 799,
    imageHeight: 762,
    artWidth: '420px',
    divider: true,
    venue: {
      name: 'Sam’s Tavern',
      area: 'South Lake Union',
      url: 'https://maps.app.goo.gl/GnV7sKQTn7k1LSkr6',
    },
    note: 'Quite the summer for rings in Seattle. Join us to celebrate Abha, Udit, and the Seahawks as they all run it back for more. Go Hawks!',
  },
]
