import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { useMapViewport, usePinch } from '@/components/useMapViewport'
import {
  boundsOf,
  centroid,
  clamp,
  DEFAULT_LABEL_SIZE,
  emptyLayer,
  labelSizeFor,
  layerPoints,
  nearestSegment,
  ringPath,
  round1,
  smoothPath,
  type MapAccentName,
  type MapArea,
  type MapFocus,
  type MapLabel,
  type MapLayer,
  type MapPath,
  type MapPoint,
  type MapSticker,
  type VenueMapDoc,
} from '@/data/venue-map'
import {
  clearDraft,
  clone,
  loadDraft,
  saveDoc,
  savedDoc,
  writeDraft,
  type SaveResult,
} from '@/data/venue-map-store'

/**
 * The venue map editor at `/map-editor`.
 *
 * One permanent tool for laying out every event's map on the grounds artwork.
 * A layer is four independent lists — regions, paths, labels, stickers — plus
 * one focus rectangle, and every piece is placed, moved, renamed, and deleted
 * on its own. Nothing is implied: naming a region does not put words on the
 * map, and a label can sit anywhere, over a region or nowhere near one.
 *
 * The focus rectangle is reference geometry, not content. It paints underneath
 * everything and takes no clicks at all unless the Focus tool is up, so it can
 * cover the whole map without ever getting in the way of what is inside it.
 *
 * Everything is stored as percentages of the artwork, so the layout survives
 * the painting being re-exported, and every edit lands in a localStorage draft
 * immediately: Save is for publishing, not for not losing work.
 */

/* -- the art a sticker can be ---------------------------------------------- */

const CARNIVAL_ART = [
  'airstream-drinks', 'banquet-table', 'bazaar', 'bicycle', 'block-print',
  'block-print-tote', 'camera', 'candy-bag', 'candy-cart', 'chaat-papdi',
  'chair', 'cmu-fence', 'cocktail-table', 'dabeli', 'dhol', 'entrance-arch',
  'food-stall', 'henna', 'jenga', 'jigsaw', 'lemonade', 'nazar', 'paan-cart',
  'pani-puri', 'photo-booth', 'picnic-carrom', 'picnic-carrom-jenga', 'samosa',
  'sunglasses', 'umbrella-arch', 'yarn-art',
] as const

const MARKER_ART = [
  'icon-carnival', 'icon-dinner', 'icon-parking', 'icon-sangeet', 'icon-sunset',
] as const

const EVENT_CAMERA_ART = [
  {
    src: '/art/map/event-cameras/camera-shaadi.webp',
    name: 'Sunset Shaadi camera',
  },
  {
    src: '/art/map/event-cameras/camera-carnival.webp',
    name: 'Carnival camera',
  },
  {
    src: '/art/map/event-cameras/camera-sangeet.webp',
    name: 'Sangeet camera',
  },
] as const

const STICKER_ART: { src: string; name: string }[] = [
  ...CARNIVAL_ART.map((file) => ({
    src: `/art/map/carnival/${file}.webp`,
    name: file.replace(/-/g, ' '),
  })),
  ...EVENT_CAMERA_ART,
  ...MARKER_ART.map((file) => ({
    src: `/art/map/${file}.webp`,
    name: file.replace(/^icon-/, '').replace(/-/g, ' '),
  })),
]

const ACCENTS: MapAccentName[] = [
  'sunset',
  'carnival',
  'copper',
  'forest',
  'rose',
  'gold',
  'slate',
]

/* -- the four kinds, handled one way --------------------------------------- */

type Kind = 'area' | 'path' | 'label' | 'sticker'
type Item = MapArea | MapPath | MapLabel | MapSticker

/** Which list on the layer each kind lives in. */
const LIST = {
  area: 'areas',
  path: 'paths',
  label: 'labels',
  sticker: 'stickers',
} as const

const KINDS: { kind: Kind; one: string; many: string }[] = [
  { kind: 'area', one: 'Region', many: 'Regions' },
  { kind: 'path', one: 'Path', many: 'Paths' },
  { kind: 'label', one: 'Label', many: 'Labels' },
  { kind: 'sticker', one: 'Sticker', many: 'Stickers' },
]

const hasPoints = (item: Item): item is MapArea | MapPath => 'points' in item

/** The one place the four lists are treated as one, so nothing else has to. */
const itemsOf = (layer: MapLayer, kind: Kind): Item[] => layer[LIST[kind]]

const findItem = (layer: MapLayer, kind: Kind, id: string) =>
  itemsOf(layer, kind).find((item) => item.id === id)

/** Move a whole item by a delta, whatever shape it is. */
function translate(item: Item, dx: number, dy: number): Partial<Item> {
  if (hasPoints(item)) {
    return {
      points: item.points.map((p) => ({
        x: clamp(p.x + dx, 0, 100),
        y: clamp(p.y + dy, 0, 100),
      })),
    }
  }
  return { x: clamp(item.x + dx, 0, 100), y: clamp(item.y + dy, 0, 100) }
}

/** Where an item sits, for framing it and for dropping a label on it. */
function anchorOf(item: Item): MapPoint {
  if (!hasPoints(item)) return { x: item.x, y: item.y }
  return item.points.length > 2
    ? centroid(item.points)
    : (item.points[Math.floor(item.points.length / 2)] ?? { x: 50, y: 50 })
}

/* -- selection and dragging ------------------------------------------------ */

type Tool = 'select' | 'area' | 'path' | 'label' | 'focus' | 'sticker'

type Sel = { kind: 'focus' } | { kind: Kind; id: string }

type Corner = 'nw' | 'ne' | 'sw' | 'se'

type Drag =
  | { kind: 'pan'; lastX: number; lastY: number }
  | { kind: 'focus-new'; from: MapPoint }
  | { kind: 'focus-move'; orig: MapFocus; from: MapPoint }
  | { kind: 'focus-resize'; corner: Corner; orig: MapFocus }
  | { kind: 'move'; on: Kind; id: string; orig: Item; from: MapPoint }
  | {
      kind: 'vertex'
      on: Kind
      id: string
      index: number
      orig: MapPoint
      from: MapPoint
    }
  | {
      kind: 'scale'
      on: 'label' | 'sticker'
      id: string
      /** The item's centre, and its size when the grab started. */
      at: MapPoint
      size: number
      from: MapPoint
    }
  | { kind: 'rotate'; id: string; at: MapPoint }

const WHOLE_ART: MapFocus = { x: 50, y: 50, w: 100, h: 100 }

const uniqueId = (base: string, taken: Set<string>) => {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const stem = slug || 'item'
  if (!taken.has(stem)) return stem
  let n = 2
  while (taken.has(`${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}

export function MapEditor() {
  const initial = useMemo(loadDraft, [])
  const [doc, setDoc] = useState<VenueMapDoc>(initial.doc)
  const [hasDraft, setHasDraft] = useState(initial.fromDraft)
  const [layerId, setLayerId] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('event')
    return (
      initial.doc.layers.find((l) => l.id === wanted)?.id ??
      initial.doc.layers[0]?.id ??
      ''
    )
  })
  const [tool, setTool] = useState<Tool>('select')
  const [sel, setSel] = useState<Sel | null>(null)
  const [drafting, setDrafting] = useState<{
    kind: 'area' | 'path'
    points: MapPoint[]
  } | null>(null)
  const [stickerSrc, setStickerSrc] = useState(STICKER_ART[0]!.src)
  const [ghosts, setGhosts] = useState(false)
  const [status, setStatus] = useState('')

  const docRef = useRef(doc)
  docRef.current = doc
  const past = useRef<VenueMapDoc[]>([])
  const future = useRef<VenueMapDoc[]>([])
  const dragRef = useRef<Drag | null>(null)
  const nameFieldRef = useRef<HTMLInputElement>(null)
  const focusNameField = useRef(false)

  const layer = doc.layers.find((l) => l.id === layerId) ?? doc.layers[0]!
  const viewport = useMapViewport({
    art: doc.art,
    bounds: WHOLE_ART,
    fit: 'contain',
  })
  const pinch = usePinch(viewport)

  useEffect(() => {
    const previous = document.title
    document.title = 'Map editor · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  // Every edit lands in the draft straight away, so the only thing Save is
  // for is publishing to the file the site ships.
  useEffect(() => {
    writeDraft(doc)
  }, [doc])

  // A freshly placed label wants its words typed immediately. The focus has
  // to wait a frame: the click that placed it is still in flight, and the
  // browser hands focus back to the body when it lands.
  useEffect(() => {
    if (!focusNameField.current) return
    focusNameField.current = false
    const frame = requestAnimationFrame(() => {
      nameFieldRef.current?.focus()
      nameFieldRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [sel])

  /* -- history ------------------------------------------------------------ */

  const pushHistory = useCallback(() => {
    past.current = [...past.current.slice(-49), clone(docRef.current)]
    future.current = []
  }, [])

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (!previous) return
    future.current = [clone(docRef.current), ...future.current.slice(0, 49)]
    setDoc(previous)
    setSel(null)
    setStatus('Undid the last change')
  }, [])

  const redo = useCallback(() => {
    const [next, ...rest] = future.current
    if (!next) return
    future.current = rest
    past.current = [...past.current, clone(docRef.current)]
    setDoc(next)
    setSel(null)
    setStatus('Redid the change')
  }, [])

  /* -- mutation ----------------------------------------------------------- */

  const patchLayer = useCallback(
    (fn: (current: MapLayer) => MapLayer) =>
      setDoc((cur) => ({
        ...cur,
        layers: cur.layers.map((l) => (l.id === layerId ? fn(l) : l)),
      })),
    [layerId],
  )

  /** Patch one item of any kind. Treating the four lists uniformly costs one
   *  cast, and it lives only in these three helpers. */
  const patchItem = useCallback(
    (kind: Kind, id: string, patch: Partial<Item>) =>
      patchLayer((l) => ({
        ...l,
        [LIST[kind]]: (l[LIST[kind]] as Item[]).map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      })),
    [patchLayer],
  )

  const addItem = useCallback(
    (kind: Kind, item: Item) =>
      patchLayer((l) => ({
        ...l,
        [LIST[kind]]: [...(l[LIST[kind]] as Item[]), item],
      })),
    [patchLayer],
  )

  const removeItem = useCallback(
    (kind: Kind, id: string) =>
      patchLayer((l) => ({
        ...l,
        [LIST[kind]]: (l[LIST[kind]] as Item[]).filter(
          (item) => item.id !== id,
        ),
      })),
    [patchLayer],
  )

  const patchFocus = useCallback(
    (focus: MapFocus) => patchLayer((l) => ({ ...l, focus })),
    [patchLayer],
  )

  /* -- adding ------------------------------------------------------------- */

  const placeLabel = useCallback(
    (at: MapPoint, text = 'New label', accent: MapAccentName = 'forest') => {
      pushHistory()
      const id = uniqueId(text, new Set(layer.labels.map((label) => label.id)))
      addItem('label', {
        id,
        text,
        accent,
        x: round1(at.x),
        y: round1(at.y),
        size: labelSizeFor(layer.focus),
      })
      focusNameField.current = true
      setSel({ kind: 'label', id })
      setStatus('Label placed')
    },
    [addItem, layer.focus, layer.labels, pushHistory],
  )

  const commitDrafting = useCallback(() => {
    const draft = drafting
    if (!draft) return
    const minimum = draft.kind === 'area' ? 3 : 2
    if (draft.points.length < minimum) {
      setDrafting(null)
      setStatus(`Needs at least ${minimum} points — cancelled`)
      return
    }
    pushHistory()
    const existing = itemsOf(layer, draft.kind)
    const count = existing.length + 1
    const id = uniqueId(
      `${draft.kind}-${count}`,
      new Set(existing.map((item) => item.id)),
    )
    addItem(draft.kind, {
      id,
      name: draft.kind === 'area' ? `Region ${count}` : `Path ${count}`,
      accent: draft.kind === 'area' ? 'forest' : 'rose',
      points: draft.points,
    })
    setSel({ kind: draft.kind, id })
    setDrafting(null)
    setTool('select')
    setStatus(draft.kind === 'area' ? 'Region added' : 'Path added')
  }, [drafting, layer, addItem, pushHistory])

  const deleteSelected = useCallback(() => {
    if (!sel || sel.kind === 'focus') return
    pushHistory()
    removeItem(sel.kind, sel.id)
    setSel(null)
    setStatus('Deleted')
  }, [sel, removeItem, pushHistory])

  const addLayer = () => {
    pushHistory()
    const id = uniqueId(
      `layer-${doc.layers.length + 1}`,
      new Set(doc.layers.map((l) => l.id)),
    )
    setDoc((cur) => ({
      ...cur,
      layers: [...cur.layers, emptyLayer(id, 'New layer')],
    }))
    setLayerId(id)
    setSel(null)
  }

  /* -- pointer ------------------------------------------------------------ */

  const beginDrag = (event: ReactPointerEvent, drag: Drag, next?: Sel) => {
    event.stopPropagation()
    event.preventDefault()
    if (next) setSel(next)
    if (drag.kind !== 'pan') pushHistory()
    dragRef.current = drag
    viewport.stageRef.current?.setPointerCapture(event.pointerId)
  }

  const grabItem = (event: ReactPointerEvent, kind: Kind, id: string) => {
    const item = findItem(layer, kind, id)
    if (!item) return
    beginDrag(
      event,
      {
        kind: 'move',
        on: kind,
        id,
        orig: clone(item),
        from: viewport.toPercent(event),
      },
      { kind, id },
    )
  }

  const onStagePointerDown = (event: ReactPointerEvent) => {
    pinch.onPointerDown(event)
    const at = viewport.toPercent(event)

    // Middle button always pans, whatever tool is up.
    if (event.button === 1 || tool === 'select') {
      if (tool === 'select') setSel(null)
      dragRef.current = {
        kind: 'pan',
        lastX: event.clientX,
        lastY: event.clientY,
      }
      viewport.stageRef.current?.setPointerCapture(event.pointerId)
      return
    }

    if (tool === 'area' || tool === 'path') {
      setDrafting((cur) =>
        cur && cur.kind === tool
          ? { ...cur, points: [...cur.points, at] }
          : { kind: tool, points: [at] },
      )
      return
    }

    if (tool === 'label') {
      // Suppress the compatibility mouse events, so the browser does not move
      // focus to the body and undo the label field's autofocus.
      event.preventDefault()
      placeLabel(at)
      setTool('select')
      return
    }

    if (tool === 'focus') {
      pushHistory()
      dragRef.current = { kind: 'focus-new', from: at }
      viewport.stageRef.current?.setPointerCapture(event.pointerId)
      setSel({ kind: 'focus' })
      return
    }

    if (tool === 'sticker') {
      pushHistory()
      const art = STICKER_ART.find((candidate) => candidate.src === stickerSrc)
      const id = uniqueId(
        art?.name ?? 'sticker',
        new Set(layer.stickers.map((sticker) => sticker.id)),
      )
      addItem('sticker', {
        id,
        name: art?.name ?? 'Sticker',
        src: stickerSrc,
        x: round1(at.x),
        y: round1(at.y),
        // Sized against the focus rect, so a sticker dropped on a tight event
        // map lands at a sane size instead of swallowing the lawn.
        width: round1(Math.max(0.6, layer.focus.w * 0.08)),
        angle: 0,
      })
      setSel({ kind: 'sticker', id })
      setTool('select')
    }
  }

  const onStagePointerMove = (event: ReactPointerEvent) => {
    if (pinch.onPointerMove(event)) return
    const drag = dragRef.current
    if (!drag) return
    const at = viewport.toPercent(event)

    switch (drag.kind) {
      case 'pan': {
        viewport.panBy(event.clientX - drag.lastX, event.clientY - drag.lastY)
        dragRef.current = {
          kind: 'pan',
          lastX: event.clientX,
          lastY: event.clientY,
        }
        return
      }
      case 'focus-new': {
        patchFocus({
          x: (drag.from.x + at.x) / 2,
          y: (drag.from.y + at.y) / 2,
          w: Math.max(2, Math.abs(at.x - drag.from.x)),
          h: Math.max(2, Math.abs(at.y - drag.from.y)),
        })
        return
      }
      case 'focus-move': {
        patchFocus({
          ...drag.orig,
          x: clamp(drag.orig.x + (at.x - drag.from.x), 0, 100),
          y: clamp(drag.orig.y + (at.y - drag.from.y), 0, 100),
        })
        return
      }
      case 'focus-resize': {
        // The opposite corner stays nailed down while this one follows.
        const o = drag.orig
        const fixedX = drag.corner.includes('w') ? o.x + o.w / 2 : o.x - o.w / 2
        const fixedY = drag.corner.startsWith('n')
          ? o.y + o.h / 2
          : o.y - o.h / 2
        patchFocus({
          x: (fixedX + at.x) / 2,
          y: (fixedY + at.y) / 2,
          w: Math.max(2, Math.abs(at.x - fixedX)),
          h: Math.max(2, Math.abs(at.y - fixedY)),
        })
        return
      }
      case 'move': {
        patchItem(
          drag.on,
          drag.id,
          translate(drag.orig, at.x - drag.from.x, at.y - drag.from.y),
        )
        return
      }
      case 'vertex': {
        const item = findItem(layer, drag.on, drag.id)
        if (!item || !hasPoints(item)) return
        const next = {
          x: clamp(drag.orig.x + (at.x - drag.from.x), 0, 100),
          y: clamp(drag.orig.y + (at.y - drag.from.y), 0, 100),
        }
        patchItem(drag.on, drag.id, {
          points: item.points.map((p, i) => (i === drag.index ? next : p)),
        })
        return
      }
      case 'scale': {
        // Scale by how much further the pointer is from the centre than it was
        // when the grab started. Labels carry a font size in map units,
        // stickers a width; the gesture is the same either way.
        const from = Math.hypot(drag.from.x - drag.at.x, drag.from.y - drag.at.y)
        const to = Math.hypot(at.x - drag.at.x, at.y - drag.at.y)
        if (from <= 0) return
        const next = drag.size * (to / from)
        patchItem(
          drag.on,
          drag.id,
          drag.on === 'label'
            ? { size: clamp(next, 0.04, 12) }
            : { width: clamp(next, 0.3, 40) },
        )
        return
      }
      case 'rotate': {
        const deg =
          (Math.atan2(at.y - drag.at.y, at.x - drag.at.x) * 180) / Math.PI
        // The knob rides above the sticker, so pointing straight up is 0°.
        patchItem('sticker', drag.id, { angle: Math.round(deg + 90) })
      }
    }
  }

  const onStagePointerUp = (event: ReactPointerEvent) => {
    pinch.onPointerUp(event)
    dragRef.current = null
  }

  /** Clicking a drawn line grows it: insert a vertex where the line passes. */
  const insertVertex = (event: ReactPointerEvent, kind: Kind, id: string) => {
    const item = findItem(layer, kind, id)
    if (!item || !hasPoints(item)) return
    const at = viewport.toPercent(event)
    const { index } = nearestSegment(item.points, at, kind === 'area')
    pushHistory()
    patchItem(kind, id, {
      points: [...item.points.slice(0, index), at, ...item.points.slice(index)],
    })
    beginDrag(
      event,
      { kind: 'vertex', on: kind, id, index, orig: at, from: at },
      { kind, id },
    )
  }

  const removeVertex = (kind: Kind, id: string, index: number) => {
    const item = findItem(layer, kind, id)
    if (!item || !hasPoints(item)) return
    if (item.points.length <= (kind === 'area' ? 3 : 2)) return
    pushHistory()
    patchItem(kind, id, { points: item.points.filter((_, i) => i !== index) })
  }

  /* -- keyboard ----------------------------------------------------------- */

  const save = useCallback(async () => {
    setStatus('Saving…')
    const result: SaveResult = await saveDoc(docRef.current)
    if (result.kind === 'file') {
      clearDraft()
      setHasDraft(false)
      setStatus(`Saved to ${result.path}`)
    } else if (result.kind === 'download') {
      setStatus(
        `No dev server here — ${result.filename} downloaded and copied. Drop it in src/data/ and commit.`,
      )
    } else {
      setStatus(`Could not save: ${result.message}`)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void save()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (typing) return

      if (event.key === 'Escape') {
        if (drafting) setDrafting(null)
        else setSel(null)
        setTool('select')
        return
      }
      if (event.key === 'Enter' && drafting) {
        event.preventDefault()
        commitDrafting()
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        deleteSelected()
        return
      }
      const shortcuts: Record<string, Tool> = {
        v: 'select',
        a: 'area',
        p: 'path',
        l: 'label',
        f: 'focus',
        s: 'sticker',
      }
      const next = shortcuts[event.key.toLowerCase()]
      if (next) {
        setTool(next)
        setDrafting(null)
        if (next === 'focus') setSel({ kind: 'focus' })
        return
      }

      const step = event.shiftKey ? 1 : 0.25
      const delta =
        event.key === 'ArrowLeft'
          ? { x: -step, y: 0 }
          : event.key === 'ArrowRight'
            ? { x: step, y: 0 }
            : event.key === 'ArrowUp'
              ? { x: 0, y: -step }
              : event.key === 'ArrowDown'
                ? { x: 0, y: step }
                : null
      if (!delta || !sel) return
      event.preventDefault()
      pushHistory()
      if (sel.kind === 'focus') {
        patchFocus({
          ...layer.focus,
          x: clamp(layer.focus.x + delta.x, 0, 100),
          y: clamp(layer.focus.y + delta.y, 0, 100),
        })
        return
      }
      const item = findItem(layer, sel.kind, sel.id)
      if (item) patchItem(sel.kind, sel.id, translate(item, delta.x, delta.y))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    sel,
    drafting,
    layer,
    commitDrafting,
    deleteSelected,
    patchFocus,
    patchItem,
    pushHistory,
    redo,
    save,
    undo,
  ])

  /* -- render ------------------------------------------------------------- */

  const selected =
    sel && sel.kind !== 'focus' ? findItem(layer, sel.kind, sel.id) : undefined
  const isSelected = (kind: Kind, id: string) =>
    !!sel && sel.kind === kind && sel.id === id
  const focus = layer.focus
  const editingFocus = tool === 'focus'
  const selectedShape =
    selected && hasPoints(selected) && sel && sel.kind !== 'focus'
      ? { item: selected, kind: sel.kind, id: sel.id }
      : null

  return (
    <>
      <SiteNav />
      <main className="mx-page">
        <div className="mx-bar">
          <div className="mx-bar-group">
            <label className="mx-field">
              <span>Event</span>
              <select
                value={layer.id}
                onChange={(event) => {
                  setLayerId(event.target.value)
                  setSel(null)
                  setDrafting(null)
                }}
              >
                {doc.layers.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="mx-ghost" onClick={addLayer}>
              + Layer
            </button>
          </div>

          <div className="mx-tools" role="group" aria-label="Tools">
            {(
              [
                ['select', 'Select', 'V'],
                ['area', 'Region', 'A'],
                ['path', 'Path', 'P'],
                ['label', 'Label', 'L'],
                ['sticker', 'Sticker', 'S'],
                ['focus', 'Focus', 'F'],
              ] as const
            ).map(([value, name, key]) => (
              <button
                key={value}
                type="button"
                className={tool === value ? 'is-on' : ''}
                aria-pressed={tool === value}
                onClick={() => {
                  setTool(value)
                  setDrafting(null)
                  if (value === 'focus') setSel({ kind: 'focus' })
                }}
              >
                {name} <kbd>{key}</kbd>
              </button>
            ))}
          </div>

          <div className="mx-bar-group">
            <button type="button" className="mx-ghost" onClick={undo}>
              Undo
            </button>
            <button type="button" className="mx-ghost" onClick={redo}>
              Redo
            </button>
            <button
              type="button"
              className="mx-save"
              onClick={() => void save()}
            >
              Save JSON
            </button>
            <a className="mx-ghost" href={`/map-view?event=${layer.id}`}>
              Map view →
            </a>
          </div>
        </div>

        <div className="mx-body">
          <div
            className={`mx-stage tool-${tool}`}
            ref={viewport.registerStage}
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerUp}
            onPointerCancel={onStagePointerUp}
            onDoubleClick={() => drafting && commitDrafting()}
          >
            <div
              className="mx-canvas"
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
                className="mx-art"
                src={doc.art.src}
                width={doc.art.width}
                height={doc.art.height}
                alt=""
                draggable={false}
              />

              {/* The focus rectangle paints under everything and never takes a
                  click; the Focus tool lays its own grab layer over the top. */}
              <div
                className={`mx-focus${editingFocus ? ' is-live' : ''}`}
                style={{
                  left: `${focus.x - focus.w / 2}%`,
                  top: `${focus.y - focus.h / 2}%`,
                  width: `${focus.w}%`,
                  height: `${focus.h}%`,
                }}
                aria-hidden="true"
              />

              {ghosts &&
                doc.layers
                  .filter((other) => other.id !== layer.id)
                  .map((other) => (
                    <svg
                      key={other.id}
                      className="mx-shapes is-ghost"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      {other.areas.map((area) => (
                        <path
                          key={area.id}
                          className={`mx-area accent-${area.accent}`}
                          d={ringPath(area.points)}
                        />
                      ))}
                      {other.paths.map((path) => (
                        <path
                          key={path.id}
                          className={`mx-path-line accent-${path.accent}`}
                          d={smoothPath(path.points)}
                        />
                      ))}
                    </svg>
                  ))}

              <svg
                className="mx-shapes"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {layer.areas.map((area) => (
                  <g key={area.id} className={`accent-${area.accent}`}>
                    <path
                      className={`mx-area${
                        isSelected('area', area.id) ? ' is-selected' : ''
                      }`}
                      d={ringPath(area.points)}
                      onPointerDown={(event) => grabItem(event, 'area', area.id)}
                    />
                    {isSelected('area', area.id) && (
                      <path
                        className="mx-edge-hit"
                        d={ringPath(area.points)}
                        onPointerDown={(event) =>
                          insertVertex(event, 'area', area.id)
                        }
                      />
                    )}
                  </g>
                ))}

                {layer.paths.map((path) => (
                  <g key={path.id} className={`accent-${path.accent}`}>
                    <path
                      className="mx-path-casing"
                      d={smoothPath(path.points)}
                    />
                    <path
                      className={`mx-path-line${
                        isSelected('path', path.id) ? ' is-selected' : ''
                      }`}
                      d={smoothPath(path.points)}
                    />
                    <path
                      className="mx-edge-hit"
                      d={smoothPath(path.points)}
                      onPointerDown={(event) => {
                        if (isSelected('path', path.id)) {
                          insertVertex(event, 'path', path.id)
                          return
                        }
                        grabItem(event, 'path', path.id)
                      }}
                    />
                  </g>
                ))}

                {drafting && (
                  <path
                    className="mx-drafting"
                    d={
                      drafting.kind === 'area'
                        ? ringPath(drafting.points)
                        : smoothPath(drafting.points)
                    }
                  />
                )}
              </svg>

              {layer.stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`carnival-map-item is-editable${
                    isSelected('sticker', sticker.id) ? ' is-selected' : ''
                  }`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${sticker.width}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.angle}deg)`,
                  }}
                  onPointerDown={(event) =>
                    grabItem(event, 'sticker', sticker.id)
                  }
                >
                  <img src={sticker.src} alt="" draggable={false} />
                  {isSelected('sticker', sticker.id) && (
                    <>
                      <span className="cmi-rotate-stick" aria-hidden="true" />
                      <span
                        className="cmi-rotate"
                        role="presentation"
                        onPointerDown={(event) =>
                          beginDrag(event, {
                            kind: 'rotate',
                            id: sticker.id,
                            at: { x: sticker.x, y: sticker.y },
                          })
                        }
                      />
                      <span
                        className="cmi-resize"
                        role="presentation"
                        onPointerDown={(event) =>
                          beginDrag(event, {
                            kind: 'scale',
                            on: 'sticker',
                            id: sticker.id,
                            at: { x: sticker.x, y: sticker.y },
                            size: sticker.width,
                            from: viewport.toPercent(event),
                          })
                        }
                      />
                    </>
                  )}
                </div>
              ))}

              {layer.labels.map((label) => (
                <span
                  key={label.id}
                  className={`mx-plate accent-${label.accent}${
                    isSelected('label', label.id) ? ' is-selected' : ''
                  }`}
                  style={
                    {
                      left: `${label.x}%`,
                      top: `${label.y}%`,
                      '--label-size': label.size ?? DEFAULT_LABEL_SIZE,
                    } as React.CSSProperties
                  }
                  onPointerDown={(event) => grabItem(event, 'label', label.id)}
                >
                  {label.text}
                  {isSelected('label', label.id) && (
                    <span
                      className="cmi-resize"
                      role="presentation"
                      onPointerDown={(event) =>
                        beginDrag(event, {
                          kind: 'scale',
                          on: 'label',
                          id: label.id,
                          at: { x: label.x, y: label.y },
                          size: label.size ?? DEFAULT_LABEL_SIZE,
                          from: viewport.toPercent(event),
                        })
                      }
                    />
                  )}
                </span>
              ))}

              {/* Vertices of the selected shape, and of the draft in progress. */}
              {selectedShape?.item.points.map((point, index) => (
                <span
                  key={index}
                  className="mx-handle mx-vertex"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  role="presentation"
                  onPointerDown={(event) =>
                    beginDrag(event, {
                      kind: 'vertex',
                      on: selectedShape.kind,
                      id: selectedShape.id,
                      index,
                      orig: { ...point },
                      from: viewport.toPercent(event),
                    })
                  }
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    removeVertex(selectedShape.kind, selectedShape.id, index)
                  }}
                />
              ))}
              {drafting?.points.map((point, index) => (
                <span
                  key={`draft-${index}`}
                  className="mx-handle mx-vertex is-draft"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                />
              ))}

              {/* The focus grab layer: only present while the Focus tool is up,
                  so at every other moment the rectangle is pure reference. */}
              {editingFocus && (
                <div
                  className="mx-focus-grab"
                  style={{
                    left: `${focus.x - focus.w / 2}%`,
                    top: `${focus.y - focus.h / 2}%`,
                    width: `${focus.w}%`,
                    height: `${focus.h}%`,
                  }}
                  onPointerDown={(event) =>
                    beginDrag(
                      event,
                      {
                        kind: 'focus-move',
                        orig: { ...focus },
                        from: viewport.toPercent(event),
                      },
                      { kind: 'focus' },
                    )
                  }
                >
                  <span className="mx-focus-tag">Focus · {layer.name}</span>
                  {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
                    <span
                      key={corner}
                      className={`mx-handle mx-corner is-${corner}`}
                      role="presentation"
                      onPointerDown={(event) =>
                        beginDrag(
                          event,
                          { kind: 'focus-resize', corner, orig: { ...focus } },
                          { kind: 'focus' },
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div
              className="mx-zoom"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button type="button" onClick={() => viewport.zoomStep(-1)}>
                −
              </button>
              <span>{viewport.zoomPct}%</span>
              <button type="button" onClick={() => viewport.zoomStep(1)}>
                +
              </button>
              <button type="button" onClick={viewport.reset}>
                Fit
              </button>
              <button type="button" onClick={() => viewport.frame(focus)}>
                Focus
              </button>
            </div>
          </div>

          <aside className="mx-panel">
            <Inspector
              layer={layer}
              sel={sel}
              selected={selected}
              nameFieldRef={nameFieldRef}
              stickerSrc={stickerSrc}
              tool={tool}
              onStickerSrc={setStickerSrc}
              onBefore={pushHistory}
              onLayer={patchLayer}
              onItem={patchItem}
              onFocus={patchFocus}
              onDelete={deleteSelected}
              onSelect={setSel}
              onFrame={viewport.frame}
              onLabelHere={placeLabel}
            />
          </aside>
        </div>

        <div className="mx-status">
          <p>
            {drafting
              ? `Drawing a ${drafting.kind === 'area' ? 'region' : 'path'} · ${drafting.points.length} point${
                  drafting.points.length === 1 ? '' : 's'
                } · click to add, Enter or double-click to finish, Esc to cancel`
              : tool === 'select'
                ? 'Drag empty map to pan · scroll to zoom · click anything to select · Backspace deletes · arrows nudge (shift = big)'
                : tool === 'focus'
                  ? 'Drag inside the rectangle to move it, a corner to resize, or anywhere else to draw a new one. Press V when done.'
                  : tool === 'label'
                    ? 'Click anywhere to drop a label, then type its words'
                    : tool === 'sticker'
                      ? 'Click the map to drop the chosen art'
                      : 'Click to place points'}
          </p>
          <div className="mx-status-right">
            <label className="mx-check">
              <input
                type="checkbox"
                checked={ghosts}
                onChange={(event) => setGhosts(event.target.checked)}
              />
              Ghost other layers
            </label>
            {hasDraft && <span className="mx-dot">unsaved draft</span>}
            <button
              type="button"
              className="mx-ghost"
              onClick={() => {
                if (
                  !window.confirm(
                    'Throw away every unsaved change and reload the committed venue-map.json?',
                  )
                ) {
                  return
                }
                pushHistory()
                clearDraft()
                setHasDraft(false)
                setDoc(savedDoc())
                setSel(null)
                setStatus('Reverted to the saved file')
              }}
            >
              Revert
            </button>
          </div>
        </div>
        {status && <p className="mx-toast">{status}</p>}
      </main>
    </>
  )
}

/* -- inspector ------------------------------------------------------------- */

function Inspector({
  layer,
  sel,
  selected,
  nameFieldRef,
  stickerSrc,
  tool,
  onStickerSrc,
  onBefore,
  onLayer,
  onItem,
  onFocus,
  onDelete,
  onSelect,
  onFrame,
  onLabelHere,
}: {
  layer: MapLayer
  sel: Sel | null
  selected?: Item
  nameFieldRef: React.RefObject<HTMLInputElement | null>
  stickerSrc: string
  tool: Tool
  onStickerSrc: (src: string) => void
  onBefore: () => void
  onLayer: (fn: (current: MapLayer) => MapLayer) => void
  onItem: (kind: Kind, id: string, patch: Partial<Item>) => void
  onFocus: (focus: MapFocus) => void
  onDelete: () => void
  onSelect: (sel: Sel | null) => void
  onFrame: (rect: MapFocus) => void
  onLabelHere: (at: MapPoint, text?: string, accent?: MapAccentName) => void
}) {
  const kind = sel && sel.kind !== 'focus' ? sel.kind : null
  const meta = KINDS.find((entry) => entry.kind === kind)
  const empty = !KINDS.some(({ kind: part }) => itemsOf(layer, part).length)

  return (
    <>
      <section className="mx-section">
        <h2>Layer</h2>
        <label className="mx-field">
          <span>Name</span>
          <input
            value={layer.name}
            onChange={(event) =>
              onLayer((cur) => ({ ...cur, name: event.target.value }))
            }
          />
        </label>
        <label className="mx-field">
          <span>Event anchor</span>
          <input
            value={layer.eventAnchor ?? ''}
            placeholder="none"
            onChange={(event) =>
              onLayer((cur) => ({
                ...cur,
                eventAnchor: event.target.value.trim() || null,
              }))
            }
          />
        </label>
        <p className="mx-note">
          Focus · {round1(layer.focus.w)} × {round1(layer.focus.h)} at{' '}
          {round1(layer.focus.x)}, {round1(layer.focus.y)}
        </p>
        <button
          type="button"
          className="mx-ghost mx-wide"
          onClick={() => {
            const points = layerPoints(layer)
            if (!points.length) return
            onBefore()
            onFocus(boundsOf(points, 3))
          }}
        >
          Fit focus to this layer
        </button>
      </section>

      <section className="mx-section">
        <h2>Contents</h2>
        {empty && <p className="mx-empty">Nothing placed yet.</p>}
        {KINDS.map(({ kind: part, many }) => {
          const items = itemsOf(layer, part)
          if (!items.length) return null
          return (
            <div key={part} className="mx-group">
              <h3>{many}</h3>
              <ul className="mx-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={
                        sel?.kind === part && sel.id === item.id ? 'is-on' : ''
                      }
                      onClick={() => onSelect({ kind: part, id: item.id })}
                      onDoubleClick={() => onFrame(boundsOf([anchorOf(item)], 8))}
                    >
                      {part === 'sticker' ? (
                        <img
                          className="mx-swatch"
                          src={(item as MapSticker).src}
                          alt=""
                        />
                      ) : (
                        <span
                          className={`mx-swatch accent-${
                            (item as MapArea).accent
                          }`}
                        />
                      )}
                      {'text' in item ? item.text : item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </section>

      {selected && kind && meta && (
        <section className="mx-section">
          <h2>{meta.one}</h2>
          <label className="mx-field">
            <span>{kind === 'label' ? 'Words on the map' : 'Name'}</span>
            <input
              ref={nameFieldRef}
              value={'text' in selected ? selected.text : selected.name}
              onChange={(event) =>
                onItem(
                  kind,
                  selected.id,
                  'text' in selected
                    ? { text: event.target.value }
                    : { name: event.target.value },
                )
              }
            />
          </label>

          {kind !== 'sticker' && (
            <label className="mx-field">
              <span>Accent</span>
              <select
                value={(selected as MapArea).accent}
                onChange={(event) => {
                  onBefore()
                  onItem(kind, selected.id, {
                    accent: event.target.value as MapAccentName,
                  })
                }}
              >
                {ACCENTS.map((accent) => (
                  <option key={accent} value={accent}>
                    {accent}
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === 'label' && (
            <label className="mx-field">
              <span>Size (map units)</span>
              <input
                type="number"
                step="0.05"
                value={(selected as MapLabel).size ?? DEFAULT_LABEL_SIZE}
                onChange={(event) =>
                  onItem(kind, selected.id, {
                    size: clamp(Number(event.target.value) || 0.04, 0.04, 12),
                  })
                }
              />
            </label>
          )}

          {kind === 'sticker' && (
            <>
              <label className="mx-field">
                <span>Passport activity</span>
                <input
                  value={(selected as MapSticker).activity ?? ''}
                  placeholder="none"
                  onChange={(event) =>
                    onItem(kind, selected.id, {
                      activity: event.target.value.trim() || undefined,
                    })
                  }
                />
              </label>
              <label className="mx-field">
                <span>Width %</span>
                <input
                  type="number"
                  step="0.1"
                  value={round1((selected as MapSticker).width)}
                  onChange={(event) =>
                    onItem(kind, selected.id, {
                      width: clamp(Number(event.target.value) || 0.3, 0.3, 40),
                    })
                  }
                />
              </label>
              <label className="mx-field">
                <span>Angle °</span>
                <input
                  type="number"
                  value={Math.round((selected as MapSticker).angle)}
                  onChange={(event) =>
                    onItem(kind, selected.id, {
                      angle: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
            </>
          )}

          <p className="mx-note">
            {hasPoints(selected)
              ? `${selected.points.length} points · id ${selected.id}`
              : `id ${selected.id}`}
          </p>

          {hasPoints(selected) && (
            <>
              <button
                type="button"
                className="mx-ghost mx-wide"
                onClick={() => {
                  onBefore()
                  onFocus(boundsOf(selected.points, 2))
                }}
              >
                Set focus to this
              </button>
              <button
                type="button"
                className="mx-ghost mx-wide"
                onClick={() =>
                  onLabelHere(
                    anchorOf(selected),
                    selected.name,
                    (selected as MapArea).accent,
                  )
                }
              >
                Place a label here
              </button>
            </>
          )}
          <button type="button" className="mx-danger mx-wide" onClick={onDelete}>
            Delete {meta.one.toLowerCase()}
          </button>
        </section>
      )}

      {tool === 'sticker' && (
        <section className="mx-section">
          <h2>Sticker art</h2>
          <div className="mx-art-grid">
            {STICKER_ART.map((art) => (
              <button
                key={art.src}
                type="button"
                className={art.src === stickerSrc ? 'is-on' : ''}
                title={art.name}
                onClick={() => onStickerSrc(art.src)}
              >
                <img src={art.src} alt={art.name} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
