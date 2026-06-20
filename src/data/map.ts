export type MapAccent = 'sunset' | 'carnival' | 'forest' | 'slate'

export interface MapPoi {
  id: string
  accent: MapAccent
  /** Hand-painted watercolor icon shown in the marker and legend. */
  icon: string
  kicker: string
  title: string
  when: string
  blurb: string
  /** Where the marker links, or null for a non-navigable marker (parking). */
  href: string | null
  /** Marker position as a percentage of the square map image. */
  x: number
  y: number
  /** Which way the always-visible label fans so markers never collide. */
  labelSide: 'left' | 'right'
}

export const mapIntro = {
  kicker: 'Abha & Udit · September 5–6, 2026',
  title: 'Carnation Farms',
  blurb:
    'Three celebrations across one riverside meadow. Tap a marker, or the key below, to see when to arrive and what to wear.',
} as const

export const venue = {
  addressLines: ['28901 NE Carnation Farm Road', 'Carnation, WA 98014'],
  pin: '/art/map/gmaps-pin.webp',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Carnation%20Farms%2C%2028901%20NE%20Carnation%20Farm%20Road%2C%20Carnation%2C%20WA%2098014',
} as const

// Positions are tuned against the watercolor aerial (public/art/map/aerial.webp).
export const pois: MapPoi[] = [
  {
    id: 'sunset-shaadi',
    accent: 'sunset',
    icon: '/art/map/icon-sunset.webp',
    kicker: 'Ceremony',
    title: 'Sunset Shaadi',
    when: 'Sat · Sep 5 · 4:00 PM',
    blurb: 'Vows in the meadow as the light turns gold.',
    href: '/wardrobe#sunset-shaadi',
    x: 13.5,
    y: 42,
    labelSide: 'right',
  },
  {
    id: 'carnegie-to-carnation',
    accent: 'carnival',
    icon: '/art/map/icon-carnival.webp',
    kicker: 'Baraat & Carnival',
    title: 'From Carnegie to Carnation',
    when: 'Sun · Sep 6 · 10:00 AM',
    blurb: 'A garden carnival and lawn games on the big field.',
    href: '/wardrobe#carnegie-to-carnation',
    x: 39,
    y: 71.5,
    labelSide: 'left',
  },
  {
    id: 'naach-the-night-away',
    accent: 'forest',
    icon: '/art/map/icon-sangeet.webp',
    kicker: 'Sangeet Reception',
    title: 'Naach the Night Away',
    when: 'Sun · Sep 6 · 5:00 PM',
    blurb: 'Dinner, dosti, and dancing in the red barn.',
    href: '/wardrobe#naach-the-night-away',
    x: 46,
    y: 88,
    labelSide: 'left',
  },
  {
    id: 'parking',
    accent: 'slate',
    icon: '/art/map/icon-parking.webp',
    kicker: 'Arrive & Park',
    title: 'Guest Parking',
    when: 'Throughout the weekend',
    blurb: 'Pull into the big barn lot, then stroll in.',
    href: null,
    x: 75,
    y: 76.5,
    labelSide: 'left',
  },
]
