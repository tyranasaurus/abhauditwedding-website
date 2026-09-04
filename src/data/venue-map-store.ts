import { venueMap, type VenueMapDoc } from '@/data/venue-map'

/**
 * Where the map document lives while it is being edited, and how it gets back
 * to disk.
 *
 * Three tiers, most trusted first:
 *  1. `venue-map.json` in the repo — what the live site ships and what guests
 *     see. The only version that survives a deploy.
 *  2. A draft in this browser's localStorage — written on every edit so a
 *     reload, a closed laptop, or a stray refresh never costs work.
 *  3. The in-memory document the editor is manipulating right now.
 *
 * Saving pushes tier 3 to tier 1. In `npm run dev` that is a real write to the
 * file, through the dev-only endpoint in vite.config.ts; anywhere else (a
 * Vercel preview, a phone at the venue) there is no server to write with, so
 * the same button hands back the JSON to commit.
 */

const DRAFT_KEY = 'venue-map.draft'
const SAVE_ENDPOINT = '/__venue-map'

/** A detached copy, so history snapshots and drag origins never alias live
 *  state. Generic: the editor clones whole documents and single items alike. */
export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** The committed document, straight from the JSON file. */
export const savedDoc = () => clone(venueMap)

/** The draft if there is a usable one, else the committed document. */
export function loadDraft(): { doc: VenueMapDoc; fromDraft: boolean } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return { doc: savedDoc(), fromDraft: false }
    const parsed = JSON.parse(raw) as VenueMapDoc
    // A draft from an older shape is worse than no draft at all.
    if (parsed?.version !== venueMap.version || !Array.isArray(parsed.layers)) {
      return { doc: savedDoc(), fromDraft: false }
    }
    return { doc: adoptFileOnlyFields(parsed), fromDraft: true }
  } catch {
    return { doc: savedDoc(), fromDraft: false }
  }
}

/**
 * Fields the editor cannot author stay the file's to give. A layer's `inset`
 * — the cut-away drawing pinned over part of the painting — is added by hand
 * in `venue-map.json`, so a draft written before it existed would otherwise
 * hide it until the draft was thrown away, taking the layout with it. The
 * draft still owns everything it can actually edit.
 */
function adoptFileOnlyFields(draft: VenueMapDoc): VenueMapDoc {
  const doc = clone(draft)
  for (const layer of doc.layers) {
    if (layer.inset) continue
    const committed = venueMap.layers.find((l) => l.id === layer.id)
    if (committed?.inset) layer.inset = clone(committed.inset)
  }
  return doc
}

export function writeDraft(doc: VenueMapDoc) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(doc))
  } catch {
    // Private browsing, or the quota is full: edits just won't survive a
    // reload. Saving to the file still works.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing stored anyway.
  }
}

export const serialize = (doc: VenueMapDoc) => `${JSON.stringify(doc, null, 2)}\n`

export type SaveResult =
  | { kind: 'file'; path: string }
  | { kind: 'download'; filename: string }
  | { kind: 'failed'; message: string }

/**
 * Save the document. Writes `src/data/venue-map.json` outright when the dev
 * server is listening; otherwise downloads the file and copies it to the
 * clipboard so it can be committed by hand.
 */
export async function saveDoc(doc: VenueMapDoc): Promise<SaveResult> {
  const body = serialize(doc)
  try {
    const response = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (response.ok) {
      const info = (await response.json()) as { path?: string }
      return { kind: 'file', path: info.path ?? 'src/data/venue-map.json' }
    }
  } catch {
    // No dev server behind this origin — fall through to the download.
  }

  try {
    await navigator.clipboard.writeText(body)
  } catch {
    // Clipboard is best-effort; the download below is the real handoff.
  }

  try {
    const url = URL.createObjectURL(
      new Blob([body], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'venue-map.json'
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return { kind: 'download', filename: 'venue-map.json' }
  } catch (error) {
    return {
      kind: 'failed',
      message: error instanceof Error ? error.message : 'could not save',
    }
  }
}
