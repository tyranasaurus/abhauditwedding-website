import { memo } from 'react'
import {
  DEFAULT_LABEL_SIZE,
  ringPath,
  smoothPath,
  type MapLayer,
  type MapSticker,
} from '@/data/venue-map'

/** How the reception's seating talks to the map. */
export interface TableSelection {
  /** The guest's own table, marked so it can be found at a glance. */
  yours: number | null
  /** The table being looked at right now. */
  lit: number | null
  onSelect?: (table: number) => void
}


/**
 * A layer as guests see it: four independent lists drawn in order — regions as
 * tinted polygons, paths as marching dashed lines, labels wherever they were
 * placed, and art as stickers. Nothing here derives one from another; a region
 * with no label is silent, and a label with no region is fine.
 *
 * Purely presentational — the editor draws the same things with its own
 * handles, and the two share only the CSS vocabulary.
 *
 * Memoised, and that matters: panning and the zoom glide change the canvas's
 * transform up to 60 times a second, and without this every one of those
 * frames would reconcile every polygon, plate and sticker underneath it. None
 * of this depends on the transform, so it can sit still while the map moves.
 */
export const MapLayerOverlay = memo(function MapLayerOverlay({
  layer,
  stamps,
  onToggleActivity,
  tables,
}: {
  layer: MapLayer
  /** Passport activities already collected, for the carnival's stickers. */
  stamps?: Set<string>
  onToggleActivity?: (activity: string) => void
  /** The reception's seating state: which table the guest is sitting at,
   *  which one is currently being looked at, and how to look at another. */
  tables?: TableSelection
}) {
  return (
    <>
      {/* Under everything: the cut-away drawing, if this layer has one. It is
          part of the ground, not a marker, so nothing here reacts to it. */}
      {layer.inset ? (
        <img
          className="mx-inset"
          src={layer.inset.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            left: `${layer.inset.x - layer.inset.w / 2}%`,
            top: `${layer.inset.y - layer.inset.h / 2}%`,
            width: `${layer.inset.w}%`,
            height: `${layer.inset.h}%`,
          }}
        />
      ) : null}

      <svg
        className="mx-shapes"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {layer.areas.map((area) => (
          <path
            key={area.id}
            className={`mx-area accent-${area.accent}`}
            d={ringPath(area.points)}
          />
        ))}
        {layer.paths.map((path) => (
          <g key={path.id} className={`accent-${path.accent}`}>
            <path className="mx-path-casing" d={smoothPath(path.points)} />
            <path className="mx-path-line" d={smoothPath(path.points)} />
          </g>
        ))}
      </svg>

      {layer.labels.map((label) => (
        <span
          key={label.id}
          className={`mx-plate accent-${label.accent}`}
          style={
            {
              left: `${label.x}%`,
              top: `${label.y}%`,
              '--label-size': label.size ?? DEFAULT_LABEL_SIZE,
            } as React.CSSProperties
          }
        >
          {label.text}
        </span>
      ))}

      {layer.stickers.map((sticker) => (
        <StickerArt
          key={sticker.id}
          sticker={sticker}
          tables={tables}
          stamped={!!sticker.activity && !!stamps?.has(sticker.activity)}
          onToggle={
            sticker.activity && onToggleActivity
              ? () => onToggleActivity(sticker.activity!)
              : undefined
          }
        />
      ))}
    </>
  )
})

function StickerArt({
  sticker,
  stamped,
  onToggle,
  tables,
}: {
  sticker: MapSticker
  stamped: boolean
  onToggle?: () => void
  tables?: TableSelection
}) {
  const number = tableNumber(sticker)
  const isTable = number !== null
  const yours = isTable && tables?.yours === number
  const lit = isTable && tables?.lit === number
  const selectTable =
    isTable && tables?.onSelect ? () => tables.onSelect!(number) : undefined
  // Sticker-effect artwork is exported with its white rim and soft shadow
  // already in the pixels. Keeping those effects out of CSS means moving the
  // map is only compositing images, never rerunning several alpha filters per
  // sticker per frame.
  const src =
    sticker.stickerEffect === false
      ? sticker.src
      : sticker.src.replace(
          '/art/map/',
          onToggle && !stamped ? '/art/map/baked/todo/' : '/art/map/baked/',
        )

  return (
    <div
      className={`carnival-map-item${
        onToggle || selectTable ? ' is-interactive' : ''
      }${onToggle && !stamped ? ' is-todo' : ''}${
        sticker.stickerEffect === false ? ' is-static' : ''
      }${yours ? ' is-yours' : ''}${lit ? ' is-lit' : ''}`}
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.width}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.angle}deg)`,
      }}
      {...(selectTable
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-pressed': lit,
            'aria-label': yours ? `Table ${number} — your table` : `Table ${number}`,
            onClick: selectTable,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                selectTable()
              }
            },
          }
        : {})}
      {...(onToggle
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-pressed': stamped,
            'aria-label': sticker.name,
            onClick: onToggle,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle()
              }
            },
          }
        : {})}
    >
      <img src={src} alt="" aria-hidden="true" draggable={false} />
      {isTable ? <span className="mx-table-number">{number}</span> : null}
    </div>
  )
}

/** A seating table announces its own number over the artwork, so the map is
 *  the seating chart rather than something to cross-reference against one.
 *  Read off the id — `table_7` — which is what the editor names them. */
function tableNumber(sticker: MapSticker): number | null {
  const match = /^table_(\d+)$/.exec(sticker.id)
  return match ? Number(match[1]) : null
}
