export interface WardrobeEvent {
  /** Section accent palette, set per className in index.css. */
  className: 'sunset-ceremony' | 'carnival-garden' | 'forest-gala'
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
  ethnic: string
  western: string
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
    western: 'Summer Cocktail Attire',
    note: 'Dinner will be at dusk, so light layers could help ward off the evening chill.',
  },
  {
    className: 'carnival-garden',
    label: 'BARAAT & CARNIVAL',
    datetime: 'Sunday, September 6, 2026 · 10:00 AM',
    title: 'From Carnegie to Carnation',
    vibe: 'Colorful Summer Garden',
    vibeAccentIndexes: [1, 2],
    image: '/art/carnival.webp',
    imageAlt: 'Four guests dressed for the Baraat and Carnival',
    imageWidth: 1074,
    imageHeight: 1144,
    ethnic: 'Indian Wedding Casual',
    western: 'Summer Dressy Casual',
    note: 'Dress for the sun and lawn games. Abha is skipping the heels, and you can too!',
  },
  {
    className: 'forest-gala',
    label: 'SANGEET RECEPTION',
    datetime: 'Sunday, September 6, 2026 · 5:00 PM',
    title: 'Naach the Night Away',
    vibe: 'Glitz and Glamour',
    vibeAccentIndexes: [1, 2],
    image: '/art/reception.webp',
    imageAlt: 'Four guests dressed for the Sangeet reception',
    imageWidth: 1053,
    imageHeight: 1102,
    ethnic: 'Formal Evening Ethnics or Indo-Westerns',
    western: 'Creative Cocktail Attire',
    note: 'Dinner, dosti, and dance!',
  },
]
