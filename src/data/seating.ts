export interface SeatingTable {
  number: number
  /** Table center as a percentage of the floor-plan image. */
  x: number
  y: number
  /** Tabletop radius as a percentage of the image width. */
  r: number
}

export const seatingIntro = {
  title: 'Find your seat',
} as const

// Positions are measured against the watercolor floor plan
// (public/art/map/seating-floorplan.webp, 1600×1987) by finding each painted
// tabletop and taking its bounding box's centre and radius, so the highlight
// ring hugs the table edge. The box rather than the centroid: an unevenly
// painted wash drags a centroid toward its darker side, which left table 19
// sitting visibly off its tabletop. They are DERIVED from the artwork, not hand-placed: a
// redraw of the plan invalidates every one of them, so re-measure rather than
// nudge. Numbering runs up the hall — table 0 is the bottom-left pair.

export const tables: SeatingTable[] = [
  { number: 0, x: 15, y: 75.25, r: 4.5 },
  { number: 1, x: 85, y: 75.25, r: 4.56 },
  { number: 2, x: 15.11, y: 59.09, r: 4.41 },
  { number: 3, x: 84.94, y: 59.09, r: 4.44 },
  { number: 4, x: 18.44, y: 44, r: 4.5 },
  { number: 5, x: 32.56, y: 44, r: 4.44 },
  { number: 6, x: 67.5, y: 44, r: 4.41 },
  { number: 7, x: 81.56, y: 44, r: 4.44 },
  { number: 8, x: 12.5, y: 28.92, r: 4.5 },
  { number: 9, x: 25.39, y: 28.92, r: 4.44 },
  { number: 10, x: 38.5, y: 28.96, r: 4.41 },
  { number: 11, x: 61.61, y: 28.96, r: 4.41 },
  { number: 12, x: 74.44, y: 28.92, r: 4.35 },
  { number: 13, x: 87.56, y: 28.96, r: 4.5 },
  { number: 14, x: 12.5, y: 13.79, r: 4.5 },
  { number: 15, x: 25.5, y: 13.83, r: 4.41 },
  { number: 16, x: 38.5, y: 13.97, r: 4.44 },
  { number: 17, x: 61.44, y: 13.79, r: 4.35 },
  { number: 18, x: 73.94, y: 13.97, r: 4.09 },
  { number: 19, x: 87.5, y: 13.88, r: 4.44 },
]

/** Fold accents and punctuation so "Renee" finds "Renée" and "Dsouza" finds
 *  "D'Souza" — guests type their own name from memory, not from the list.
 *  Shared by the seat finder and the table list, so both match alike. */
export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

export interface Guest {
  name: string
  table: number
}

// The roster — every guest by table, transcribed from the reception seating
// sheet — shipped here for the wedding and was retired on 2026-10-07. The site
// outlives the day, and a public page listing 170 people by full name has no
// business outliving it with them. The list is in git history (d308591 is the
// last commit that carried it). The empty record keeps the finder, the table
// card and the /reception/tables list compiling; each simply has nobody to
// show, and the reception page drops its finder when the list is empty.
const tableGuests: Record<number, string[]> = {}

// Flattened for the list and the search box. Names are not unique — two
// different guests share a first name — so the table is part of each key.
export const guests: Guest[] = Object.entries(tableGuests).flatMap(
  ([table, names]) => names.map((name) => ({ name, table: Number(table) })),
)
