import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

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
  // The phone's fullscreen zoom view: native scrolling pans, a two-finger
  // pinch resizes the painting, and CSS turns it landscape on a portrait
  // screen (with a best-effort real orientation lock where the browser
  // allows one).
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const zoomRootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
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

  // While the zoom view is open: lock the page behind it, close on Escape,
  // and ask nicely for real fullscreen + landscape (Android grants it; iOS
  // declines and the portrait-rotation CSS carries it instead).
  useEffect(() => {
    if (!zoomOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>
      unlock?: () => void
    }
    zoomRootRef.current
      ?.requestFullscreen?.()
      .then(() => orientation.lock?.('landscape'))
      .catch(() => {})
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      try {
        orientation.unlock?.()
      } catch {
        // Nothing was locked.
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [zoomOpen])

  // Pinch-to-zoom on the stage. Native scrolling already pans; the pinch
  // resizes the canvas and re-centers the scroll so the view stays anchored.
  useEffect(() => {
    if (!zoomOpen) return
    zoomRef.current = 1
    setZoom(1)
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
      const next = clamp((pinch.z0 * dist(e.touches)) / pinch.d0, 1, 4)
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
        onPointerDown={editing ? () => setSelectedId(null) : undefined}
      >
        {/* The canvas always holds the full painting; on phones it renders
            wider than the frame and shifts left, so the clip crops away the
            barn and the gardens and the lawn fills the screen. Items keep
            their percentages because they ride on the canvas, not the
            frame. */}
        <div className="carnival-map-canvas" ref={frameRef}>
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
        {!editing && (
          <button
            type="button"
            className="carnival-map-expand"
            aria-label="Open the full map"
            onClick={() => setZoomOpen(true)}
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

      {zoomOpen && (
        <div
          className="carnival-zoom"
          ref={zoomRootRef}
          role="dialog"
          aria-modal="true"
          aria-label="Carnival map, zoomed"
        >
          <div className="carnival-zoom-stage" ref={stageRef}>
            <div
              className="carnival-zoom-canvas"
              style={{ width: `${Math.round(zoom * 100)}%` }}
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
          <button
            type="button"
            className="carnival-zoom-close"
            aria-label="Close the map"
            onClick={() => setZoomOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
