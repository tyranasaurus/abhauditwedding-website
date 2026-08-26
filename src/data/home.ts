// All content transferred from withjoy.com/abhauditwedding, restyled for our
// watercolor wedding-card site. Schedule entries deep-link into the schedule
// page (/schedule#<anchor>), which also carries the wardrobe guidance.

export const hero = {
  names: 'Abha & Udit',
  date: 'September 5–6, 2026',
  venue: 'Carnation Farms · Carnation, Washington',
} as const

// The big weekend at a glance. Each links into the schedule page, where that
// event's timings and dress code live. Times here are when to arrive.
export interface ScheduleStop {
  day: string
  date: string
  kind: string
  time: string
  title: string
  /** Schedule page anchor for this event's times and dress code. */
  href?: string
  accent: 'sunset' | 'carnival' | 'forest' | 'slate'
}

export const schedule: ScheduleStop[] = [
  {
    day: 'Saturday',
    date: 'September 5, 2026',
    kind: 'Wedding Ceremony',
    time: '3:30 PM',
    title: 'Sunset Shaadi',
    href: '/schedule#sunset-shaadi',
    accent: 'sunset',
  },
  {
    day: 'Sunday',
    date: 'September 6, 2026',
    kind: 'Baraat & Carnival',
    time: '10:00 AM',
    title: 'From Carnegie to Carnation',
    href: '/schedule#carnegie-to-carnation',
    accent: 'carnival',
  },
  {
    day: 'Sunday',
    date: 'September 6, 2026',
    kind: 'Sangeet Reception',
    time: '4:30 PM',
    title: 'Naach the Night Away',
    href: '/schedule#naach-the-night-away',
    accent: 'forest',
  },
  {
    day: 'Wednesday',
    date: 'September 9, 2026',
    kind: 'Season Opener Watch Party',
    time: '5:00 PM',
    title: 'Seahawks Season Opener',
    href: '/schedule#seahawks-season-opener',
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
    "The wedding lands on Labor Day weekend in the Seattle area — here's how to get around, plus a few of our favorite spots.",
  notes: [
    {
      title: 'From the Airport',
      body: "From SEA airport, you should be able to take the Link Light Rail all the way to Downtown Redmond Station. That's a very short walk from the Hilton Garden Inn and many other hotels, and it's a cute little downtown worth spending some time in. From there the wedding venue is a 20-minute drive — you will need a rental car or a carpool! Reach out to us if you would like help with a carpool.",
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
      name: 'Can Am Bellevue',
      note: 'The BEST Indian pizza — Udit would vacuum-pack slices to bring back to Abha @ CMU.',
      query: 'Can Am Pizza, Bellevue, WA',
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
// The group block closed on 14 August 2026 and its booking link now 403s, so
// the rate, cutoff and URL are gone. The hotel is still where most guests are.
export const stay = {
  hotel: {
    name: 'Hilton Garden Inn',
    area: 'Downtown Redmond',
  },
} as const

// Registry --------------------------------------------------------------
export const registry = {
  /** Deep link straight to the fund on Joy, past the couple picker. */
  url: 'https://withjoy.com/abhauditwedding/registry?pid=b3e72f03-4062-4a06-bebf-f714fb8c8a49',
  kicker: 'Our registry',
  title: 'Adventure Fund',
  paragraphs: [
    'Your presence at Carnation Farms is the whole gift. Getting to celebrate these two days with you is more than we could ask for.',
    'We have not put together a list of things. Our registry is a single Adventure Fund, and anything you send goes toward the trips ahead of us.',
  ],
  cta: 'Give to the Adventure Fund',
  note: 'Opens withjoy.com in a new tab.',
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
    q: 'What should I wear?',
    a: 'Every event has its own look, and each one is on the schedule alongside the times. But more than anything, we care that you feel comfortable, stay safe, and are there with us on time. Your presence to enjoy with us matters far more than any specific outfit.',
    link: { label: 'Open the Schedule', href: '/schedule' },
  },
  {
    q: 'I am coming from out of town. Where should I stay?',
    a: `Most of our guests are staying in ${stay.hotel.area} — the ${stay.hotel.name} and several other hotels are a short walk from the Link light rail station, and the venue is about a 20-minute drive from there.`,
  },
  {
    q: 'Can we join the baraat?',
    a: 'Please do! Abha and Udit are both leading the baraat, and we would love all of our friends and family to join us in the procession and open up the carnival together.',
  },
  {
    q: 'Will there be vegetarian food?',
    a: 'All of the food at our events is vegetarian.',
  },
  {
    q: 'Is the wedding indoors or outdoors?',
    a: 'Our Wedding Ceremony and Carnival are outdoors, but our Reception will be inside.',
  },
  {
    q: 'Do you have a registry?',
    a: 'We do, though it is not a list of things — just a single Adventure Fund. Your presence means the most to us, but if you would like to give, you can find it here:',
    link: { label: 'Visit our Adventure Fund', href: registry.url },
  },
  {
    q: 'Where should I park?',
    a: `There is plenty of parking at the garage at Carnation Farms. A shuttle will take you straight from the garage to the event. The ${stay.hotel.name} also offers free parking for hotel guests.`,
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
