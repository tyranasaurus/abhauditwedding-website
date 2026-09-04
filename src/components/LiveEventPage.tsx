import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { EventMap, layerForEvent } from '@/components/EventMap'
import type { TableSelection } from '@/components/MapLayerOverlay'
import { EventPanel } from '@/components/EventPanel'
import { SiteNav } from '@/components/SiteNav'
import { events } from '@/data/events'
import { eventStartsAt } from '@/data/live-phases'
import { useForecast, type ForecastWindow } from '@/lib/use-forecast'

/**
 * The shared shell for an event's live page — the detailed version of its
 * homepage card. Same order every time, so a guest who has seen one knows
 * the next: the event's own panel first (title, date and live forecast,
 * schedule, wardrobe art and note), then the map focused on that event, then
 * whatever that event does live (the carnival's passport, the reception's
 * seating chart).
 *
 * The panel is the homepage's own `EventPanel`, so the words and times can
 * never drift between the two faces of the site, and it brings the event's
 * accent variables with it — which is what dresses each live page in its own
 * colors. The map is `EventMap` reading that event's layer of
 * venue-map.json, the same surface /map-view and /now show.
 */
/**
 * Whether this page is being opened before its event exists to be shown.
 *
 * Two escape hatches, so the page is never unreachable while it is being
 * built: `?preview` on its own, and `?live=` — the same override the homepage
 * takes — which also carries a chosen phase through.
 */
function useTooEarly(anchor: string): boolean {
  const startsAt = eventStartsAt(anchor)
  const params = new URLSearchParams(window.location.search)
  const previewing = params.has('preview') || params.has('live')
  const tooEarly = !previewing && startsAt !== null && Date.now() < startsAt

  useEffect(() => {
    if (!tooEarly) return
    // Carry a rehearsal across the redirect. Without this, bouncing off a
    // locked page ends the rehearsal on arrival at the homepage, which is
    // exactly where the rest of it plays out.
    const params = new URLSearchParams(window.location.search)
    const carried = new URLSearchParams()
    for (const key of ['rehearse', 'step', 'live', 'preview']) {
      const value = params.get(key)
      if (value !== null) carried.set(key, value)
    }
    const query = carried.toString()
    window.location.replace(`/${query ? `?${query}` : ''}#${anchor}`)
  }, [tooEarly, anchor])

  return tooEarly
}

export function LiveEventPage({
  anchor,
  mapLabel,
  mapHeading,
  stamps,
  onToggleActivity,
  tables,
  fit,
  upright = false,
  expandToInset = false,
  aboveMap,
  children,
}: {
  anchor: string
  /** Accessible name for the map, e.g. "The Carnival lawn". */
  mapLabel: string
  /** Visible heading over the map, when the map opens a named experience —
   *  the carnival's map is the first half of the passport. */
  mapHeading?: string
  /** Passport stamps, for the carnival's tappable stickers. */
  stamps?: Set<string>
  onToggleActivity?: (activity: string) => void
  /** The reception's seating state, marked on the map's table stickers. */
  tables?: TableSelection
  /** Passed to the map: how far out the guest may zoom. */
  fit?: 'cover' | 'contain' | 'focus'
  /** Passed to the map: keep its fullscreen view upright. */
  upright?: boolean
  /** Passed to the map: expand onto the layer's inset rather than its focus. */
  expandToInset?: boolean
  /** Rendered between the panel and the map — the seat finder sits here, so
   *  a guest reads their table number before looking for it below. */
  aboveMap?: ReactNode
  /** What this event does live, rendered under the map. */
  children?: ReactNode
}) {
  // Nothing to show yet: hand the guest to the schedule instead.
  const tooEarly = useTooEarly(anchor)
  const event = events.find((e) => e.anchor === anchor)!
  const layer = layerForEvent(anchor)

  // Outdoor events carry a forecast window; the reception is indoors and
  // simply has none, so this asks for nothing.
  const windows: ForecastWindow[] = event.forecastWindow
    ? [{ key: event.anchor, ...event.forecastWindow }]
    : []
  const forecast = useForecast(windows)

  useEffect(() => {
    const previous = document.title
    document.title = `${event.title} · Abha & Udit`
    return () => {
      document.title = previous
    }
  }, [event.title])

  // Every hook above has run, so the order is stable; only the output is
  // withheld. The redirect is already in flight — render nothing rather than
  // flashing a page the guest is about to be taken off.
  if (tooEarly) return null

  return (
    <>
      <SiteNav />
      {/* The event's accents on the page itself, not just on the panel, so
          headings outside the panel are in the event's colors too. */}
      <main
        className="live-page"
        style={
          {
            '--accent': event.accents.primary,
            '--accent-sec': event.accents.secondary,
            '--accent-mark': event.accents.marks ?? event.accents.secondary,
          } as CSSProperties
        }
      >
        {/* sched-stack supplies the layout variables the panel reads. The
            wardrobe art and the note stay home: both are lead-up guidance,
            and by the time a guest opens a live page they are already
            dressed and standing on the farm. */}
        <div className="sched-stack">
          <EventPanel
            event={event}
            forecast={forecast.get(event.anchor)}
            wardrobe={false}
            note={false}
          />
        </div>

        {aboveMap}

        {layer ? (
          <div className="now-map live-map">
            {mapHeading ? (
              <h2 className="live-map-heading">{mapHeading}</h2>
            ) : null}
            <EventMap
              layer={layer}
              stamps={stamps}
              onToggleActivity={onToggleActivity}
              tables={tables}
              fit={fit}
              upright={upright}
              expandToInset={expandToInset}
              label={mapLabel}
            />
          </div>
        ) : null}

        {children}
      </main>
    </>
  )
}
