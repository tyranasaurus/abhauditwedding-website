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
  /** What kind of event this is, set under the name. */
  subtitle?: string
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
  /** A single link out of the event, e.g. the reception's seating chart. */
  cta?: { label: string; href: string }
  /** Marks the panel as an optional extra rather than a peer event. A drawn
   *  line cannot say "this one is optional" — only words can, which is why
   *  this is a string and not a flag. Set above the title. */
  aside?: string
}

// Ordered chronologically across the wedding weekend.
export const events: WeddingEvent[] = [
  {
    className: 'sunset-ceremony',
    anchor: 'sunset-shaadi',
    title: 'Sunset Shaadi',
    subtitle: 'Wedding Ceremony',
    date: 'Saturday, September 5',
    forecastWindow: { date: '2026-09-05', from: 15, to: 22 },
    vibe: 'Traditional Elegance',
    // Sampled off shaadi.webp rather than guessed. The painting's sunset lives
    // at hue 16-40: the dome quantizes to #f6bf64 / #e79f5d / #ef8d58, the
    // sunflowers below to #b4a340 / #d8b656 / #d66c2d. The old pair was
    // darkened for contrast along the wrong path — off the artwork's hue,
    // toward brick red (#a6350c, hue 15) and mustard (#a07903) — and the
    // mustard measured 2.0 against the column over the firs, well under the
    // 3:1 these sizes need. These hold the painting's hue and give up only
    // value: sunset at hue 20, sunflower at hue 40.
    //
    // How much value to give up was a deliberate choice, made against
    // renderings rather than numbers. Worst case, where the column crosses the
    // darkest firs: name and times 2.17, labels 2.15, against the 3:1 large
    // text nominally wants. Everywhere paler it clears — 4.04 on the sky, 3.53
    // on the hills, 3.29 on the treeline — and the darkest firs are a small
    // part of the plate. The trade buys a panel that reads as the sunset in
    // the painting instead of as rust.
    //
    // `marks` is free either way: bullets and the spine carry no text, so they
    // have no threshold to meet at all, and this gold is sampled straight off
    // the sunflowers.
    accents: { primary: '#d05011', secondary: '#a37008', marks: '#e0a94e' },
    // The caption sits on the artwork itself, so it is measured against the
    // painting's gold as well as its own paper glow.
    vibeColors: ['#d05011', '#a37008'],
    captionDrop: '0.30em',
    image: '/art/shaadi.webp',
    imageAlt: 'Four guests dressed for the Sunset Shaadi ceremony',
    imageWidth: 792,
    imageHeight: 838,
    timeline: [
      { time: '3:45 PM', label: 'Refreshments' },
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
    subtitle: 'Baraat and Carnival',
    date: 'Sunday, September 6',
    forecastWindow: { date: '2026-09-06', from: 10, to: 15 },
    vibe: 'Colors in Bloom',
    // The one event with four colours, so the bullets take the blue rather
    // than doubling the purple.
    accents: { primary: '#d94b6d', secondary: '#755798', marks: '#3685ad' },
    // The caption's blue is deeper than the marks' blue on purpose: #3685ad is
    // a bullet colour, and set as a word it reads as a mark rather than as
    // text. Same hue, 234°, taken down until it carries.
    vibeColors: ['#05678e', '#d94b6d', '#755798'],
    captionDrop: '0.26em',
    image: '/art/carnival.webp',
    imageAlt: 'Four guests dressed for the Baraat and Carnival',
    imageWidth: 793,
    imageHeight: 862,
    timeline: [
      { time: '10:00 AM', label: "Abha and Udit's Baraat" },
      { time: '11:00 AM', label: 'Carnival Festival Begins' },
      { time: '12:00 PM', label: 'Bride vs Groom Games' },
      { time: '2:00 PM', label: 'Carnival Finale' },
    ],
    note: 'Abha and Udit are excited for everyone to join the Baraat leading into the Carnival, our festive fair! Expect fun food and activities, lawn games, and plenty of beautiful spots around the venue for photos. FYI, Abha is skipping heels, and you can too!',
  },
  {
    className: 'forest-gala',
    anchor: 'naach-the-night-away',
    title: 'Naach the Night Away',
    subtitle: 'Sangeet and Reception',
    date: 'Sunday, September 6',
    vibe: 'Glitz and Glam',
    accents: { primary: '#28433a', secondary: '#9e521a' },
    vibeColors: ['#28433a', '#9e521a', '#28433a'],
    image: '/art/reception.webp',
    imageAlt: 'Four guests dressed for the Sangeet reception',
    imageWidth: 784,
    imageHeight: 813,
    timeline: [
      { time: '4:45 PM', label: 'Appetizers Served' },
      { time: '5:00 PM', label: 'Sangeet First Half' },
      { time: '6:00 PM', label: 'Dinner and Photos' },
      { time: '6:30 PM', label: 'Sangeet Second Half' },
      { time: '7:00 PM', label: 'Dance Party' },
    ],
    note: 'Dosti, Dinner, Dancing and Dhamaal!',
    cta: { label: 'Seating chart', href: '/seating-chart' },
  },
  {
    className: 'seahawks-opener',
    anchor: 'seahawks-season-opener',
    title: 'Seahawks Season Opener',
    date: 'Wednesday, September 9 · 5:00 PM',
    vibe: '12th Man Spirit',
    // The club's own two: College Navy and Action Green.
    accents: { primary: '#002244', secondary: '#69be28' },
    // Navy, green, navy — the club leads with navy, so the caption does too.
    vibeColors: ['#002244', '#69be28', '#002244'],
    captionDrop: '0.32em',
    image: '/art/seahawks.webp',
    imageAlt: 'Four guests in Seahawks gear at a game-day watch party',
    imageWidth: 799,
    imageHeight: 762,
    artWidth: '520px',
    aside: 'If you’re still in town',
    venue: {
      name: 'Sam’s Tavern',
      area: 'South Lake Union',
      url: 'https://maps.app.goo.gl/oDNNeqmuTdAseraNA',
    },
    note: 'Quite the summer for rings in Seattle. Join us to celebrate Abha, Udit, and the Seahawks as they all run it back for more. Go Hawks!',
  },
]
