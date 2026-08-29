/** The sky conditions the forecast can describe. */
export type SkyKind =
  | 'clear'
  | 'mainly clear'
  | 'partly cloudy'
  | 'overcast'
  | 'fog'
  | 'showers'
  | 'rain'
  | 'snow'
  | 'thunderstorms'

/** A stroked path. `mask` fills it with the paper so it occludes what it overlaps. */
interface Shape {
  d: string
  mask?: true
}

// One cloud, drawn at three sizes and reused, so the wet conditions read as the
// same cloud with something falling out of it rather than nine drawings.
const CLOUD: Shape = {
  d: 'M7.6 16h9a3.5 3.5 0 0 0 .32-6.98 5 5 0 0 0-9.52-1.1A3.9 3.9 0 0 0 7.6 16Z',
}
const CLOUD_LOW: Shape = {
  d: 'M7.6 19h9a3.5 3.5 0 0 0 .32-6.98 5 5 0 0 0-9.52-1.1A3.9 3.9 0 0 0 7.6 19Z',
}
// The two sun-and-cloud glyphs: the cloud is filled so the sun reads as behind
// it rather than as a circle with a line drawn through it.
const CLOUD_BIG: Shape = {
  d: 'M10.2 19.6h6.8a3.35 3.35 0 0 0 .3-6.68 4.75 4.75 0 0 0-9.05-1.05A3.7 3.7 0 0 0 10.2 19.6Z',
  mask: true,
}
const CLOUD_SMALL: Shape = {
  d: 'M12.2 19.6h5.6a2.85 2.85 0 0 0 .26-5.68 4.05 4.05 0 0 0-7.7-.9A3.15 3.15 0 0 0 12.2 19.6Z',
  mask: true,
}

const SHAPES: Record<SkyKind, Shape[]> = {
  clear: [
    { d: 'M12 6.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8Z' },
    {
      d:
        'M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6' +
        'M4.7 4.7l1.9 1.9M17.4 17.4l1.9 1.9M19.3 4.7l-1.9 1.9M6.6 17.4l-1.9 1.9',
    },
  ],
  'mainly clear': [
    { d: 'M8.4 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' },
    { d: 'M8.4 0.5v1.9M1.4 7.5h1.9M13.4 7.5h1.6M3.3 2.4l1.35 1.35M13.5 2.4l-1.35 1.35' },
    CLOUD_SMALL,
  ],
  'partly cloudy': [
    { d: 'M7.9 3.3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z' },
    { d: 'M7.9 0.6v1.7M1.6 6.8h1.7M3.2 2.3l1.25 1.25M12.6 2.3l-1.25 1.25' },
    CLOUD_BIG,
  ],
  overcast: [CLOUD_LOW],
  fog: [CLOUD, { d: 'M6 19.4h12M8.6 22.2h6.8' }],
  showers: [CLOUD, { d: 'M9.8 18.4l-1.1 2.8M14.4 18.4l-1.1 2.8' }],
  rain: [CLOUD, { d: 'M8.6 18.4l-1 2.8M12.2 18.4l-1 2.8M15.8 18.4l-1 2.8' }],
  snow: [CLOUD, { d: 'M12 17.8v4.6M10 19l4 2.2M14 19l-4 2.2' }],
  thunderstorms: [CLOUD, { d: 'M13.6 17.4 10.6 21.4h2.7l-1.1 2.4' }],
}

/**
 * The sky, drawn in line art rather than set as an emoji. The emoji were the
 * only glossy raster artwork on a hand-painted page, and they took their colour
 * from the vendor's font instead of the line they sit in.
 */
export function SkyGlyph({ kind }: { kind: SkyKind }) {
  return (
    <svg
      className="sched-sky"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[kind].map((shape) => (
        <path key={shape.d} d={shape.d} fill={shape.mask ? 'var(--paper)' : undefined} />
      ))}
    </svg>
  )
}
