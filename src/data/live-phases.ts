import { isHidden } from '@/data/hidden-pages'

/**
 * The live-weekend schedule: while a phase's window is open, the homepage
 * auto-scrolls to that event's card and floats a pill into that event's live
 * page. Every farm event has two phases — `before`, while guests are still
 * arriving and getting their bearings, and `during`, once it is underway —
 * so the admin preview can show both behaviors for all three events.
 *
 * The windows are the editable heart of this file, and they run back to back
 * from Saturday breakfast to the end of Sunday night — every moment of the
 * weekend belongs to exactly one phase, so the site always knows what a guest
 * is standing in the middle of. Outside them the site is its ordinary self.
 *
 * All times are the venue's own clock (Carnation, WA — PDT in September):
 *
 *   Sat  8:00 am   before the Shaadi
 *   Sat  3:30 pm   the Shaadi
 *   Sat 10:00 pm   before the Carnival
 *   Sun 11:00 am   the Carnival
 *   Sun  3:00 pm   before the Reception
 *   Sun  4:30 pm   the Reception
 */
export interface LivePhase {
  id: string
  /** Which event this belongs to, as the admin preview labels it. */
  eventLabel: string
  /** Before the event starts, or while it is happening. */
  stage: 'before' | 'during'
  /** The homepage event section (anchor) this phase lands guests on. */
  anchor: string
  /** Window bounds, ISO with the venue's UTC offset. */
  start: string
  end: string
  /** The floating button into this event's live page. Only the `during`
   *  phases carry one: before an event starts there is nothing live to open. */
  pill?: { label: string; href: string }
}

const ceremonyMap = { label: 'See the Ceremony Map', href: '/shaadi' }
const seatingChart = { label: 'See the Seating Chart', href: '/seating-chart' }

export const livePhases: LivePhase[] = [
  {
    // From Saturday breakfast until the ceremony begins.
    id: 'shaadi-before',
    eventLabel: 'Shaadi',
    stage: 'before',
    anchor: 'sunset-shaadi',
    start: '2026-09-05T08:00:00-07:00',
    end: '2026-09-05T15:30:00-07:00',
  },
  {
    // The ceremony and the evening that follows it.
    id: 'shaadi-during',
    eventLabel: 'Shaadi',
    stage: 'during',
    anchor: 'sunset-shaadi',
    start: '2026-09-05T15:30:00-07:00',
    end: '2026-09-05T22:00:00-07:00',
    pill: ceremonyMap,
  },
  {
    // Opens on Saturday NIGHT — once the Shaadi is over, the next thing
    // ahead of a guest is the Baraat — and runs to the carnival's opening.
    id: 'carnival-before',
    eventLabel: 'Baraat & Carnival',
    stage: 'before',
    anchor: 'carnegie-to-carnation',
    start: '2026-09-05T22:00:00-07:00',
    end: '2026-09-06T11:00:00-07:00',
  },
  {
    // The carnival itself.
    id: 'carnival-during',
    eventLabel: 'Baraat & Carnival',
    stage: 'during',
    anchor: 'carnegie-to-carnation',
    start: '2026-09-06T11:00:00-07:00',
    end: '2026-09-06T15:00:00-07:00',
    pill: { label: 'Open your Carnival Passport', href: '/carnival' },
  },
  {
    // The gap between the carnival ending and the reception opening.
    id: 'reception-before',
    eventLabel: 'Sangeet',
    stage: 'before',
    anchor: 'naach-the-night-away',
    start: '2026-09-06T15:00:00-07:00',
    end: '2026-09-06T16:30:00-07:00',
  },
  {
    id: 'reception-during',
    eventLabel: 'Sangeet',
    stage: 'during',
    anchor: 'naach-the-night-away',
    start: '2026-09-06T16:30:00-07:00',
    end: '2026-09-06T23:59:00-07:00',
    pill: seatingChart,
  },
]

/* -- rehearsal ------------------------------------------------------------ *
 *
 * The weekend, compressed, so the transitions can be watched now instead of in
 * September. `?rehearse` on any page replays all six phases back to back —
 * fifteen seconds each by default — which is long enough to see the pill
 * animate in, the homepage glide to the next event's card, and each live page
 * unlock as its event opens.
 *
 *     ?rehearse              start five seconds from now
 *     ?rehearse=22:00        start at 22:00 today, on this device's clock
 *     ?rehearse=22:00&step=5 five seconds a phase instead of fifteen
 *
 * It is read once, when this module loads, so changing it means reloading. The
 * real windows below are never edited by it: everything downstream reads
 * `schedule`, which is either the real weekend or this stand-in for it.
 */
function rehearsal(): { at: number; step: number } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (!params.has('rehearse')) return null

  const step = Math.max(1, Number(params.get('step')) || 15) * 1000
  const value = (params.get('rehearse') ?? '').trim()
  const clock = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!clock) return { at: Date.now() + 5000, step }

  const [, hh = '0', mm = '0', ss = '0'] = clock
  const at = new Date()
  at.setHours(+hh, +mm, +ss, 0)
  return { at: at.getTime(), step }
}

const rehearsing = rehearsal()

/** The windows everything actually reads: the real weekend, or a rehearsal of
 *  it running in seconds instead of hours. */
function compress(run: { at: number; step: number }): LivePhase[] {
  return livePhases.map((phase, i) => ({
    ...phase,
    start: new Date(run.at + i * run.step).toISOString(),
    end: new Date(run.at + (i + 1) * run.step).toISOString(),
  }))
}

/**
 * A pill into a page that is currently switched off would be a door to
 * nowhere, so it is dropped and no floating button appears for that event.
 * The phase itself stays — the homepage still glides to its card while the
 * window is open. See src/data/hidden-pages.ts.
 */
function withoutHiddenPills(phases: LivePhase[]): LivePhase[] {
  return phases.map((phase) => {
    if (!phase.pill || !isHidden(phase.pill.href)) return phase
    const { pill: _hidden, ...rest } = phase
    return rest
  })
}

export const schedule: LivePhase[] = withoutHiddenPills(
  rehearsing ? compress(rehearsing) : livePhases,
)

/** True while a rehearsal is running, so the page can say so. */
export const isRehearsing = rehearsing !== null

/** The events, in order, each with whichever of its phases exist — the shape
 *  the admin preview grid is drawn from. */
export const livePhasesByEvent = schedule.reduce<
  { label: string; phases: LivePhase[] }[]
>((rows, phase) => {
  const row = rows.find((r) => r.label === phase.eventLabel)
  if (row) row.phases.push(phase)
  else rows.push({ label: phase.eventLabel, phases: [phase] })
  return rows
}, [])

export function currentLivePhase(nowMs: number): LivePhase | null {
  return (
    schedule.find(
      (p) => nowMs >= Date.parse(p.start) && nowMs < Date.parse(p.end),
    ) ?? null
  )
}

/**
 * When an event's live page becomes worth opening: the moment its `during`
 * window starts.
 *
 * Before that there is nothing live on it — no seating to find, no passport to
 * stamp — so the page hands the guest to that event's card on the homepage
 * instead. Afterwards it stays open for good: a seating chart is still worth
 * looking up once the dancing has started, and a stamped passport is a
 * souvenir.
 */
export function eventStartsAt(anchor: string): number | null {
  const during = schedule.find(
    (p) => p.anchor === anchor && p.stage === 'during',
  )
  return during ? Date.parse(during.start) : null
}
