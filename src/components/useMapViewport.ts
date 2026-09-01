import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { clamp, type MapFocus, type MapPoint } from '@/data/venue-map'

/**
 * The pan/zoom engine both map surfaces run on — the editor at `/map-editor`
 * and the guest view at `/map-view`.
 *
 * The canvas is sized to fill the stage at zoom 1 (see `fit`) and carries
 * every overlay as a percentage of itself, so the artwork, the polygons, the
 * walks, and the stickers all move together and no overlay ever has to know
 * about the transform. Screen-to-artwork conversion reads the canvas's live
 * bounding rect, which already has the transform baked in.
 *
 * `bounds` is the rectangle the view is held inside — the guest view passes the
 * event's focus rect. It is a LIMIT ON THE VIEW, never a crop of the painting:
 * the whole artwork is always what is being drawn, and whatever falls outside
 * the focus but inside the viewport is painted like everything else. Two rules
 * govern it, and the second outranks the first:
 *
 *  1. The furthest out anyone can zoom is the zoom at which the whole focus
 *     fits on screen. A screen is rarely the focus's shape, so one axis has
 *     slack and some surrounding grounds show there — which is the point, not
 *     a defect.
 *  2. No whitespace, ever. The artwork covers the viewport at every zoom and
 *     every pan; a focus near the edge of the painting pulls up against that
 *     edge and stops, rather than letting the page's ground show through.
 *
 * Panning is bounded by `reach`: the rectangle actually ON SCREEN at that
 * furthest-out zoom, slack included — not by the focus rectangle itself. What
 * a guest can see when zoomed out is exactly what they can reach when zoomed
 * in, so the map behaves like one fixed picture they are moving a window over,
 * rather than one where scenery visible a moment ago has become unreachable.
 *
 * `rotationDeg` lets the stage element itself be rotated (the guest view spins
 * the map landscape on a portrait phone). Pointer maths goes through the
 * rotation rather than through `getBoundingClientRect`, which reports only an
 * axis-aligned box and is wrong the moment anything is turned.
 */

/** How far past the minimum a guest may zoom in. */
const ZOOM_RANGE = 8

/** How long the zoom buttons take to glide to their new view. */
const GLIDE_MS = 320

/** How long after the last movement the React mirror catches up. */
const COMMIT_IDLE_MS = 140

/**
 * Keep the moving painting on its own compositor layer while a gesture is in
 * flight. Without this, every tiny transform repaints the 4,200px watercolor
 * and every sticker; releasing it once movement settles lets Chrome rasterize
 * the final view at its true zoom again, so motion stays fluid without leaving
 * the detailed artwork soft.
 */
const setCompositing = (el: HTMLElement | null, moving: boolean) => {
  if (el) el.style.willChange = moving ? 'transform' : ''
}

/**
 * The stops the zoom buttons step between, as multiples of the furthest-out
 * zoom. A fixed step compounds — two presses of a 1.4x button land on 196%,
 * which is a strange number to be shown — so the buttons walk a ladder of
 * round ones instead. A press from anywhere in between (after a pinch, say)
 * goes to the next stop, so the readout is always somewhere legible.
 */
const ZOOM_STOPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, ZOOM_RANGE]

export interface MapViewport {
  /** Attach to the stage element. A callback ref, not an object one: the guest
   *  view moves its map between the inline frame and a fullscreen overlay, and
   *  the measuring has to follow it to the new element. */
  registerStage: (el: HTMLDivElement | null) => void
  stageRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLDivElement | null>
  /** Live scale, always between `minZoom` and `maxZoom`. */
  zoom: number
  minZoom: number
  maxZoom: number
  /** 1/zoom — multiply handle sizes by this to keep them screen-constant. */
  invZoom: number
  /**
   * One map unit in stage pixels: 1% of the artwork's width, before the zoom
   * transform. Anything sized in these units keeps a fixed relationship to the
   * painting — the same on a phone as on a desktop, at every zoom — instead of
   * a fixed relationship to the screen.
   */
  mapUnit: number
  /** How far in the guest has zoomed, as a percentage of the furthest out. */
  zoomPct: number
  canvasStyle: CSSProperties
  /** Screen point to a point in the artwork's 0–100 space. */
  toPercent: (event: { clientX: number; clientY: number }) => MapPoint
  /** Screen distance to a distance in the artwork's 0–100 space. */
  toPercentDelta: (dx: number, dy: number) => MapPoint
  /** Warm the compositor just before direct manipulation begins. */
  prepare: () => void
  panBy: (dx: number, dy: number) => void
  /**
   * Zoom by a FACTOR about a screen point, keeping the map pixel under that
   * point where it is. A factor rather than a target scale on purpose: a
   * gesture fires many times between renders, and each event has to compound
   * on the last one's result rather than on whatever `zoom` this render
   * happened to close over. Pass `glide` for the discrete gestures — a
   * double-tap — that should ease rather than snap.
   */
  zoomAbout: (
    factor: number,
    at: { clientX: number; clientY: number },
    glide?: boolean,
  ) => void
  /** Step one rung up or down the ladder of round zoom stops, with a glide. */
  zoomStep: (direction: 1 | -1) => void
  reset: () => void
  /** Frame the given rect, as far in as the bounds allow. */
  frame: (rect: MapFocus) => void
}

export function useMapViewport({
  art,
  bounds,
  fit = 'cover',
  rotationDeg = 0,
  interactive = true,
}: {
  art: { width: number; height: number }
  bounds: MapFocus
  /** How the artwork sits in the stage at zoom 1. `cover` fills the stage and
   *  crops; `contain` fits the whole painting on screen, which is what laying
   *  it out wants. */
  fit?: 'cover' | 'contain'
  /** How far the stage element itself is turned on screen, in degrees. */
  rotationDeg?: number
  /** When false the wheel and pinch gestures are left alone. */
  interactive?: boolean
}): MapViewport {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null)

  const registerStage = useCallback((el: HTMLDivElement | null) => {
    // Nulls are ignored on purpose. While the guest map moves between its
    // inline frame and the fullscreen overlay BOTH stages exist for the length
    // of the transition, and the one leaving detaches after the one arriving
    // has attached — so honouring its null would drop the live stage and stop
    // the measuring for good.
    if (!el) return
    stageRef.current = el
    setStageEl(el)
  }, [])

  useEffect(() => {
    if (!stageEl) return
    const measure = () =>
      setStage({ w: stageEl.clientWidth, h: stageEl.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stageEl)
    return () => observer.disconnect()
  }, [stageEl])

  // Canvas size in stage pixels: the artwork scaled to fill (or fit) the stage.
  const canvas = useMemo(() => {
    if (!stage.w || !stage.h) return { w: 0, h: 0 }
    const ratios = [stage.w / art.width, stage.h / art.height]
    const scale = fit === 'cover' ? Math.max(...ratios) : Math.min(...ratios)
    return { w: art.width * scale, h: art.height * scale }
  }, [stage.w, stage.h, art.width, art.height, fit])

  // The bounds rect in canvas-local pixels, measured from the canvas centre.
  const box = useMemo(
    () => ({
      x: (bounds.x / 100) * canvas.w - canvas.w / 2,
      y: (bounds.y / 100) * canvas.h - canvas.h / 2,
      w: (bounds.w / 100) * canvas.w,
      h: (bounds.h / 100) * canvas.h,
    }),
    [bounds.x, bounds.y, bounds.w, bounds.h, canvas.w, canvas.h],
  )

  // The furthest out anyone can go: the zoom at which the whole bounds rect
  // fits on screen — whichever axis is the tighter fit decides, so nothing
  // inside the rect is cut off — but never so far out that the artwork stops
  // covering the viewport. The canvas is sized to cover the stage at zoom 1,
  // so that floor is exactly 1. The editor is the exception: laying the map
  // out wants the whole painting on screen, margins and all.
  const minZoom = useMemo(() => {
    if (!box.w || !box.h || !stage.w || !stage.h) return 1
    const contain = Math.min(stage.w / box.w, stage.h / box.h)
    return fit === 'contain' ? Math.min(1, contain) : Math.max(contain, 1)
  }, [box.w, box.h, stage.w, stage.h, fit])
  const maxZoom = minZoom * ZOOM_RANGE

  // The view is stored as the artwork point sitting at the stage's centre, in
  // canvas-local pixels. Panning moves it; zooming leaves it alone unless a
  // clamp pulls it back.
  /**
   * THE VIEW IS A REF, and React state only trails it.
   *
   * A pinch or a drag fires many times a second, and none of it changes what
   * the map CONTAINS — only the transform on one element. Routing every one of
   * those through `setState` re-rendered the tree per event and made the map
   * feel like it was catching up with the finger instead of following it.
   * Every gesture now writes the ref and paints the element directly, and the
   * state mirror is updated once the movement stops, purely so the things that
   * genuinely need to re-render — the zoom readout, the disabled state of the
   * buttons — eventually agree with what is on screen.
   *
   * `canvasStyle` is built from the ref, so any incidental render mid-gesture
   * paints the live view rather than snapping back to the stale mirror.
   */
  const viewRef = useRef({ zoom: 1, cx: 0, cy: 0 })
  const [view, setView] = useState(viewRef.current)
  const animRef = useRef<number | null>(null)
  const commitRef = useRef<number | null>(null)

  /** Push the live view into React, for the readouts that need it. */
  const commit = useCallback(() => {
    if (commitRef.current !== null) {
      clearTimeout(commitRef.current)
      commitRef.current = null
    }
    setView(viewRef.current)
  }, [])

  /** Commit once the gesture goes quiet, rather than on every event. */
  const scheduleCommit = useCallback(() => {
    if (commitRef.current !== null) clearTimeout(commitRef.current)
    commitRef.current = window.setTimeout(() => {
      commitRef.current = null
      setCompositing(canvasRef.current, false)
      setView(viewRef.current)
    }, COMMIT_IDLE_MS)
  }, [])

  /** Move the view: straight onto the element, and into React when asked. */
  const write = useCallback(
    (next: { zoom: number; cx: number; cy: number }, now = false) => {
      viewRef.current = next
      const el = canvasRef.current
      if (el) {
        setCompositing(el, true)
        el.style.transform = `scale(${next.zoom}) translate(${-next.cx}px, ${-next.cy}px)`
        el.style.setProperty('--inv', String(1 / next.zoom))
      }
      if (now) {
        commit()
        // Keep the final frame composited long enough to paint immediately.
        // Releasing the layer in this same task makes a button click wait for
        // the full-detail reraster before anything appears to happen.
        scheduleCommit()
      }
      else scheduleCommit()
    },
    [commit, scheduleCommit],
  )

  const prepare = useCallback(() => {
    setCompositing(canvasRef.current, true)
    scheduleCommit()
  }, [scheduleCommit])

  /** Drop any in-flight glide. Direct manipulation always wins over one. */
  const stopGlide = useCallback(() => {
    if (animRef.current === null) return
    cancelAnimationFrame(animRef.current)
    animRef.current = null
  }, [])

  useEffect(
    () => () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
      if (commitRef.current !== null) clearTimeout(commitRef.current)
    },
    [],
  )

  /**
   * One axis of the pan clamp, in canvas pixels measured from the canvas
   * centre. Two ranges of allowed view-centre positions get intersected: the
   * one that keeps the viewport inside the focus, and the one that keeps it
   * inside the artwork. Where they disagree the artwork wins, because a view
   * that honours the focus by showing blank page beyond the painting's edge is
   * worse than one that stops at the edge.
   */
  const clampAxis = useCallback(
    (
      value: number,
      focusCentre: number,
      focusHalf: number,
      artHalf: number,
      viewHalf: number,
    ) => {
      const artLo = -artHalf + viewHalf
      const artHi = artHalf - viewHalf
      // The viewport is wider than the painting on this axis: nothing can hide
      // the edges, so centre the painting and let it be symmetrical.
      if (artLo > artHi) return 0
      const lo = Math.max(artLo, focusCentre - focusHalf + viewHalf)
      const hi = Math.min(artHi, focusCentre + focusHalf - viewHalf)
      // Either the viewport is bigger than the focus on this axis, or the
      // focus runs off the painting: hold the focus as centred as the
      // painting's own edges allow.
      if (lo > hi) return clamp(focusCentre, artLo, artHi)
      return clamp(value, lo, hi)
    },
    [],
  )

  /**
   * Everything reachable: the rectangle the viewport spans at `minZoom`, which
   * is the whole focus plus whatever slack the screen's shape adds around it,
   * pulled inside the painting. Panning is clamped to this rather than to the
   * focus, so zooming in never puts scenery out of reach that zooming out had
   * just shown.
   */
  const reach = useMemo(() => {
    const halfW = stage.w / (2 * minZoom)
    const halfH = stage.h / (2 * minZoom)
    return {
      x: clampAxis(box.x, box.x, box.w / 2, canvas.w / 2, halfW),
      y: clampAxis(box.y, box.y, box.h / 2, canvas.h / 2, halfH),
      w: 2 * halfW,
      h: 2 * halfH,
    }
  }, [
    box.x,
    box.y,
    box.w,
    box.h,
    canvas.w,
    canvas.h,
    stage.w,
    stage.h,
    minZoom,
    clampAxis,
  ])

  const clampCenter = useCallback(
    (cx: number, cy: number, zoom: number) => ({
      cx: clampAxis(cx, reach.x, reach.w / 2, canvas.w / 2, stage.w / (2 * zoom)),
      cy: clampAxis(cy, reach.y, reach.h / 2, canvas.h / 2, stage.h / (2 * zoom)),
    }),
    [reach, canvas.w, canvas.h, stage.w, stage.h, clampAxis],
  )

  // Whenever the stage or the bounds change shape, re-seat the view. On first
  // measure that means framing the bounds. Afterwards the guest's zoom is
  // carried across in RELATIVE terms — how far in they are from the furthest
  // out, rather than an absolute scale — so a stage that changes size (the
  // guest view going fullscreen, a window being dragged wider) keeps showing
  // the same amount of ground instead of the same number of pixels.
  const seeded = useRef(false)
  const lastMin = useRef(minZoom)
  useEffect(() => {
    if (!canvas.w || !stage.w) return
    // The ratio is worked out HERE, not inside the updater: a state updater
    // must be pure, and React calls it twice in development to prove it. An
    // updater that advanced `lastMin` itself would compute the real ratio on
    // the first call and 1 on the second, and React keeps the second — so the
    // carry-over silently did nothing and the map landed at the wrong zoom.
    const first = !seeded.current
    const ratio = !first && lastMin.current > 0 ? minZoom / lastMin.current : 1
    seeded.current = true
    lastMin.current = minZoom
    // The first sight of the map is the furthest-out view, centred on
    // everything reachable — and so is every sight of a view that takes no
    // gestures, since there is no zoom or pan of the guest's own to preserve.
    // Doing it HERE rather than from the caller matters: this runs once the
    // stage has been measured, so it fits the stage the map is actually in.
    // Resetting from outside fitted whichever stage had been measured last,
    // which after closing the fullscreen view was the fullscreen one.
    if (first || !interactive) {
      write({ zoom: minZoom, ...clampCenter(reach.x, reach.y, minZoom) }, true)
      return
    }
    const cur = viewRef.current
    const zoom = clamp(cur.zoom * ratio, minZoom, maxZoom)
    write({ zoom, ...clampCenter(cur.cx, cur.cy, zoom) }, true)
  }, [
    canvas.w,
    stage.w,
    minZoom,
    maxZoom,
    reach.x,
    reach.y,
    clampCenter,
    write,
    interactive,
  ])

  // A new bounds rect (the editor switching layers) reframes from scratch.
  const boundsKey = `${bounds.x},${bounds.y},${bounds.w},${bounds.h}`
  const lastBounds = useRef(boundsKey)
  useEffect(() => {
    if (lastBounds.current === boundsKey) return
    lastBounds.current = boundsKey
    seeded.current = false
  }, [boundsKey])

  // Screen deltas arrive in the rotated frame the stage is drawn in; undo the
  // rotation to get back into the map's own axes. At 0° this is the identity.
  const unrotate = useCallback(
    (dx: number, dy: number) => {
      const rad = (-rotationDeg * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
    },
    [rotationDeg],
  )

  /**
   * A screen point in the artwork's 0–100 space, derived from the stage's
   * centre rather than the canvas's bounding box: a rotated element reports an
   * axis-aligned box, which would put every click in the wrong place.
   */
  const toPercent = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect || !canvas.w || !canvas.h) return { x: 50, y: 50 }
      const local = unrotate(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      )
      return {
        x: ((local.x / view.zoom + view.cx + canvas.w / 2) / canvas.w) * 100,
        y: ((local.y / view.zoom + view.cy + canvas.h / 2) / canvas.h) * 100,
      }
    },
    [canvas.w, canvas.h, view.zoom, view.cx, view.cy, unrotate],
  )

  const toPercentDelta = useCallback(
    (dx: number, dy: number) => {
      if (!canvas.w || !canvas.h) return { x: 0, y: 0 }
      const local = unrotate(dx, dy)
      return {
        x: (local.x / view.zoom / canvas.w) * 100,
        y: (local.y / view.zoom / canvas.h) * 100,
      }
    },
    [canvas.w, canvas.h, view.zoom, unrotate],
  )

  const panBy = useCallback(
    (dx: number, dy: number) => {
      stopGlide()
      const cur = viewRef.current
      const local = unrotate(dx, dy)
      write({
        ...cur,
        ...clampCenter(
          cur.cx - local.x / cur.zoom,
          cur.cy - local.y / cur.zoom,
          cur.zoom,
        ),
      })
    },
    [clampCenter, unrotate, stopGlide, write],
  )

  // Zoom about a screen point: the artwork pixel under the cursor keeps its
  // place, because holding `zoom * (point - centre)` fixed is exactly the
  // condition for its screen offset from the stage centre not to move.
  /**
   * Glide to a view rather than snapping to it. The buttons use this; dragging,
   * the wheel and a pinch stay instant, because those are the guest's own hand
   * and any easing on them reads as lag.
   *
   * Zoom interpolates geometrically — equal ratios in equal times — so the
   * approach looks even rather than racing at the wide end and crawling at the
   * tight one, which is what a linear ramp between two scales does.
   */
  const glideTo = useCallback(
    (target: { zoom: number; cx: number; cy: number }) => {
      stopGlide()
      const from = viewRef.current
      const zoomRatio = target.zoom / from.zoom
      if (!Number.isFinite(zoomRatio) || zoomRatio <= 0) {
        write(
          {
            zoom: target.zoom,
            ...clampCenter(target.cx, target.cy, target.zoom),
          },
          true,
        )
        return
      }
      const started = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / GLIDE_MS)
        // Ease in and out: starting and finishing at rest reads as one
        // deliberate move, where a hard start reads as a lurch.
        const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
        const zoom = from.zoom * zoomRatio ** eased
        const cx = from.cx + (target.cx - from.cx) * eased
        const cy = from.cy + (target.cy - from.cy) * eased
        const next = { zoom, ...clampCenter(cx, cy, zoom) }
        if (t < 1) {
          write(next)
          animRef.current = requestAnimationFrame(step)
          return
        }
        animRef.current = null
        write(next, true)
      }
      animRef.current = requestAnimationFrame(step)
    },
    [clampCenter, stopGlide, write],
  )

  const zoomAbout = useCallback(
    (
      factor: number,
      at: { clientX: number; clientY: number },
      glide = false,
    ) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect || !rect.width) return
      // Where the pointer is, relative to the stage's centre, in the map's own
      // axes. Measured once: it does not depend on the zoom being applied.
      const local = unrotate(
        at.clientX - (rect.left + rect.width / 2),
        at.clientY - (rect.top + rect.height / 2),
      )
      // Pure, so it is safe both as a state updater (React calls those twice
      // in development) and as the target of a glide.
      const apply = (cur: { zoom: number; cx: number; cy: number }) => {
        const zoom = clamp(cur.zoom * factor, minZoom, maxZoom)
        // The canvas point under the pointer, which must not move.
        const px = local.x / cur.zoom + cur.cx
        const py = local.y / cur.zoom + cur.cy
        const ratio = cur.zoom / zoom
        return {
          zoom,
          ...clampCenter(
            px - (px - cur.cx) * ratio,
            py - (py - cur.cy) * ratio,
            zoom,
          ),
        }
      }
      if (glide) {
        glideTo(apply(viewRef.current))
        return
      }
      stopGlide()
      write(apply(viewRef.current))
    },
    [minZoom, maxZoom, clampCenter, unrotate, stopGlide, glideTo, write],
  )

  /** One rung up (`1`) or down (`-1`) the zoom ladder, glided into place. */
  const zoomStep = useCallback(
    (direction: 1 | -1) => {
      const cur = viewRef.current
      const rung = cur.zoom / minZoom
      const next =
        direction > 0
          ? (ZOOM_STOPS.find((stop) => stop > rung + 0.01) ??
            ZOOM_STOPS[ZOOM_STOPS.length - 1]!)
          : ([...ZOOM_STOPS].reverse().find((stop) => stop < rung - 0.01) ??
            ZOOM_STOPS[0]!)
      const zoom = clamp(minZoom * next, minZoom, maxZoom)
      glideTo({ zoom, ...clampCenter(cur.cx, cur.cy, zoom) })
    },
    [minZoom, maxZoom, clampCenter, glideTo],
  )

  const reset = useCallback(
    () => glideTo({ zoom: minZoom, ...clampCenter(reach.x, reach.y, minZoom) }),
    [minZoom, reach.x, reach.y, clampCenter, glideTo],
  )

  const frame = useCallback(
    (rect: MapFocus) => {
      if (!canvas.w || !stage.w) return
      const w = (rect.w / 100) * canvas.w
      const h = (rect.h / 100) * canvas.h
      const zoom = clamp(Math.min(stage.w / w, stage.h / h), minZoom, maxZoom)
      const cx = (rect.x / 100) * canvas.w - canvas.w / 2
      const cy = (rect.y / 100) * canvas.h - canvas.h / 2
      glideTo({ zoom, ...clampCenter(cx, cy, zoom) })
    },
    [canvas.w, canvas.h, stage.w, stage.h, minZoom, maxZoom, clampCenter, glideTo],
  )

  // The wheel has to be bound by hand: React registers it passively at the
  // root, so `preventDefault` in an onWheel prop is ignored and the page
  // scrolls out from under the cursor.
  useEffect(() => {
    if (!stageEl || !interactive) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomAbout(Math.exp(-event.deltaY / 320), event)
    }
    stageEl.addEventListener('wheel', onWheel, { passive: false })
    return () => stageEl.removeEventListener('wheel', onWheel)
    // Deliberately NOT keyed on the live zoom: it used to be, which tore the
    // listener down and rebuilt it on every single wheel event.
  }, [stageEl, interactive, zoomAbout])

  // From the ref, not the mirror: a render that lands mid-gesture must paint
  // where the map actually is.
  const live = viewRef.current
  const canvasStyle: CSSProperties = {
    width: canvas.w || undefined,
    height: canvas.h || undefined,
    transform: `scale(${live.zoom}) translate(${-live.cx}px, ${-live.cy}px)`,
  }

  return {
    registerStage,
    stageRef,
    canvasRef,
    zoom: view.zoom,
    minZoom,
    maxZoom,
    invZoom: 1 / view.zoom,
    mapUnit: canvas.w / 100,
    zoomPct: minZoom ? Math.round((view.zoom / minZoom) * 100) : 100,
    canvasStyle,
    toPercent,
    toPercentDelta,
    prepare,
    panBy,
    zoomAbout,
    zoomStep,
    reset,
    frame,
  }
}

/**
 * Two-finger pinch on the stage, layered over the pointer events the drawing
 * tools already use. Returns handlers to spread onto the stage; while two
 * pointers are down it swallows the gesture so nothing else drags.
 */
export function usePinch(viewport: MapViewport) {
  const points = useRef(new Map<number, { x: number; y: number }>())
  const last = useRef<{ distance: number } | null>(null)

  const active = () => points.current.size >= 2

  return {
    pinching: active,
    onPointerDown: (event: { pointerId: number; clientX: number; clientY: number }) => {
      points.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
    },
    onPointerMove: (event: { pointerId: number; clientX: number; clientY: number }) => {
      if (!points.current.has(event.pointerId)) return false
      points.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
      if (points.current.size < 2) return false
      const [a, b] = [...points.current.values()]
      if (!a || !b) return false
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const midpoint = {
        clientX: (a.x + b.x) / 2,
        clientY: (a.y + b.y) / 2,
      }
      if (last.current && last.current.distance > 0) {
        // The ratio since the previous move, so every event compounds on the
        // one before it however many arrive between renders.
        viewport.zoomAbout(distance / last.current.distance, midpoint)
      }
      last.current = { distance }
      return true
    },
    onPointerUp: (event: { pointerId: number }) => {
      points.current.delete(event.pointerId)
      if (points.current.size < 2) last.current = null
    },
  }
}
