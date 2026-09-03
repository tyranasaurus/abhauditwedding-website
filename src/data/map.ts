export const venue = {
  addressLines: ['28901 NE Carnation Farm Road', 'Carnation, WA 98014'],
  pin: '/art/map/gmaps-pin.webp',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Carnation%20Farms%2C%2028901%20NE%20Carnation%20Farm%20Road%2C%20Carnation%2C%20WA%2098014',
} as const

/**
 * The grounds map (`/art/map/grounds.webp`) is painted from an aerial capture
 * taken at a camera heading of 224°, so the top edge of the art points
 * southwest, not north. Everything that has to agree with a real-world bearing
 * — the compass rose, any "walk toward…" arrow — reads its rotation from here
 * rather than assuming north is up.
 *
 * `northRotationDeg` is where north lands on the art, measured clockwise from
 * straight up: `(360 - headingDeg) % 360`. At heading 224° that puts north at
 * 136°, down and to the right.
 */
export const grounds = {
  art: '/art/map/grounds.webp',
  width: 4200,
  height: 1782,
  /** Camera heading of the source capture, in degrees clockwise from north. */
  headingDeg: 224,
  /** Rotation to apply to a north-up compass rose so it points true north. */
  northRotationDeg: (360 - 224) % 360,
} as const
