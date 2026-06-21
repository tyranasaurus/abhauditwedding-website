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
  href: string
  accent: 'sunset' | 'carnival' | 'forest'
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
]

// The two interactive companion pages we link out to.
export interface ExploreCard {
  href: string
  kicker: string
  title: string
  blurb: string
  image: string
  imageAlt: string
  cue: string
}

export const exploreCards: ExploreCard[] = [
  {
    href: '/wardrobe',
    kicker: 'What to Wear',
    title: 'Wardrobe Guide',
    blurb:
      'Inspiration for every event, from the Sunset Shaadi to the Sangeet. Ethnic and Western ideas, plus notes on the sun, grass, and dancing.',
    image: '/art/shaadi.webp',
    imageAlt: 'Watercolor of guests dressed for the ceremony',
    cue: 'Open the guide',
  },
  {
    href: '/map',
    kicker: 'Where to Go',
    title: 'Venue Map',
    blurb:
      'A hand-painted map of Carnation Farms. Find each celebration, guest parking, and the drive into the riverside meadow.',
    image: '/art/map/aerial.webp',
    imageAlt: 'Watercolor aerial map of the wedding grounds',
    cue: 'Explore the grounds',
  },
]

// Travel ----------------------------------------------------------------
export const travel = {
  intro:
    'The wedding lands on Labor Day weekend, so book early and give yourself room to wander the Pacific Northwest.',
  notes: [
    {
      title: 'Getting In',
      body: 'We recommend booking flights to Seattle–Tacoma International Airport (SEA) early, since the wedding falls on Labor Day weekend and fares climb fast.',
      link: {
        label: 'Seattle–Tacoma International Airport',
        href: 'https://www.google.com/maps/search/?api=1&query=Seattle%E2%80%93Tacoma+International+Airport',
      },
    },
    {
      title: 'Getting to Redmond',
      body: "No rental car? Take the Link Light Rail from SeaTac to the Downtown Redmond stop — the hotel is a 3–4 minute walk away. Redmond also runs RedLink, a free, on-demand, all-electric ride service for getting around town and to and from the light rail.",
      link: {
        label: 'Details on RedLink',
        href: 'https://www.redmond.gov/2423/RedLink',
      },
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
      note: '',
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
  intro:
    "Here is the hotel block. We'd love for everyone to stay close, so grab your spot before rooms fill up!",
  hotel: {
    name: 'Hilton Garden Inn',
    area: 'Downtown Redmond',
    address: 'Hilton Garden Inn Redmond Seattle, Redmond Way, Redmond, WA',
    rooms: '50 rooms reserved',
    rate: '$180 / night',
    bookBy: 'Book by August 14, 2026',
    cutoffNote:
      "The group cutoff is 8/14/26 — the booking link stops working after that date, so reserve before then.",
    bookUrl:
      'https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=LKEGIGI&arrivalDate=2026-09-04&departureDate=2026-09-06&groupCode=99K&room1NumAdults=1',
  },
  more: {
    label: 'Browse more vacation rentals',
    href: 'https://www.vrbo.com/search?adults=2&destination=Carnation%20Farms&latLong=47.6754153%2C-121.95186849999999&sort=RECOMMENDED',
  },
} as const

// Q & A -----------------------------------------------------------------
export interface Faq {
  q: string
  a: string
}

export const faqs: Faq[] = [
  {
    q: 'When is the RSVP deadline?',
    a: 'Please RSVP by June 30th to allow us to finalize our arrangements.',
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
    a: 'We recommend waiting for the hotel block for competitive pricing, but you are more than welcome to choose lodging that best suits you.',
  },
  {
    q: 'Is the wedding indoors or outdoors?',
    a: 'Our Wedding Ceremony is outdoors, but our Reception will be inside.',
  },
  {
    q: 'What should I wear?',
    a: 'We put together a full wardrobe guide with ideas for every event — open the Wardrobe Guide for ethnic and Western inspiration.',
  },
  {
    q: 'What airport should I fly into?',
    a: 'We recommend Seattle–Tacoma International Airport (SEA), booked early since the wedding is on Labor Day weekend. We are still finalizing transportation options to the venue — stay tuned!',
  },
  {
    q: 'Where should I park?',
    a: 'There is plenty of parking at the garage at Carnation Farms. A shuttle will take you straight from the garage to the event.',
  },
  {
    q: 'Can I take photos during the wedding?',
    a: 'To let our professional team capture the best views, we ask that you enjoy the Ceremony without phones or cameras. Snap away during the festivities that follow — just be mindful of our photographers, videographers, and their equipment.',
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
