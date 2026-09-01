import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

type CarnivalPlacement = {
  id: string;
  /** Passport activity this item checks off, if it has one. */
  activity?: string;
  label: string;
  src: string;
  x: number;
  y: number;
  width: number;
  angle?: number;
};

const ART_PATH = '/art/map/carnival';

// Laid out by hand with the in-browser editor (Edit map in the admin chip);
// paste its Copy layout output over these entries to update.
const placements: CarnivalPlacement[] = [
  {
    id: 'pani-puri',
    activity: 'pani-puri',
    label: 'Pani puri',
    src: `${ART_PATH}/pani-puri.webp`,
    x: 34.2,
    y: 24.7,
    width: 6.3,
  },
  {
    id: 'cmu-fence',
    activity: 'cmu-fence',
    label: 'Carnegie Mellon fence',
    src: `${ART_PATH}/cmu-fence.webp`,
    x: 39.5,
    y: 35,
    width: 8,
    angle: 4,
  },
  {
    id: 'picnic',
    activity: 'picnic',
    label: 'Picnic blanket with carrom and Jenga',
    src: `${ART_PATH}/picnic-carrom-jenga.webp`,
    x: 46.2,
    y: 25.1,
    width: 7.2,
    angle: -3,
  },
  {
    id: 'mehendi',
    activity: 'mehendi',
    label: 'Mehendi artists',
    src: `${ART_PATH}/henna.webp`,
    x: 53.6,
    y: 32.2,
    width: 5.5,
    angle: -1,
  },
  {
    id: 'jigsaw',
    activity: 'jigsaw',
    label: 'Jigsaw puzzle',
    src: `${ART_PATH}/jigsaw.webp`,
    x: 61.3,
    y: 25.1,
    width: 6.7,
    angle: 7,
  },
  {
    id: 'bazaar',
    activity: 'bazaar',
    label: 'Bazaar',
    src: `${ART_PATH}/bazaar.webp`,
    x: 68.2,
    y: 33.6,
    width: 7.3,
    angle: -2,
  },
  {
    id: 'umbrella-arch',
    activity: 'umbrella-booth',
    label: 'Rajasthani umbrella arch',
    src: `${ART_PATH}/umbrella-arch.webp`,
    x: 63.3,
    y: 49.8,
    width: 7.5,
  },
  {
    id: 'sunglasses',
    activity: 'nazar-studio',
    label: 'Colorful sunglasses',
    src: `${ART_PATH}/sunglasses.webp`,
    x: 69.1,
    y: 62.8,
    width: 6.8,
    angle: 5,
  },
  {
    id: 'block-print',
    activity: 'block-print',
    label: 'Block-print tote bags',
    src: `${ART_PATH}/block-print-tote.webp`,
    x: 64.8,
    y: 75.4,
    width: 6.6,
  },
  {
    id: 'candy',
    activity: 'sweets',
    label: 'Colorful candies',
    src: `${ART_PATH}/candy-bag.webp`,
    x: 38.8,
    y: 75.8,
    width: 4.5,
  },
  {
    id: 'samosa',
    activity: 'food',
    label: 'Samosa',
    src: `${ART_PATH}/samosa.webp`,
    x: 44.7,
    y: 67.8,
    width: 6.5,
  },
  {
    id: 'bicycle',
    activity: 'bike-booth',
    label: 'Decorated bicycle',
    src: `${ART_PATH}/bicycle.webp`,
    x: 51.2,
    y: 75.1,
    width: 7.4,
    angle: 2,
  },
  {
    id: 'yarn',
    activity: 'yarn',
    label: 'Yarn art',
    src: `${ART_PATH}/yarn-art.webp`,
    x: 58.4,
    y: 68.3,
    width: 4.9,
  },
  {
    id: 'lemonade',
    activity: 'airstream',
    label: 'Lemonade',
    src: `${ART_PATH}/lemonade.webp`,
    x: 32.7,
    y: 70.2,
    width: 5,
  },
];

/* ------------------------------------------------------------------------- *
 * SUPERSEDED for new work by the venue map editor at /map-editor, which lays
 * stickers out on the grounds artwork. This one stays until the carnival map
 * stops being its own painting (carnival-lawn-base.webp, its own coordinate
 * space) and becomes the grounds map zoomed to the carnival focus rect —
 * until then these placements have nowhere else to be edited.
 *
 * Temporary layout editor. Everything below the placements exists so the
 * couple can drag, resize, and rotate the items in the browser, then copy
 * the numbers back into the array above. Rip it out once the layout is
 * final.
 * ------------------------------------------------------------------------- */

const DRAFT_KEY = 'carnival-map.layout-draft'

type DraftFields = Pick<CarnivalPlacement, 'id' | 'x' | 'y' | 'width' | 'angle'>

/** A draft in localStorage overrides the numbers above (art and labels stay
 *  from code, joined by id) so an accidental reload never loses edits. */
function loadDraft(): CarnivalPlacement[] | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const byId = new Map(
      (JSON.parse(raw) as DraftFields[]).map((d) => [d.id, d]),
    )
    return placements.map((p) => {
      const d = byId.get(p.id)
      return d ? { ...p, x: d.x, y: d.y, width: d.width, angle: d.angle } : p
    })
  } catch {
    return null
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

/** The placements array body, ready to paste over the one in this file. */
function layoutAsCode(items: CarnivalPlacement[]) {
  return items
    .map((p) => {
      const angle = p.angle ? `, angle: ${Math.round(p.angle)}` : ''
      return `  { id: '${p.id}', x: ${round1(p.x)}, y: ${round1(p.y)}, width: ${round1(p.width)}${angle} },`
    })
    .join('\n')
}

type DragMode = 'move' | 'resize' | 'rotate'

// Stamped into the ?slowmo debug badge so a recording proves which build a
// tab is actually running (HMR through many rewrites can leave stale code).
const ZOOM_BUILD = 'z9 layout-vp + polygon'

// Debug: ?slowmo=1 stretches the zoom transition so it can be inspected
// frame by frame. Temporary tooling for tuning the animation.
const SLOWMO = new URLSearchParams(window.location.search).has('slowmo') ? 8 : 1

/** One pose describes one direction of the zoom transition: the transform
 *  that lays the fullscreen painting over the inline framed one (or back),
 *  plus the mask and anchor that ride it. */
type ZoomPose = {
  x: number
  y: number
  rotate: number
  scale: number
  /** Clip in the moving element's own space, so the mask rotates and scales
   *  with the image: at one end the frame's rect, at the other the viewport. */
  clip: string
  /** The similarity's fixed point. Rotating and scaling about it needs no
   *  translation, so the card follows a clean spiral between its two poses. */
  origin: string
  /** Degenerate fallback (scale ~ 1, unrotated): translate instead. */
  translate: boolean
}

type EntryPose = ZoomPose & {
  /** Scroll that centers the field once settled; carried as the shift
   *  wrapper's transform during the entrance, swapped for real scrollTop in
   *  one pre-paint commit at settle. */
  scroll: number
  shift: string
  /** The cover zoom: the smallest zoom at which the painting fills the
   *  viewport. Short-aspect screens need more than 1, or a strip of page
   *  shows beside the fullscreen map. Also the pinch's lower bound. */
  minZoom: number
}

type ExitPose = ZoomPose & {
  /** The live scroll state, converted back into a transform for the exit so
   *  the stage can leave scroll-clipping mode without anything moving. */
  shift: string
}

const PAINTING_ASPECT = 931 / 1689
/** The slice of the painting the inline mobile frame shows (see the
 *  .carnival-map-canvas crop in index.css). */
const CROP_LEFT = 0.25
const CROP_RIGHT = 0.78
/** The lawn's vertical middle on the painting, as a fraction of its height —
 *  the line the settled view centers. Tuned against rendered screenshots. */
const FIELD_CENTER = 0.49

type FrameBox = { left: number; top: number; width: number; height: number }

/** The LAYOUT viewport — the box the fixed overlay actually spans. On iOS,
 *  window.innerWidth/Height report the visual viewport instead, which
 *  shrinks and shifts with pinch-zoom and put every mask and origin in the
 *  wrong place on real phones. */
function layoutViewport() {
  return {
    vw: document.documentElement.clientWidth,
    vh: document.documentElement.clientHeight,
  }
}

/** The inline frame's content box (the canvas lives inside its 1px border)
 *  and its real corner radius — the geometry both directions register to. */
function frameContentBox(frame: HTMLElement): { box: FrameBox } {
  const style = getComputedStyle(frame)
  const bl = parseFloat(style.borderLeftWidth) || 0
  const bt = parseFloat(style.borderTopWidth) || 0
  const br = parseFloat(style.borderRightWidth) || 0
  const bb = parseFloat(style.borderBottomWidth) || 0
  const rect = frame.getBoundingClientRect()
  return {
    box: {
      left: rect.left + bl,
      top: rect.top + bt,
      width: rect.width - bl - br,
      height: rect.height - bt - bb,
    },
  }
}

/** Everything that rides a pose: the frame's inverse image under it — the
 *  axis-aligned local rect (90° keeps axes square) whose transformed self is
 *  the frame — and the similarity's fixed point, q = (I − kR)⁻¹ t. */
function poseChrome(
  pose: { x: number; y: number; scale: number },
  frame: FrameBox,
  portrait: boolean,
): { clip: string; origin: string; translate: boolean } {
  const { vw, vh } = layoutViewport()
  const k = pose.scale
  const dX = frame.left + frame.width / 2 - vw / 2 - pose.x
  const dY = frame.top + frame.height / 2 - vh / 2 - pose.y
  const lcx = portrait ? vw / 2 - dY / k : vw / 2 + dX / k
  const lcy = portrait ? vh / 2 + dX / k : vh / 2 + dY / k
  const halfX = (portrait ? frame.height : frame.width) / (2 * k)
  const halfY = (portrait ? frame.width : frame.height) / (2 * k)
  // polygon(), not inset(): the rect legitimately extends past the element's
  // box (the painting overflows the stage), and Safari refuses to apply or
  // interpolate inset() with negative values — the mask silently stayed
  // fullscreen on iPhones. Four-corner polygons interpolate everywhere and
  // accept out-of-bounds coordinates; the trade is square mask corners.
  const x0 = lcx - halfX
  const x1 = lcx + halfX
  const y0 = lcy - halfY
  const y1 = lcy + halfY
  const clip = `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`

  let origin = `${vw / 2}px ${vh / 2}px`
  let translate = true
  if (portrait) {
    // R(−90°): (x, y) → (y, −x); (I − kR)⁻¹ = [[1, k], [−k, 1]] / (1 + k²)
    const qx = (pose.x + k * pose.y) / (1 + k * k)
    const qy = (-k * pose.x + pose.y) / (1 + k * k)
    origin = `${vw / 2 + qx}px ${vh / 2 + qy}px`
    translate = false
  } else if (Math.abs(1 - k) > 0.02) {
    origin = `${vw / 2 + pose.x / (1 - k)}px ${vh / 2 + pose.y / (1 - k)}px`
    translate = false
  }
  return { clip, origin, translate }
}

/** The entrance pose: the whole painting starts masked to the frame's rect,
 *  matching the inline map pixel for pixel, then rotates and grows — mask
 *  riding along — until the mask is the viewport. */
function entryPoseFor(frameEl: HTMLElement): EntryPose {
  const { vw, vh } = layoutViewport()
  const portrait = vh >= vw
  const { box: frame } = frameContentBox(frameEl)
  const fcx = frame.left + frame.width / 2 - vw / 2
  const fcy = frame.top + frame.height / 2 - vh / 2

  let pose: { x: number; y: number; rotate: number; scale: number }
  let scroll: number
  let shift: string
  let minZoom: number
  if (portrait) {
    // The stage beneath is rotated +90°, its canvas spanning the viewport's
    // long side times the cover zoom; during the transition the shift
    // wrapper carries the field-centering scroll as a transform, and the
    // pose compensates so the painting's crop window sits exactly on the
    // frame.
    minZoom = Math.max(1, vw / (vh * PAINTING_ASPECT))
    const canvasW = vh * minZoom
    const paintingH = canvasW * PAINTING_ASPECT
    scroll = clamp(
      FIELD_CENTER * paintingH - vw / 2,
      0,
      Math.max(0, paintingH - vw),
    )
    const scale = frame.width / ((CROP_RIGHT - CROP_LEFT) * canvasW)
    const dx = vw / 2 - paintingH / 2
    const dy = ((CROP_LEFT + CROP_RIGHT) / 2 - 0.5) * canvasW
    pose = {
      x: fcx - scale * dy,
      y: fcy + scale * dx + scale * scroll,
      rotate: -90,
      scale,
    }
    shift = `translateX(${scroll}px)`
  } else {
    minZoom = Math.max(1, vh / (vw * PAINTING_ASPECT))
    const canvasW = vw * minZoom
    const paintingH = canvasW * PAINTING_ASPECT
    scroll = clamp(
      FIELD_CENTER * paintingH - vh / 2,
      0,
      Math.max(0, paintingH - vh),
    )
    const cropFactor = window.matchMedia('(max-width: 880px)').matches
      ? 1 / (CROP_RIGHT - CROP_LEFT)
      : 1
    const scale = (frame.width * cropFactor) / canvasW
    pose = { x: fcx, y: fcy + scale * scroll, rotate: 0, scale }
    shift = `translateY(${-scroll}px)`
  }
  return {
    ...pose,
    ...poseChrome(pose, frame, portrait),
    scroll,
    shift,
    minZoom,
  }
}

/** The exit pose, measured at close time: takes the map exactly as the guest
 *  is seeing it — panned, pinched, anything — and shrinks and rotates the
 *  whole painting down onto its inline framed self, mask riding along, over
 *  the visible page. */
function exitPoseFor(
  canvas: DOMRect,
  frame: FrameBox,
  shift: string,
): ExitPose {
  const { vw, vh } = layoutViewport()
  const portrait = vh >= vw
  const cropped = window.matchMedia('(max-width: 880px)').matches
  const inlineW = cropped ? frame.width / (CROP_RIGHT - CROP_LEFT) : frame.width
  // The inline painting's center: its crop's left edge sits on the frame's
  // left edge (or the paintings coincide when uncropped).
  const icx =
    frame.left - (cropped ? CROP_LEFT * inlineW : 0) + inlineW / 2 - vw / 2
  const icy = frame.top + frame.height / 2 - vh / 2
  // The painting's rendered width right now: the rotated canvas presents its
  // width along the screen's vertical.
  const scale = inlineW / (portrait ? canvas.height : canvas.width)
  const pcx = canvas.left + canvas.width / 2 - vw / 2
  const pcy = canvas.top + canvas.height / 2 - vh / 2
  const pose = portrait
    ? { x: icx - scale * pcy, y: icy + scale * pcx, rotate: -90, scale }
    : { x: icx - scale * pcx, y: icy - scale * pcy, rotate: 0, scale }
  return { ...pose, ...poseChrome(pose, frame, portrait), shift }
}

export function CarnivalMap({
  editing = false,
  stamps,
  onToggleActivity,
}: {
  editing?: boolean
  /** Passport stamp state shared with CarnivalPassport — items with an
   *  activity render desaturated until stamped, and tapping toggles. */
  stamps?: Set<string>
  onToggleActivity?: (id: string) => void
}) {
  const [items, setItems] = useState<CarnivalPlacement[]>(
    () => loadDraft() ?? placements,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // The phone's fullscreen zoom view: a fixed overlay takes the whole
  // viewport (the web can't trigger real device rotation, and iOS has no
  // Fullscreen API, so this is our own everywhere). Native scrolling pans, a
  // two-finger pinch resizes the painting, and on a portrait screen CSS
  // spins the view landscape.
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const outerFrameRef = useRef<HTMLDivElement>(null)
  // Measured when the view opens; the page behind is scroll-locked while it
  // is up, so the window clip is still right for the exit.
  const [entryPose, setEntryPose] = useState<EntryPose | null>(null)
  // Measured when the view closes, from wherever the guest left the map.
  const [exitPose, setExitPose] = useState<ExitPose | null>(null)
  const zoomCanvasRef = useRef<HTMLDivElement>(null)
  // While the open animation runs, the stage lets the painting overflow so
  // the expanding clip window can reveal it; once settled it becomes the
  // scrollable pan surface.
  const [settled, setSettled] = useState(false)
  // True from close-tap until the exit animation lands: the inline canvas
  // hides so the flying card is the only map on screen (its frame border
  // stays as the empty slot it returns to).
  const [closing, setClosing] = useState(false)
  const reduce = useReducedMotion()

  const openZoom = () => {
    const frame = outerFrameRef.current
    setEntryPose(frame ? entryPoseFor(frame) : null)
    setExitPose(null)
    setSettled(false)
    setZoomOpen(true)
  }

  const closeZoom = () => {
    const canvas = zoomCanvasRef.current
    const frame = outerFrameRef.current
    const stage = stageRef.current
    // The measured pose must be committed in its own render before the
    // removal: AnimatePresence snapshots the exiting element's props from
    // the last render it was present in, and batching both updates together
    // would hand it the stale null pose.
    if (canvas && frame && stage) {
      const { box } = frameContentBox(frame)
      const canvasRect = canvas.getBoundingClientRect()
      // Convert the live scroll back into the equivalent transform, so the
      // stage can leave scroll-clipping mode in the same commit with nothing
      // moving: from then on the WHOLE painting is rendered, and the
      // shrinking mask has real content at its edges all the way down.
      const st = stage.scrollTop
      const sl = stage.scrollLeft
      const lv = layoutViewport()
      const shift =
        lv.vh >= lv.vw
          ? `translate(${st}px, ${-sl}px)`
          : `translate(${-sl}px, ${-st}px)`
      flushSync(() => {
        setExitPose(exitPoseFor(canvasRect, box, shift))
        setClosing(true)
      })
    }
    setZoomOpen(false)
  }

  const settleZoom = () => {
    if (zoomOpen) setSettled(true)
  }

  // The swap that keeps the settle invisible: the shift wrapper's transform
  // comes off and the equivalent real scrollTop goes on in the same commit,
  // before the browser paints — the field stays centered to the pixel while
  // the stage becomes genuinely pannable.
  useLayoutEffect(() => {
    if (!settled) return
    const stage = stageRef.current
    if (stage) stage.scrollTop = entryPose?.scroll ?? 0
  }, [settled, entryPose])
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    id: string
    mode: DragMode
    startX: number
    startY: number
    orig: CarnivalPlacement
  } | null>(null)

  const selected = items.find((p) => p.id === selectedId) ?? null

  // Reset must actually clear the stored draft: without this flag the persist
  // effect below would immediately re-save the code layout as a draft, and a
  // draft that shadows the code masks any later hand-edits to the array.
  const skipPersist = useRef(false)

  useEffect(() => {
    if (!editing) return
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(
          items.map(({ id, x, y, width, angle }) => ({ id, x, y, width, angle })),
        ),
      )
    } catch {
      // Private browsing: edits just won't survive a reload.
    }
  }, [items, editing])

  // While the zoom view is open: lock the page behind it and close on
  // Escape.
  useEffect(() => {
    if (!zoomOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [zoomOpen])

  // Pinch-to-zoom on the stage. Native scrolling already pans; the pinch
  // resizes the canvas and re-centers the scroll so the view stays anchored.
  useEffect(() => {
    if (!zoomOpen) return
    const minZoom = entryPose?.minZoom ?? 1
    zoomRef.current = minZoom
    setZoom(minZoom)
    const stage = stageRef.current
    if (!stage) return
    let pinch: { d0: number; z0: number } | null = null
    const dist = (t: TouchList) => {
      const [a, b] = [t.item(0), t.item(1)]
      if (!a || !b) return 0
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const d0 = dist(e.touches)
      if (d0 > 0) pinch = { d0, z0: zoomRef.current }
    }
    const onMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return
      e.preventDefault()
      const next = clamp(
        (pinch.z0 * dist(e.touches)) / pinch.d0,
        entryPose?.minZoom ?? 1,
        4,
      )
      const ratio = next / zoomRef.current
      if (ratio === 1) return
      const cx = stage.scrollLeft + stage.clientWidth / 2
      const cy = stage.scrollTop + stage.clientHeight / 2
      zoomRef.current = next
      setZoom(next)
      requestAnimationFrame(() => {
        stage.scrollLeft = cx * ratio - stage.clientWidth / 2
        stage.scrollTop = cy * ratio - stage.clientHeight / 2
      })
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null
    }
    stage.addEventListener('touchstart', onStart, { passive: true })
    stage.addEventListener('touchmove', onMove, { passive: false })
    stage.addEventListener('touchend', onEnd, { passive: true })
    stage.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      stage.removeEventListener('touchstart', onStart)
      stage.removeEventListener('touchmove', onMove)
      stage.removeEventListener('touchend', onEnd)
      stage.removeEventListener('touchcancel', onEnd)
    }
  }, [zoomOpen])

  const update = (id: string, patch: Partial<CarnivalPlacement>) =>
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const begin = (
    e: ReactPointerEvent,
    placement: CarnivalPlacement,
    mode: DragMode,
  ) => {
    if (!editing) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(placement.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      id: placement.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: placement,
    }
  }

  // Handles capture their pointer, and their move events bubble to the item
  // wrapper, so one handler covers all three modes.
  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current
    const rect = frameRef.current?.getBoundingClientRect()
    if (!drag || !rect) return
    const { orig } = drag
    if (drag.mode === 'move') {
      update(drag.id, {
        x: clamp(orig.x + ((e.clientX - drag.startX) / rect.width) * 100, 0, 100),
        y: clamp(orig.y + ((e.clientY - drag.startY) / rect.height) * 100, 0, 100),
      })
      return
    }
    const cx = rect.left + (orig.x / 100) * rect.width
    const cy = rect.top + (orig.y / 100) * rect.height
    if (drag.mode === 'resize') {
      const from = Math.hypot(drag.startX - cx, drag.startY - cy)
      const to = Math.hypot(e.clientX - cx, e.clientY - cy)
      if (from > 0) update(drag.id, { width: clamp(orig.width * (to / from), 1.5, 40) })
    } else {
      const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
      // The knob rides above the item, so pointing straight up is 0°.
      update(drag.id, { angle: Math.round(deg + 90) })
    }
  }

  const endDrag = () => {
    dragRef.current = null
  }

  // Fine control from the keyboard while something is selected.
  useEffect(() => {
    if (!editing || !selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }
      const step = e.shiftKey ? 1 : 0.25
      const patch = (p: CarnivalPlacement): Partial<CarnivalPlacement> | null => {
        switch (e.key) {
          case 'ArrowLeft':
            return { x: clamp(p.x - step, 0, 100) }
          case 'ArrowRight':
            return { x: clamp(p.x + step, 0, 100) }
          case 'ArrowUp':
            return { y: clamp(p.y - step, 0, 100) }
          case 'ArrowDown':
            return { y: clamp(p.y + step, 0, 100) }
          case '[':
            return { angle: (p.angle ?? 0) - 5 }
          case ']':
            return { angle: (p.angle ?? 0) + 5 }
          case '-':
            return { width: clamp(p.width - step, 1.5, 40) }
          case '=':
          case '+':
            return { width: clamp(p.width + step, 1.5, 40) }
          default:
            return null
        }
      }
      let handled = false
      setItems((cur) =>
        cur.map((p) => {
          if (p.id !== selectedId) return p
          const change = patch(p)
          if (!change) return p
          handled = true
          return { ...p, ...change }
        }),
      )
      if (handled) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, selectedId])

  const copyLayout = async () => {
    const code = layoutAsCode(items)
    // Always in the console too, in case the clipboard is unavailable.
    console.log(`[carnival-map layout]\n${code}`)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // The console copy above is the fallback.
    }
  }

  const resetLayout = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Nothing stored anyway.
    }
    skipPersist.current = true
    setItems(placements)
    setSelectedId(null)
  }

  return (
    <section className="carnival-map" aria-labelledby="carnival-map-title">
      <div className="carnival-map-heading">
        <h2 id="carnival-map-title">Carnival Map</h2>
      </div>
      {editing && (
        <div className="carnival-editor-bar">
          <p className="carnival-editor-hint">
            {selected
              ? `${selected.id} · x ${round1(selected.x)} · y ${round1(selected.y)} · w ${round1(selected.width)} · ${Math.round(selected.angle ?? 0)}°`
              : 'Drag to move · corner dot resizes · knob rotates · arrows nudge (shift = big) · [ ] rotate · - = resize'}
          </p>
          <div className="carnival-editor-actions">
            <button type="button" onClick={copyLayout}>
              {copied ? 'Copied ✓' : 'Copy layout'}
            </button>
            <button type="button" onClick={resetLayout}>
              Reset
            </button>
          </div>
        </div>
      )}
      <div
        className="carnival-map-frame"
        ref={outerFrameRef}
        onPointerDown={editing ? () => setSelectedId(null) : undefined}
      >
        {/* The canvas always holds the full painting; on phones it renders
            wider than the frame and shifts left, so the clip crops away the
            barn and the gardens and the lawn fills the screen. Items keep
            their percentages because they ride on the canvas, not the
            frame. */}
        <div
          className="carnival-map-canvas"
          ref={frameRef}
          style={closing ? { visibility: 'hidden' } : undefined}
        >
        <img
          className="carnival-map-base"
          src="/art/map/carnival-lawn-base.webp"
          alt="Watercolor overhead map of the Carnival lawn beside the red-roofed barn and formal gardens."
          width={1689}
          height={931}
        />
        {items.map((placement) => {
          const activity = placement.activity
          const interactive = !editing && !!activity && !!onToggleActivity
          const stamped = !!activity && !!stamps?.has(activity)
          return (
          <div
            key={placement.id}
            className={`carnival-map-item${editing ? ' is-editable' : ''}${
              selectedId === placement.id ? ' is-selected' : ''
            }${interactive ? ' is-interactive' : ''}${
              interactive && !stamped ? ' is-todo' : ''
            }`}
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              width: `${placement.width}%`,
              transform: `translate(-50%, -50%) rotate(${placement.angle ?? 0}deg)`,
            }}
            onPointerDown={(e) => begin(e, placement, 'move')}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            {...(interactive
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-pressed': stamped,
                  'aria-label': placement.label,
                  onClick: () => onToggleActivity(activity),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggleActivity(activity)
                    }
                  },
                }
              : {})}
          >
            <img src={placement.src} alt="" aria-hidden="true" draggable={false} />
            {editing && selectedId === placement.id && (
              <>
                <span className="cmi-rotate-stick" aria-hidden="true" />
                <span
                  className="cmi-rotate"
                  role="presentation"
                  onPointerDown={(e) => begin(e, placement, 'rotate')}
                />
                <span
                  className="cmi-resize"
                  role="presentation"
                  onPointerDown={(e) => begin(e, placement, 'resize')}
                />
              </>
            )}
          </div>
          )
        })}
        </div>
        {SLOWMO > 1 && (
          <div className="carnival-debug" aria-hidden="true">
            {`${ZOOM_BUILD} · inner ${window.innerWidth}x${window.innerHeight} · client ${document.documentElement.clientWidth}x${document.documentElement.clientHeight} · vvScale ${window.visualViewport ? window.visualViewport.scale.toFixed(3) : 'n/a'} · dpr ${window.devicePixelRatio}`}
          </div>
        )}
        {!editing && (
          <button
            type="button"
            className="carnival-map-expand"
            aria-label="Open the full map"
            onClick={openZoom}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
            </svg>
          </button>
        )}
        <ul className="sr-only">
          {items.map((placement) => (
            <li key={placement.id}>{placement.label}</li>
          ))}
        </ul>
      </div>

      <AnimatePresence onExitComplete={() => setClosing(false)}>
      {zoomOpen && (
        <motion.div
          className={`carnival-zoom${!settled || closing ? ' is-animating' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Carnival map, zoomed"
          // Both directions are one gesture on this root: the WHOLE painting
          // (fully rendered — the stage is not scroll-clipping during either
          // transition) rotates and scales between its inline pose and
          // fullscreen, while the mask, defined in this element's own space
          // so it rides the transform, morphs between the frame's rounded
          // rect and the viewport. The transform anchors on the similarity's
          // fixed point, so each direction is a pure spiral.
          initial={
            reduce || !entryPose
              ? { opacity: 0 }
              : {
                  ...(entryPose.translate
                    ? { x: entryPose.x, y: entryPose.y }
                    : {}),
                  rotate: entryPose.rotate,
                  scale: entryPose.scale,
                  clipPath: entryPose.clip,
                  opacity: 1,
                }
          }
          animate={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            clipPath: `polygon(0px 0px, ${document.documentElement.clientWidth}px 0px, ${document.documentElement.clientWidth}px ${document.documentElement.clientHeight}px, 0px ${document.documentElement.clientHeight}px)`,
          }}
          // Entry and exit have different fixed points; the origin swaps at
          // close time, when the standing transform is identity, so the swap
          // itself is invisible.
          style={{
            transformOrigin: closing ? exitPose?.origin : entryPose?.origin,
          }}
          exit={
            reduce || !exitPose
              ? { opacity: 0 }
              : {
                  ...(exitPose.translate
                    ? { x: exitPose.x, y: exitPose.y }
                    : {}),
                  rotate: exitPose.rotate,
                  scale: exitPose.scale,
                  clipPath: exitPose.clip,
                  transition: {
                    duration: 0.45 * SLOWMO,
                    ease: [0.22, 0.61, 0.36, 1],
                  },
                }
          }
          transition={{ duration: 0.45 * SLOWMO, ease: [0.22, 0.61, 0.36, 1] }}
          onAnimationComplete={settleZoom}
        >
          <div className="carnival-zoom-content">
          {/* Carries the scroll-equivalent offset as a transform whenever the
              stage is not in scroll mode: the field-centering scroll during
              the entrance, the guest's live scroll during the exit. */}
          <div
            className="carnival-zoom-shift"
            style={
              closing && exitPose
                ? { transform: exitPose.shift }
                : settled || !entryPose
                  ? undefined
                  : { transform: entryPose.shift }
            }
          >
          <div
            className={`carnival-zoom-stage${settled && !closing ? ' is-settled' : ''}`}
            ref={stageRef}
          >
            <div
              className="carnival-zoom-canvas"
              ref={zoomCanvasRef}
              // Not rounded to whole percents: the cover zoom is fractional
              // (e.g. 102.2%), and rounding it down let a sub-pixel strip of
              // page show beside the fullscreen painting.
              style={{ width: `${(zoom * 100).toFixed(3)}%` }}
            >
              <img
                className="carnival-map-base"
                src="/art/map/carnival-lawn-base.webp"
                alt=""
                width={1689}
                height={931}
              />
              {items.map((placement) => {
                const activity = placement.activity
                const stamped = !!activity && !!stamps?.has(activity)
                const interactive = !!activity && !!onToggleActivity
                return (
                  <div
                    key={placement.id}
                    className={`carnival-map-item${interactive ? ' is-interactive' : ''}${
                      interactive && !stamped ? ' is-todo' : ''
                    }`}
                    style={{
                      left: `${placement.x}%`,
                      top: `${placement.y}%`,
                      width: `${placement.width}%`,
                      transform: `translate(-50%, -50%) rotate(${placement.angle ?? 0}deg)`,
                    }}
                    {...(interactive
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          'aria-pressed': stamped,
                          'aria-label': placement.label,
                          onClick: () => onToggleActivity(activity),
                        }
                      : {})}
                  >
                    <img src={placement.src} alt="" aria-hidden="true" draggable={false} />
                  </div>
                )
              })}
            </div>
          </div>
          </div>
          </div>
          {/* Pinned to the screen's own bottom-right — the user's top right
              once they've turned the phone. The icon is symmetric under a
              quarter turn, so it reads either way. */}
          <button
            type="button"
            className="carnival-zoom-close"
            aria-label="Exit full screen"
            onClick={closeZoom}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
            </svg>
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
}
