import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MapLayerOverlay } from '@/components/MapLayerOverlay'
import { useMapViewport, usePinch } from '@/components/useMapViewport'
import { venueMap, type MapLayer } from '@/data/venue-map'
import { grounds } from '@/data/map'

/**
 * One event's map, as guests use it. The single map surface on the site: both
 * `/map-view` and `/now` render this, so there is one pan/zoom feel, one
 * expand animation, and one set of interactive stickers rather than a separate
 * implementation per page.
 *
 * The focus rectangle limits the view; it never crops the painting. What a
 * guest can see zoomed out is exactly what they can reach zoomed in, and the
 * artwork always covers the viewport — see `useMapViewport` for the rules.
 *
 * Expanding takes the map fullscreen and, on a portrait phone, turns it a
 * quarter turn so the landscape painting fills the long side of the screen:
 * the web cannot ask a device to rotate, so the map rotates instead.
 */

/** How far the fullscreen stage is turned, given the screen's shape. */
const rotationFor = (vw: number, vh: number) => (vh > vw ? 90 : 0)

/** The LAYOUT viewport, which on iOS is not what `window.innerWidth` reports:
 *  that follows the visual viewport and shrinks under pinch-zoom. */
const layoutViewport = () => ({
  vw: document.documentElement.clientWidth,
  vh: document.documentElement.clientHeight,
})

type Pose = {
  x: number
  y: number
  rotate: number
  scale: number
  clipPath: string
}

const DEFAULT_COMPASS = {
  src: '/art/map/compass-rose.webp',
  width: 440,
  height: 483,
}

const COMPASS_BY_EVENT_ANCHOR: Record<
  string,
  { src: string; width: number; height: number }
> = {
  'sunset-shaadi': {
    src: '/art/map/compass-rose-shaadi.webp',
    width: 1189,
    height: 1312,
  },
  'carnegie-to-carnation': {
    src: '/art/map/compass-rose-carnival.webp',
    width: 1201,
    height: 1309,
  },
  'naach-the-night-away': {
    src: '/art/map/compass-rose-sangeet.webp',
    width: 1203,
    height: 1294,
  },
}

/**
 * The pose that lays the fullscreen stage exactly over the inline frame.
 *
 * The stage is centred in the viewport and sized to the screen's long side by
 * its short side, so a quarter turn makes it fill a portrait screen. Animating
 * from here to identity is one continuous move: `translate` carries its centre
 * from the frame's to the screen's, `scale` grows it, `rotate` turns it, and
 * the mask — the frame's own rectangle written in the stage's untransformed
 * coordinates, so it rides every one of those — opens out to the whole stage.
 *
 * The scale is the frame's COVER scale, so the mask rectangle always lies
 * inside the stage and every inset stays positive: Safari refuses to
 * interpolate an `inset()` with negative values, which would strand the mask
 * fullscreen on an iPhone.
 */
function poseOverFrame(frame: DOMRect, stage: { w: number; h: number }): Pose {
  const { vw, vh } = layoutViewport()
  const scale = Math.max(frame.width / stage.w, frame.height / stage.h)
  const insetX = stage.w / 2 - frame.width / (2 * scale)
  const insetY = stage.h / 2 - frame.height / (2 * scale)
  return {
    x: frame.left + frame.width / 2 - vw / 2,
    y: frame.top + frame.height / 2 - vh / 2,
    rotate: 0,
    scale,
    clipPath: `inset(${insetY}px ${insetX}px round ${8 / scale}px)`,
  }
}

export function EventMap({
  layer,
  stamps,
  onToggleActivity,
  label = 'Map of the wedding grounds',
}: {
  layer: MapLayer
  /** Passport activities already collected. Stickers carrying an activity are
   *  tappable when this and `onToggleActivity` are both supplied. */
  stamps?: Set<string>
  onToggleActivity?: (activity: string) => void
  label?: string
}) {
  const [expanded, setExpanded] = useState(false)
  // Measured when the view opens, and again when it closes so the map returns
  // to wherever the frame has scrolled to in the meantime.
  const [pose, setPose] = useState<Pose | null>(null)
  const [screen, setScreen] = useState(layoutViewport)
  const frameRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  // A drag must not land as a tap on the sticker it finished over.
  const draggedRef = useRef(false)
  const reduce = useReducedMotion()
  const compassArt = layer.eventAnchor
    ? (COMPASS_BY_EVENT_ANCHOR[layer.eventAnchor] ?? DEFAULT_COMPASS)
    : DEFAULT_COMPASS

  const rotation = expanded ? rotationFor(screen.vw, screen.vh) : 0
  // Turned a quarter, the stage's own width runs down the screen's long side.
  const stageSize = rotation
    ? { w: screen.vh, h: screen.vw }
    : { w: screen.vw, h: screen.vh }

  // The focus rect's true aspect: its width and height are percentages of the
  // artwork's own width and height, which are not the same number.
  const focusAspect =
    (layer.focus.w * venueMap.art.width) / (layer.focus.h * venueMap.art.height)

  const viewport = useMapViewport({
    art: venueMap.art,
    bounds: layer.focus,
    rotationDeg: rotation,
    // Inline the frame is cut to the focus, so the whole focused area is
    // already on screen and there is nowhere to pan or zoom TO. Leaving the
    // gestures live there only stole the page's scroll from a finger that
    // happened to land on the map.
    interactive: expanded,
  })
  const pinch = usePinch(viewport)

  // Turning the phone changes which way the map should face, so the overlay
  // re-measures rather than staying stuck facing the old way.
  useEffect(() => {
    const onResize = () => setScreen(layoutViewport())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const open = () => {
    const frame = frameRef.current?.getBoundingClientRect()
    const next = layoutViewport()
    const turn = rotationFor(next.vw, next.vh)
    const size = turn ? { w: next.vh, h: next.vw } : { w: next.vw, h: next.vh }
    setScreen(next)
    setPose(frame ? poseOverFrame(frame, size) : null)
    setExpanded(true)
  }

  const close = useCallback(() => {
    // Re-measure on the way out: the page behind may sit at a different scroll
    // than it did on the way in, and the map should land back in its frame.
    const frame = frameRef.current?.getBoundingClientRect()
    if (frame) setPose(poseOverFrame(frame, stageSize))
    setExpanded(false)
  }, [stageSize])

  // Coming back inline, the view returns to the fit. A guest who zoomed in
  // fullscreen and closed would otherwise be left with a cropped inline map
  // and, with the gestures off, no way to get back out of it.
  //
  // Only on a real collapse, never on mount: at mount the stage has not been
  // measured yet, so the furthest-out zoom is not yet known and resetting to
  // it framed the whole estate instead of the event's own patch.
  const wasExpanded = useRef(false)
  useEffect(() => {
    if (wasExpanded.current && !expanded) viewport.reset()
    wasExpanded.current = expanded
    // Keyed on the transition alone; the viewport object is new every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  // While the overlay is up the page behind it must not scroll under it, and
  // Escape has to get out.
  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded, close])

  // The same gestures whichever frame the map is living in.
  const stageHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      // Give Chrome the press-to-first-move gap to put the painting on a
      // compositor layer, so the first pan/pinch frame is as fluid as the rest.
      viewport.prepare()
      pinch.onPointerDown(event)
      // Deliberately NOT capturing the pointer here. Capture retargets the
      // click that follows to the capturing element, which swallowed every tap
      // meant for a sticker. Capture is taken below, only once the finger has
      // actually travelled far enough to be a drag — by which point there is
      // no tap left to steal.
      panRef.current = { x: event.clientX, y: event.clientY }
      draggedRef.current = false
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      // A desktop pointer normally crosses the map before its wheel turns.
      // Use that hover movement to warm the layer before the first wheel event.
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        viewport.prepare()
        return
      }
      if (pinch.onPointerMove(event)) return
      const from = panRef.current
      if (!from) return
      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      // A few pixels of travel is a shaky finger, not a pan. Past that it is a
      // drag: take the pointer so it keeps tracking outside the stage, and
      // mark it so the sticker underneath does not take the tap.
      if (!draggedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        draggedRef.current = true
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // The pointer can already be gone. Capture improves the drag; it is
          // not required, and must never throw out of the handler.
        }
      }
      if (!draggedRef.current) return
      viewport.panBy(dx, dy)
      panRef.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      pinch.onPointerUp(event)
      panRef.current = null
    },
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
      pinch.onPointerUp(event)
      panRef.current = null
    },
    // A discrete gesture, like the buttons, so it eases rather than snapping.
    onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) =>
      viewport.zoomAbout(2, event, true),
  }

  // Also stable, for the same reason — see MapLayerOverlay's memo.
  const toggleActivity = useMemo(
    () =>
      onToggleActivity
        ? (activity: string) => {
            if (draggedRef.current) return
            onToggleActivity(activity)
          }
        : undefined,
    [onToggleActivity],
  )

  const mapCanvas = (
    <div
      className="mv-canvas"
      ref={viewport.canvasRef}
      style={
        {
          ...viewport.canvasStyle,
          '--inv': viewport.invZoom,
          '--map-unit': `${viewport.mapUnit}px`,
        } as React.CSSProperties
      }
    >
      <img
        className="mv-art"
        src={venueMap.art.src}
        width={venueMap.art.width}
        height={venueMap.art.height}
        alt="Hand-painted watercolor aerial of the wedding grounds."
        draggable={false}
        fetchPriority="high"
      />
      <MapLayerOverlay
        layer={layer}
        stamps={stamps}
        onToggleActivity={toggleActivity}
      />
    </div>
  )

  const zoomBar = (
    <div className="mv-zoom" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => viewport.zoomStep(-1)}
        disabled={viewport.zoom <= viewport.minZoom * 1.001}
        aria-label="Zoom out"
      >
        −
      </button>
      <span>{viewport.zoomPct}%</span>
      <button
        type="button"
        onClick={() => viewport.zoomStep(1)}
        disabled={viewport.zoom >= viewport.maxZoom * 0.999}
        aria-label="Zoom in"
      >
        +
      </button>
      <button type="button" onClick={viewport.reset}>
        Reset
      </button>
    </div>
  )

  const compass = (
    <img
      className="mv-compass"
      src={compassArt.src}
      alt=""
      width={compassArt.width}
      height={compassArt.height}
      style={{ rotate: `${grounds.northRotationDeg}deg` }}
    />
  )

  const cornerButton = (kind: 'open' | 'close') => (
    <button
      type="button"
      className={`mv-expand${kind === 'close' ? ' is-close' : ''}`}
      aria-label={kind === 'open' ? 'Open the full map' : 'Close the full map'}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={kind === 'open' ? open : close}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {kind === 'open' ? (
          <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
        ) : (
          <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
        )}
      </svg>
    </button>
  )

  const settled = { x: 0, y: 0, rotate: rotation, scale: 1 }

  return (
    <>
      {/* The frame keeps its place in the layout while the map is expanded, so
          the page never reflows underneath the overlay — and it is what the
          map animates back down onto.

          It is cut to the FOCUS RECTANGLE'S OWN SHAPE, so inline the guest
          sees exactly the focused area and nothing spare: with the frame and
          the focus the same shape, the furthest-out zoom fits one to the other
          with no slack on either axis. It then shrinks with the viewport
          rather than cropping, so the whole area stays visible at every size
          until they maximise, where the screen's shape takes over. */}
      <div
        className="mv-frame"
        ref={frameRef}
        aria-label={label}
        style={{ '--focus-ar': focusAspect } as React.CSSProperties}
      >
        {/* No gesture handlers inline: the map is a fixed picture there, and a
            finger dragging across it should scroll the page. Stickers stay
            tappable — those listen on themselves. */}
        {!expanded && (
          <div className="mv-stage" ref={viewport.registerStage}>
            {mapCanvas}
            {compass}
            {cornerButton('open')}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="mv-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
          >
            <motion.div
              className="mv-stage is-full"
              ref={viewport.registerStage}
              style={{ width: stageSize.w, height: stageSize.h }}
              initial={reduce || !pose ? { opacity: 0 } : pose}
              animate={
                reduce
                  ? { opacity: 1 }
                  : { ...settled, clipPath: 'inset(0px 0px round 0px)' }
              }
              exit={reduce || !pose ? { opacity: 0 } : pose}
              transition={
                reduce
                  ? { duration: 0.2 }
                  : { duration: 0.52, ease: [0.22, 0.61, 0.36, 1] }
              }
              {...stageHandlers}
            >
              {mapCanvas}
              {compass}
              {zoomBar}
              {cornerButton('close')}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** The layer drawn for an event, by its `anchor` in events.ts. */
export const layerForEvent = (anchor: string) =>
  venueMap.layers.find((layer) => layer.eventAnchor === anchor)
