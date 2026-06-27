export interface WardrobeEvent {
  /** Section accent palette, set per className in index.css. */
  className: 'sunset-ceremony' | 'carnival-garden' | 'forest-gala' | 'seahawks-opener'
  /** Anchor id, so the map page can deep-link to /wardrobe#<anchor>. */
  anchor: string
  label: string
  datetime: string
  title: string
  vibe: string
  /** Word indexes within `vibe` that take the secondary/tertiary accent. */
  vibeAccentIndexes: number[]
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  /** Attire guidance, omitted for reminder-only events (e.g. the watch party). */
  ethnic?: string
  western?: string
  /** When set, the panel shows an RSVP button linking here (its own form). */
  rsvpUrl?: string
  /** Present on optional/bonus events: renders a framed divider before the
   *  panel and de-emphasizes the panel itself, so it reads as an extra rather
   *  than a peer of the main events. */
  bonus?: { eyebrow: string; lead: string }
  note: string
}

export const intro = {
  title: 'Wardrobe Guidance',
  paragraphs: [
    'We created this as inspiration, not as a shopping list. The weekend includes a full schedule of sun, heat, grass, games, and dancing, with limited time between events.',
    'More than anything, we care that you feel comfortable, stay safe, and are there with us on time. Your presence to enjoy with us matters far more than any specific outfit.',
  ],
  signature: 'Abha & Udit',
} as const

// Ordered chronologically across the wedding weekend.
export const events: WardrobeEvent[] = [
  {
    className: 'sunset-ceremony',
    anchor: 'sunset-shaadi',
    label: 'CEREMONY',
    datetime: 'Saturday, September 5, 2026 · 4:00 PM',
    title: 'Sunset Shaadi',
    vibe: 'Traditional Elegance',
    vibeAccentIndexes: [1],
    image: '/art/shaadi.webp',
    imageAlt: 'Four guests dressed for the Sunset Shaadi ceremony',
    imageWidth: 958,
    imageHeight: 1038,
    ethnic: 'Classic Ethnics',
    western: 'Summer Cocktail',
    note: 'Dinner will be at dusk, so light layers could help ward off the evening chill.',
  },
  {
    className: 'carnival-garden',
    anchor: 'carnegie-to-carnation',
    label: 'BARAAT & CARNIVAL',
    datetime: 'Sunday, September 6, 2026 · 10:00 AM',
    title: 'From Carnegie to Carnation',
    vibe: 'Colors in Bloom',
    vibeAccentIndexes: [1, 2],
    image: '/art/carnival.webp',
    imageAlt: 'Four guests dressed for the Baraat and Carnival',
    imageWidth: 1074,
    imageHeight: 1144,
    ethnic: 'Wedding Casual',
    western: 'Garden Casual',
    note: 'Dress for the sun and lawn games. Abha is skipping the heels, and you can too!',
  },
  {
    className: 'forest-gala',
    anchor: 'naach-the-night-away',
    label: 'SANGEET RECEPTION',
    datetime: 'Sunday, September 6, 2026 · 5:00 PM',
    title: 'Naach the Night Away',
    vibe: 'Glitz and Glam',
    vibeAccentIndexes: [1, 2],
    image: '/art/reception.webp',
    imageAlt: 'Four guests dressed for the Sangeet reception',
    imageWidth: 1053,
    imageHeight: 1102,
    ethnic: 'Formal Evening Ethnics or Indo-Westerns',
    western: 'Creative Cocktail',
    note: 'Dinner, dosti, and dance!',
  },
  {
    className: 'seahawks-opener',
    anchor: 'seahawks-season-opener',
    label: 'FOOTBALL WATCH PARTY',
    datetime: 'Wednesday, September 9, 2026 · 5:00 PM',
    title: 'Seahawks Season Opener',
    vibe: 'Twelfth Man Spirit',
    vibeAccentIndexes: [1, 2],
    image: '/art/seahawks.webp',
    imageAlt: 'Four guests in Seahawks gear at a game-day watch party',
    imageWidth: 1300,
    imageHeight: 1257,
    rsvpUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScxUkCDBMpNt1xRp4Qe1BiSN5k7LaoW-4j6-K7MjtFxvmhWCg/viewform',
    bonus: {
      eyebrow: 'OPTIONAL AFTERPARTY',
      lead: "If you're still in town a few days later…",
    },
    note: 'Quite the summer for rings in Seattle. Join us to celebrate Abha, Udit, and the Seahawks as they all run it back for more. Go Hawks!',
  },
]
