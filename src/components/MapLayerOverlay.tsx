import { memo } from 'react'
import {
  DEFAULT_LABEL_SIZE,
  ringPath,
  smoothPath,
  type MapLayer,
  type MapSticker,
} from '@/data/venue-map'

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
}: {
  layer: MapLayer
  /** Passport activities already collected, for the carnival's stickers. */
  stamps?: Set<string>
  onToggleActivity?: (activity: string) => void
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
}: {
  sticker: MapSticker
  stamped: boolean
  onToggle?: () => void
}) {
  return (
    <div
      className={`carnival-map-item${onToggle ? ' is-interactive' : ''}${
        onToggle && !stamped ? ' is-todo' : ''
      }${sticker.stickerEffect === false ? ' is-static' : ''}`}
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.width}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.angle}deg)`,
      }}
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
      <img src={sticker.src} alt="" aria-hidden="true" draggable={false} />
    </div>
  )
}
