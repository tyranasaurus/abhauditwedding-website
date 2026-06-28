// All content transferred from withjoy.com/abhauditwedding, restyled for our
// watercolor wedding-card site. Schedule entries deep-link into the wardrobe
// guide (/wardrobe#<anchor>) and venue map (/map).

export const hero = {
  names: 'Abha & Udit',
  date: 'September 5–6, 2026',
  venue: 'Carnation Farms · Carnation, Washington',
  rsvpUrl: 'https://withjoy.com/abhauditwedding/rsvp',
} as const

// The big weekend at a glance. Each links into the wardrobe guide where the
// dress code for that event lives.
export interface ScheduleStop {
  day: string
  date: string
  kind: string
  time: string
  title: string
  /** Wardrobe guide anchor for this event's dress code. */
  href?: string
  /** A standalone RSVP link for this event only (opens in a new tab). When set,
   *  the card links here and shows an RSVP cue instead of the wardrobe link. */
  rsvpUrl?: string
  accent: 'sunset' | 'carnival' | 'forest' | 'slate'
}

export const schedule: ScheduleStop[] = [
  {
    day: 'Saturday',
    date: 'September 5, 2026',
    kind: 'Wedding Ceremony',
    time: '4:00 PM',
    title: 'Sunset Shaadi',
    href: '/wardrobe#sunset-shaadi',
    accent: 'sunset',
  },
  {
    day: 'Sunday',
    date: 'September 6, 2026',
    kind: 'Baraat & Carnival',
    time: '10:00 AM',
    title: 'From Carnegie to Carnation',
    href: '/wardrobe#carnegie-to-carnation',
    accent: 'carnival',
  },
  {
    day: 'Sunday',
    date: 'September 6, 2026',
    kind: 'Sangeet Reception',
    time: '5:00 PM',
    title: 'Naach the Night Away',
    href: '/wardrobe#naach-the-night-away',
    accent: 'forest',
  },
  {
    day: 'Wednesday',
    date: 'September 9, 2026',
    kind: 'Season Opener Watch Party',
    time: '5:00 PM',
    title: 'Seahawks Season Opener',
    href: '/wardrobe#seahawks-season-opener',
    rsvpUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScxUkCDBMpNt1xRp4Qe1BiSN5k7LaoW-4j6-K7MjtFxvmhWCg/viewform',
    accent: 'slate',
  },
]

// The two interactive companion pages we link out to.
export interface ExploreCard {
  href: string
  kicker: string
  title: string
  blurb?: string
  image: string
  imageAlt: string
  cue: string
}

export const exploreCards: ExploreCard[] = [
  {
    href: '/wardrobe',
    kicker: 'What to Wear',
    title: 'Wardrobe Guide',
    image: '/art/shaadi.webp',
    imageAlt: 'Watercolor of guests dressed for the ceremony',
    cue: 'Open the guide',
  },
  // The Venue Map card is parked while /map is unlinked (see App.tsx / MapPage.tsx).
]

// Travel ----------------------------------------------------------------
export const travel = {
  intro:
    "The wedding lands on Labor Day weekend in the Seattle area — here's how to get around, plus where to stay.",
  notes: [
    {
      title: 'Getting In',
      body: 'Fly into Seattle–Tacoma International Airport (SEA), or Paine Field (PAE) in Everett for a smaller alternative. While you can take public transport all the way to Downtown Redmond and the hotel, getting from there to Carnation is very hard without a car. We recommend a rental car, or carpooling with another group that has one.',
    },
  ],
  seattleSpots: [
    { name: 'Pike Place Market', note: '', query: 'Pike Place Market, Seattle, WA' },
    { name: 'Kerry Park', note: 'The classic skyline view.', query: 'Kerry Park, Seattle, WA' },
    { name: 'The Museum of Flight', note: '', query: 'The Museum of Flight, Seattle, WA' },
    {
      name: 'Bainbridge Island Ferry',
      note: 'Ride across the Puget Sound.',
      query: 'Seattle Bainbridge Island Ferry Terminal Colman Dock',
    },
    {
      name: 'Seattle Underground Tour',
      note: '',
      query: "Bill Speidel's Underground Tour, Seattle, WA",
    },
    {
      name: 'Kirkland Waterfront',
      note: '',
      query: 'Marina Park Kirkland Waterfront, Kirkland, WA',
    },
  ],
  eastsideBites: [
    {
      name: "Victor's Celtic Coffee & Roasters",
      note: 'Our favorite spot to unplug.',
      query: "Victor's Celtic Coffee & Roasters, Redmond, WA",
    },
    {
      name: 'Can Am',
      note: 'The BEST Indian pizza — Udit would vacuum-pack slices to bring back to Abha @ CMU.',
      query: 'Can Am Pizza, Redmond, WA',
    },
    {
      name: 'CHICHA San Chen',
      note: "Abha's favorite boba.",
      query: 'CHICHA San Chen, Bellevue, WA',
    },
    {
      name: 'Japonessa',
      note: 'We love their signature vegetarian sushi.',
      query: 'Japonessa Sushi Cocina, Bellevue, WA',
    },
    {
      name: 'Village Square Cafe',
      note: 'The go-to spot for group brunch — everyone loves the pancakes!',
      query: 'Village Square Cafe, Redmond, WA',
    },
    {
      name: 'Qamaria Yemeni Coffee Co.',
      note: 'Desi-owned — Udit recommends the saffron tres leches.',
      query: 'Qamaria Yemeni Coffee Co., Redmond, WA',
    },
  ],
} as const

/** Google Maps search link for a travel spot, used to make each name tappable. */
export function mapsSearch(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

// Where to stay ---------------------------------------------------------
export const stay = {
  intro: "Here is the hotel block — we'd love for everyone to stay close.",
  hotel: {
    name: 'Hilton Garden Inn',
    area: 'Downtown Redmond',
    address: 'Hilton Garden Inn Redmond Seattle, Redmond Way, Redmond, WA',
    rate: '$180 / night',
    bookBy: 'Book by August 14, 2026',
    cutoffNote:
      "The group cutoff is 8/14/26 — the booking link stops working after that date, so please reserve before then.",
    bookUrl:
      'https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=LKEGIGI&arrivalDate=2026-09-04&departureDate=2026-09-06&groupCode=99K&room1NumAdults=1',
  },
} as const

// Q & A -----------------------------------------------------------------
export interface Faq {
  q: string
  a: string
  /** Optional call-to-action link rendered beneath the answer. */
  link?: { label: string; href: string }
}

export const faqs: Faq[] = [
  {
    q: 'When is the RSVP deadline?',
    a: 'Please RSVP by June 30th to allow us to finalize our arrangements.',
  },
  {
    q: 'What should I wear?',
    a: 'We created a wardrobe guide for inspiration. But more than anything, we care that you feel comfortable, stay safe, and are there with us on time. Your presence to enjoy with us matters far more than any specific outfit.',
    link: { label: 'Open the Wardrobe Guide', href: '/wardrobe' },
  },
  {
    q: 'Can I bring a date?',
    a: 'Due to the intimate nature of our celebration, we ask that you only RSVP for the number of seats reserved for your party.',
  },
  {
    q: 'What will the weather be like?',
    a: 'During the day, Seattle should be beautiful and sunny, averaging around 75–80°F, but it can get chilly at night.',
  },
  {
    q: 'I am coming from out of town. Where should I stay?',
    a: `We've reserved a block of rooms at the ${stay.hotel.name} in ${stay.hotel.area} at a special group rate. Reserve yours before the ${stay.hotel.bookBy.replace('Book by ', '')} cutoff:`,
    link: { label: 'Reserve your room', href: stay.hotel.bookUrl },
  },
  {
    q: 'Is the wedding indoors or outdoors?',
    a: 'Our Wedding Ceremony and Carnival are outdoors, but our Reception will be inside.',
  },
  {
    q: 'Where should I park?',
    a: 'There is plenty of parking at the garage at Carnation Farms. A shuttle will take you straight from the garage to the event.',
  },
  {
    q: 'Are the locations wheelchair accessible?',
    a: 'Yes! Please let us know if you require any specific accommodations.',
  },
]

export const venue = {
  name: 'Carnation Farms',
  addressLines: ['28901 NE Carnation Farm Road', 'Carnation, WA 98014'],
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Carnation%20Farms%2C%2028901%20NE%20Carnation%20Farm%20Road%2C%20Carnation%2C%20WA%2098014',
} as const
