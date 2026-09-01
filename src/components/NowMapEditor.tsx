import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  routePath,
  type ActiveEvent,
  type MapHighlight,
  type MapRoute,
} from '@/data/active-events'

/* ------------------------------------------------------------------------- *
 * SUPERSEDED by the venue map editor at /map-editor, which does all of this
 * against the new grounds artwork and saves to venue-map.json. This one stays
 * only because /now still renders its highlights and route out of
 * active-events.ts; it goes when that page moves onto the map document.
 *
 * Temporary aerial trace editor. Toggled from the admin Preview chip, it
 * replaces the event's map so the couple can drag the highlight boxes
 * (move, corner-resize, rotate), reshape the route (drag waypoints, click
 * the line to add one, double-click a dot to remove it), and place the
 * labels — then copy the numbers back into active-events.ts. Rip it out
 * once every event's tracing is final.
 * ------------------------------------------------------------------------- */

const DRAFT_PREFIX = 'now-map.trace-draft.'

/** What the editor edits — the traceable slice of an ActiveEvent. */
type Trace = {
  highlights: MapHighlight[]
  route?: MapRoute
}

/** Only geometry goes in the draft; label texts stay in code, so hand-edits
 *  to the words are never masked by a stale draft. */
type DraftShape = {
  highlights: MapHighlight[]
  route?: {
    points: { x: number; y: number }[]
    startLabel: { x: number; y: number }
    endLabel: { x: number; y: number }
  }
}

function traceFromConfig(active: ActiveEvent): Trace {
  return {
    highlights: active.highlights.map((b) => ({ ...b })),
    route: active.route
      ? {
          points: active.route.points.map((p) => ({ ...p })),
          startLabel: { ...active.route.startLabel },
          endLabel: { ...active.route.endLabel },
        }
      : undefined,
  }
}

/** A draft in localStorage overrides the config's numbers so an accidental
 *  reload never loses edits. A draft route without a config route is
 *  ignored — the route's texts and existence belong to code. */
function loadTrace(active: ActiveEvent): Trace {
  const fromConfig = traceFromConfig(active)
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + active.event.anchor)
    if (!raw) return fromConfig
    const draft = JSON.parse(raw) as DraftShape
    return {
      highlights: draft.highlights,
      route:
        fromConfig.route && draft.route
          ? {
              points: draft.route.points,
              startLabel: {
                ...draft.route.startLabel,
                text: fromConfig.route.startLabel.text,
              },
              endLabel: {
                ...draft.route.endLabel,
                text: fromConfig.route.endLabel.text,
              },
            }
          : fromConfig.route,
    }
  } catch {
    return fromConfig
  }
}

function saveTrace(id: string, trace: Trace) {
  const draft: DraftShape = {
    highlights: trace.highlights,
    route: trace.route
      ? {
          points: trace.route.points,
          startLabel: { x: trace.route.startLabel.x, y: trace.route.startLabel.y },
          endLabel: { x: trace.route.endLabel.x, y: trace.route.endLabel.y },
        }
      : undefined,
  }
  try {
    localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(draft))
  } catch {
    // Private browsing: edits just won't survive a reload.
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

const quote = (text: string) => `'${text.replace(/'/g, "\\'")}'`

/** The event's `highlights:` (and `route:`) fields, indented to paste
 *  straight over the ones in active-events.ts. */
function traceAsCode(trace: Trace) {
  const lines = [
    '    highlights: [',
    ...trace.highlights.map(
      (b) =>
        `      { x: ${round1(b.x)}, y: ${round1(b.y)}, w: ${round1(b.w)}, h: ${round1(b.h)}, angle: ${Math.round(b.angle)} },`,
    ),
    '    ],',
  ]
  if (trace.route) {
    const { points, startLabel, endLabel } = trace.route
    lines.push(
      '    route: {',
      '      points: [',
      ...points.map((p) => `        { x: ${round1(p.x)}, y: ${round1(p.y)} },`),
      '      ],',
      `      startLabel: { x: ${round1(startLabel.x)}, y: ${round1(startLabel.y)}, text: ${quote(startLabel.text)} },`,
      `      endLabel: { x: ${round1(endLabel.x)}, y: ${round1(endLabel.y)}, text: ${quote(endLabel.text)} },`,
      '    },',
    )
  }
  return lines.join('\n')
}

/** What the pointer is holding: one highlight box (with a mode), one route
 *  waypoint, or one label plate. */
type Target =
  | { kind: 'box'; index: number; mode: 'move' | 'resize' | 'rotate' }
  | { kind: 'point'; index: number }
  | { kind: 'label'; which: 'startLabel' | 'endLabel' }

type DragSession = {
  target: Target
  startX: number
  startY: number
  origBox?: MapHighlight
  origPoint?: { x: number; y: number }
}

export function NowMapEditor({ active }: { active: ActiveEvent }) {
  const [trace, setTrace] = useState<Trace>(() => loadTrace(active))
  const [selected, setSelected] = useState<Target | null>(null)
  const [copied, setCopied] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragSession | null>(null)

  const patchBox = (index: number, patch: Partial<MapHighlight>) =>
    setTrace((cur) => ({
      ...cur,
      highlights: cur.highlights.map((b, i) =>
        i === index ? { ...b, ...patch } : b,
      ),
    }))

  const patchPoint = (index: number, point: { x: number; y: number }) =>
    setTrace((cur) =>
      cur.route
        ? {
            ...cur,
            route: {
              ...cur.route,
              points: cur.route.points.map((p, i) => (i === index ? point : p)),
            },
          }
        : cur,
    )

  const patchLabel = (
    which: 'startLabel' | 'endLabel',
    position: { x: number; y: number },
  ) =>
    setTrace((cur) =>
      cur.route
        ? {
            ...cur,
            route: {
              ...cur.route,
              [which]: { ...cur.route[which], ...position },
            },
          }
        : cur,
    )

  const begin = (e: ReactPointerEvent, target: Target) => {
    e.preventDefault()
    e.stopPropagation()
    setSelected(target)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      origBox:
        target.kind === 'box' ? { ...trace.highlights[target.index]! } : undefined,
      origPoint:
        target.kind === 'point'
          ? { ...trace.route!.points[target.index]! }
          : target.kind === 'label'
            ? { x: trace.route![target.which].x, y: trace.route![target.which].y }
            : undefined,
    }
  }

  // Handles capture their pointer, and their move events bubble to the
  // element that owns this handler, so one handler covers every mode.
  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current
    const rect = frameRef.current?.getBoundingClientRect()
    if (!drag || !rect) return
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100
    const { target } = drag

    if (target.kind === 'point' && drag.origPoint) {
      patchPoint(target.index, {
        x: clamp(drag.origPoint.x + dxPct, 0, 100),
        y: clamp(drag.origPoint.y + dyPct, 0, 100),
      })
      return
    }
    if (target.kind === 'label' && drag.origPoint) {
      patchLabel(target.which, {
        x: clamp(drag.origPoint.x + dxPct, 0, 100),
        y: clamp(drag.origPoint.y + dyPct, 0, 100),
      })
      return
    }
    if (target.kind !== 'box' || !drag.origBox) return
    const orig = drag.origBox
    if (target.mode === 'move') {
      patchBox(target.index, {
        x: clamp(orig.x + dxPct, 0, 100),
        y: clamp(orig.y + dyPct, 0, 100),
      })
      return
    }
    const cx = rect.left + (orig.x / 100) * rect.width
    const cy = rect.top + (orig.y / 100) * rect.height
    if (target.mode === 'rotate') {
      const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
      // The knob rides above the box, so pointing straight up is 0°.
      patchBox(target.index, { angle: Math.round(deg + 90) })
      return
    }
    // Resize: the corner handle follows the pointer while the center stays
    // put. Unrotate the pointer's offset into the box's own axes; the aerial
    // is square, so x% and y% share one scale.
    const rad = (-orig.angle * Math.PI) / 180
    const px = ((e.clientX - cx) / rect.width) * 100
    const py = ((e.clientY - cy) / rect.height) * 100
    const lx = px * Math.cos(rad) - py * Math.sin(rad)
    const ly = px * Math.sin(rad) + py * Math.cos(rad)
    patchBox(target.index, {
      w: clamp(Math.abs(lx) * 2, 1.5, 80),
      h: clamp(Math.abs(ly) * 2, 1.5, 80),
    })
  }

  const endDrag = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setTrace((cur) => {
      saveTrace(active.event.anchor, cur)
      return cur
    })
  }

  /** Clicking the line grows it: insert a waypoint where the nearest segment
   *  passes and let the same gesture keep dragging it. */
  const insertPoint = (e: ReactPointerEvent<SVGPathElement>) => {
    const rect = frameRef.current?.getBoundingClientRect()
    const points = trace.route?.points
    if (!rect || !points) return
    e.preventDefault()
    e.stopPropagation()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    let bestIndex = 1
    let bestDist = Infinity
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!
      const b = points[i + 1]!
      const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
      const t =
        len2 === 0
          ? 0
          : clamp(((px - a.x) * (b.x - a.x) + (py - a.y) * (b.y - a.y)) / len2, 0, 1)
      const dist = Math.hypot(px - (a.x + t * (b.x - a.x)), py - (a.y + t * (b.y - a.y)))
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = i + 1
      }
    }
    setTrace((cur) =>
      cur.route
        ? {
            ...cur,
            route: {
              ...cur.route,
              points: [
                ...cur.route.points.slice(0, bestIndex),
                { x: px, y: py },
                ...cur.route.points.slice(bestIndex),
              ],
            },
          }
        : cur,
    )
    const target: Target = { kind: 'point', index: bestIndex }
    setSelected(target)
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    dragRef.current = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      origPoint: { x: px, y: py },
    }
  }

  const removePoint = (index: number) => {
    setTrace((cur) => {
      if (!cur.route || cur.route.points.length <= 2) return cur
      const next = {
        ...cur,
        route: {
          ...cur.route,
          points: cur.route.points.filter((_, i) => i !== index),
        },
      }
      saveTrace(active.event.anchor, next)
      return next
    })
    setSelected(null)
  }

  const removeBox = (index: number) => {
    setTrace((cur) => {
      const next = {
        ...cur,
        highlights: cur.highlights.filter((_, i) => i !== index),
      }
      saveTrace(active.event.anchor, next)
      return next
    })
    setSelected(null)
  }

  const addBox = () => {
    setTrace((cur) => {
      const next = {
        ...cur,
        highlights: [...cur.highlights, { x: 50, y: 50, w: 12, h: 8, angle: 0 }],
      }
      saveTrace(active.event.anchor, next)
      return next
    })
    setSelected({ kind: 'box', index: trace.highlights.length, mode: 'move' })
  }

  // Fine control from the keyboard while something is selected.
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null)
        return
      }
      const step = e.shiftKey ? 1 : 0.25
      const nudge = (p: { x: number; y: number }) => {
        switch (e.key) {
          case 'ArrowLeft':
            return { x: clamp(p.x - step, 0, 100), y: p.y }
          case 'ArrowRight':
            return { x: clamp(p.x + step, 0, 100), y: p.y }
          case 'ArrowUp':
            return { x: p.x, y: clamp(p.y - step, 0, 100) }
          case 'ArrowDown':
            return { x: p.x, y: clamp(p.y + step, 0, 100) }
          default:
            return null
        }
      }
      let handled = false
      if (selected.kind === 'box') {
        const box = trace.highlights[selected.index]
        if (!box) return
        const moved = nudge(box)
        const patch: Partial<MapHighlight> | null = moved
          ? moved
          : e.key === '['
            ? { angle: box.angle - (e.shiftKey ? 5 : 1) }
            : e.key === ']'
              ? { angle: box.angle + (e.shiftKey ? 5 : 1) }
              : null
        if (patch) {
          patchBox(selected.index, patch)
          handled = true
        }
      } else if (selected.kind === 'point') {
        const point = trace.route?.points[selected.index]
        const moved = point && nudge(point)
        if (moved) {
          patchPoint(selected.index, moved)
          handled = true
        }
      } else {
        const label = trace.route?.[selected.which]
        const moved = label && nudge(label)
        if (moved) {
          patchLabel(selected.which, moved)
          handled = true
        }
      }
      if (handled) {
        e.preventDefault()
        setTrace((cur) => {
          saveTrace(active.event.anchor, cur)
          return cur
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, trace, active.event.anchor])

  const copyTrace = async () => {
    const code = traceAsCode(trace)
    // Always in the console too, in case the clipboard is unavailable.
    console.log(`[now-map trace: ${active.event.anchor}]\n${code}`)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // The console copy above is the fallback.
    }
  }

  const resetTrace = () => {
    try {
      localStorage.removeItem(DRAFT_PREFIX + active.event.anchor)
    } catch {
      // Nothing stored anyway.
    }
    setTrace(traceFromConfig(active))
    setSelected(null)
  }

  const hint =
    selected?.kind === 'box'
      ? (() => {
          const b = trace.highlights[selected.index]
          return b
            ? `box ${selected.index} · x ${round1(b.x)} · y ${round1(b.y)} · w ${round1(b.w)} · h ${round1(b.h)} · ${Math.round(b.angle)}°`
            : ''
        })()
      : selected?.kind === 'point'
        ? (() => {
            const p = trace.route?.points[selected.index]
            return p ? `point ${selected.index} · x ${round1(p.x)} · y ${round1(p.y)}` : ''
          })()
        : selected?.kind === 'label'
          ? (() => {
              const l = trace.route?.[selected.which]
              return l ? `${selected.which} · x ${round1(l.x)} · y ${round1(l.y)}` : ''
            })()
          : `Drag anything · corner dot resizes · knob rotates · ${
              trace.route ? 'click the line to add a point · ' : ''
            }double-click removes · arrows nudge (shift = big)`

  const route = trace.route
  const isSelected = (t: Target) =>
    !!selected &&
    selected.kind === t.kind &&
    (selected.kind === 'label'
      ? selected.which === (t as { which: string }).which
      : (selected as { index: number }).index === (t as { index: number }).index)

  return (
    <div className="now-map is-tracing">
      <div className="trace-wrap">
        <div className="carnival-editor-bar trace-bar">
          <p className="carnival-editor-hint">{hint}</p>
          <div className="carnival-editor-actions">
            <button type="button" onClick={addBox}>
              Add box
            </button>
            <button type="button" onClick={copyTrace}>
              {copied ? 'Copied ✓' : 'Copy data'}
            </button>
            <button type="button" onClick={resetTrace}>
              Reset
            </button>
          </div>
        </div>
        <div
          className="map-frame"
          ref={frameRef}
          onPointerDown={() => setSelected(null)}
        >
          <img
            src="/art/map/aerial.webp"
            alt=""
            className="map-base"
            width={1180}
            height={1180}
            draggable={false}
          />
          {trace.highlights.map((box, index) => {
            const target: Target = { kind: 'box', index, mode: 'move' }
            return (
              <span
                key={index}
                className={`now-highlight is-editable${
                  isSelected(target) ? ' is-selected' : ''
                }`}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                  transform: `translate(-50%, -50%) rotate(${box.angle}deg)`,
                }}
                onPointerDown={(e) => begin(e, target)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDoubleClick={() => removeBox(index)}
              >
                {isSelected(target) && (
                  <>
                    <span className="cmi-rotate-stick" aria-hidden="true" />
                    <span
                      className="cmi-rotate"
                      role="presentation"
                      onPointerDown={(e) =>
                        begin(e, { kind: 'box', index, mode: 'rotate' })
                      }
                    />
                    <span
                      className="cmi-resize"
                      role="presentation"
                      onPointerDown={(e) =>
                        begin(e, { kind: 'box', index, mode: 'resize' })
                      }
                    />
                  </>
                )}
              </span>
            )
          })}
          {route ? (
            <>
              <svg className="now-route" viewBox="0 0 100 100" aria-hidden="true">
                <path className="now-route-casing" d={routePath(route.points)} />
                <path className="now-route-line" d={routePath(route.points)} />
                <path
                  className="trace-hit"
                  d={routePath(route.points)}
                  onPointerDown={insertPoint}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              </svg>
              {route.points.map((point, index) => {
                const target: Target = { kind: 'point', index }
                return (
                  <span
                    key={index}
                    className={`trace-dot${isSelected(target) ? ' is-selected' : ''}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onPointerDown={(e) => begin(e, target)}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onDoubleClick={() => removePoint(index)}
                  />
                )
              })}
              {(['startLabel', 'endLabel'] as const).map((which) => {
                const target: Target = { kind: 'label', which }
                return (
                  <span
                    key={which}
                    className={`now-route-label is-editable${
                      isSelected(target) ? ' is-selected' : ''
                    }`}
                    style={{
                      left: `${route[which].x}%`,
                      top: `${route[which].y}%`,
                    }}
                    onPointerDown={(e) => begin(e, target)}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    {route[which].text}
                  </span>
                )
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
