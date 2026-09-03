import doc from '@/data/venue-map.json'

/**
 * Everything drawn on the grounds map, for every event, in one document.
 *
 * The document is edited in the browser at `/map-editor` and saved back to
 * `venue-map.json` next to this file; every live map view reads it from here.
 * Nothing in this module knows about the editor — the editor is one writer of
 * a format the views read.
 *
 * A layer is four independent lists — areas, paths, labels, stickers — plus
 * one focus rectangle. Nothing implies anything else: an area does not carry
 * its own label, a path does not carry end plates. If a region should be
 * named, place a label; if two regions share a name, that is one label. Every
 * piece is positioned and deleted on its own.
 *
 * All geometry is in the grounds artwork's own 0–100 space (percent of the
 * painting's width and height), so it survives the art being re-exported at a
 * different pixel size. `x`/`y` on a rect, label, or sticker is its CENTER.
 */

/** A point in the artwork's 0–100 space. */
export interface MapPoint {
  x: number
  y: number
}

/**
 * The rectangle an event's map may never show past: the furthest a guest can
 * zoom out. Viewport geometry rather than a painted feature, so it is always
 * axis-aligned — a rotated bound cannot be honoured by a rectangular screen.
 */
export interface MapFocus {
  x: number
  y: number
  w: number
  h: number
}

/** The named accent families a drawn thing can carry. */
export type MapAccentName =
  | 'sunset'
  | 'carnival'
  | 'copper'
  | 'forest'
  | 'rose'
  | 'gold'
  | 'slate'

/**
 * A region of the grounds: any closed polygon, three points or more. `name`
 * identifies it in the editor's list — it is never drawn. Put words on the map
 * with a `MapLabel`.
 */
export interface MapArea {
  id: string
  name: string
  accent: MapAccentName
  points: MapPoint[]
}

/** A walking route: an open polyline, smoothed into rounded corners. */
export interface MapPath {
  id: string
  name: string
  accent: MapAccentName
  points: MapPoint[]
}

/**
 * Words on the map, placed wherever they belong and nowhere else.
 *
 * `size` is the type size in MAP units — percent of the artwork's width — not
 * screen pixels, so a label keeps the same relationship to the ground it names
 * on every screen and at every zoom. Laid out once, it reads the same
 * everywhere. Absent on labels written before sizing existed; treat that as
 * `DEFAULT_LABEL_SIZE`.
 */
export interface MapLabel {
  id: string
  text: string
  accent: MapAccentName
  x: number
  y: number
  size?: number
}

/** Type size for a label with no size of its own, in map units. */
export const DEFAULT_LABEL_SIZE = 0.25

/**
 * Type size for a label newly placed on a layer, in map units. Scaled to the
 * layer's focus rectangle so it lands legible on that event's own map rather
 * than at some size that only suits the whole estate, and large enough that
 * the readability floor in `.mx-plate` stays out of the way on ordinary
 * screens — once that floor engages, the label starts growing relative to the
 * map again, which is the whole thing map units exist to prevent.
 */
export const labelSizeFor = (focus: MapFocus) => round1(focus.w * 0.018) || 0.3

/** A piece of cutout art placed on the map — the carnival's booths and games. */
export interface MapSticker {
  id: string
  name: string
  src: string
  /** The passport activity this sticker checks off, if it has one. */
  activity?: string
  x: number
  y: number
  /** Width as a percentage of the artwork's width. */
  width: number
  angle: number
}

/** One event's drawing on the grounds map. */
export interface MapLayer {
  id: string
  name: string
  /** The `anchor` of the matching event in `events.ts`, or null for a layer
   *  that belongs to no single event. */
  eventAnchor: string | null
  focus: MapFocus
  areas: MapArea[]
  paths: MapPath[]
  labels: MapLabel[]
  stickers: MapSticker[]
}

export interface VenueMapDoc {
  version: 2
  art: {
    src: string
    width: number
    height: number
    /** Camera heading of the source aerial capture — see `grounds` in map.ts. */
    headingDeg: number
  }
  layers: MapLayer[]
}

export const venueMap = doc as VenueMapDoc

export const emptyLayer = (id: string, name: string): MapLayer => ({
  id,
  name,
  eventAnchor: null,
  focus: { x: 50, y: 50, w: 60, h: 60 },
  areas: [],
  paths: [],
  labels: [],
  stickers: [],
})

/* -- geometry ------------------------------------------------------------- */

/**
 * Waypoints to a smooth SVG path in the artwork's 0–100 space: straight runs
 * to the midpoints, each interior waypoint becoming the control of a quadratic
 * bend, so the line rounds the corners the way a walk does.
 */
export function smoothPath(points: MapPoint[]): string {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ''
  const parts = [`M ${first.x} ${first.y}`]
  if (points.length < 3) {
    parts.push(`L ${last.x} ${last.y}`)
    return parts.join(' ')
  }
  for (let i = 1; i < points.length - 1; i++) {
    const bend = points[i]!
    const next = points[i + 1]!
    const endX = i === points.length - 2 ? next.x : (bend.x + next.x) / 2
    const endY = i === points.length - 2 ? next.y : (bend.y + next.y) / 2
    parts.push(`Q ${bend.x} ${bend.y} ${endX} ${endY}`)
  }
  return parts.join(' ')
}

/** A closed polygon as an SVG path in the artwork's 0–100 space. */
export function ringPath(points: MapPoint[]): string {
  if (points.length < 2) return ''
  const [first, ...rest] = points
  return `M ${first!.x} ${first!.y} ${rest
    .map((p) => `L ${p.x} ${p.y}`)
    .join(' ')} Z`
}

/**
 * The polygon's area-weighted centroid — where a label wants to start life
 * when you ask for one on a region. Degenerate rings (all points collinear)
 * fall back to the average of the vertices.
 */
export function centroid(points: MapPoint[]): MapPoint {
  if (!points.length) return { x: 50, y: 50 }
  let twiceArea = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    const cross = a.x * b.y - b.x * a.y
    twiceArea += cross
    cx += (a.x + b.x) * cross
    cy += (a.y + b.y) * cross
  }
  if (Math.abs(twiceArea) < 1e-9) {
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    }
  }
  return { x: cx / (3 * twiceArea), y: cy / (3 * twiceArea) }
}

/** Every point a layer occupies — what "fit the focus to this layer" reads. */
export function layerPoints(layer: MapLayer): MapPoint[] {
  return [
    ...layer.areas.flatMap((area) => area.points),
    ...layer.paths.flatMap((path) => path.points),
    ...layer.labels.map((label) => ({ x: label.x, y: label.y })),
    ...layer.stickers.map((sticker) => ({ x: sticker.x, y: sticker.y })),
  ]
}

/** The smallest axis-aligned rect containing every point, plus some padding. */
export function boundsOf(points: MapPoint[], pad = 0): MapFocus {
  if (!points.length) return { x: 50, y: 50, w: 20, h: 20 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x0 = Math.min(...xs) - pad
  const x1 = Math.max(...xs) + pad
  const y0 = Math.min(...ys) - pad
  const y1 = Math.max(...ys) + pad
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

/**
 * Where along a polyline (or ring) a new vertex belongs: the index to splice
 * at, and how far the click sat from the line. Shared by the area and path
 * tools so clicking any drawn line grows it.
 */
export function nearestSegment(
  points: MapPoint[],
  at: MapPoint,
  closed: boolean,
): { index: number; distance: number } {
  let index = 1
  let distance = Infinity
  const last = closed ? points.length : points.length - 1
  for (let i = 0; i < last; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    const t =
      len2 === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              ((at.x - a.x) * (b.x - a.x) + (at.y - a.y) * (b.y - a.y)) / len2,
            ),
          )
    const d = Math.hypot(
      at.x - (a.x + t * (b.x - a.x)),
      at.y - (a.y + t * (b.y - a.y)),
    )
    if (d < distance) {
      distance = d
      index = i + 1
    }
  }
  return { index, distance }
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

export const round1 = (n: number) => Math.round(n * 10) / 10
