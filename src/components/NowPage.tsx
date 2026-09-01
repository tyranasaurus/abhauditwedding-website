import { useEffect, useState } from 'react'
import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
import { EventMap, layerForEvent } from '@/components/EventMap'
import { EventPanel } from '@/components/EventPanel'
import { SeatingExperience } from '@/components/SeatingChart'
import { SiteNav } from '@/components/SiteNav'
import {
  activeEvents,
  defaultActiveEvent,
  type ActiveEvent,
} from '@/data/active-events'
import { venue } from '@/data/map'

/** Prototype test states, not the eventual time-window system — see
 *  docs/superpowers/specs/2026-08-29-active-event-experience-design.md. */
type Phase = 'before' | 'during'

function stateFromLocation(): { active: ActiveEvent; phase: Phase } {
  const params = new URLSearchParams(window.location.search)
  const active =
    activeEvents.find((a) => a.event.anchor === params.get('event')) ?? defaultActiveEvent
  return { active, phase: params.get('phase') === 'during' ? 'during' : 'before' }
}


/**
 * The active-event experience, at /now. One shell — status header, the venue
 * aerial with only this event's locations highlighted, then the event's
 * module — with two phases: before the event it shows the schedule and
 * wardrobe guidance plus directions, during the event it swaps in the
 * event's live module (the seating chart, for the reception). Which event
 * and which phase are prototype test states, picked by the floating admin
 * control; real event windows come later.
 */
export function NowPage() {
  const [{ active, phase }, setState] = useState(stateFromLocation)
  const { event } = active
  const is_carnival = event.anchor === 'carnegie-to-carnation'
  // The carnival's During phase: the passport joins the map.
  const carnival_live = is_carnival && phase === 'during'
  // This event's layer of the venue map document, laid out at /map-editor.
  const layer = layerForEvent(event.anchor)
  // Shared by the map's stickers and the passport, so a tap in either lights
  // both.
  const carnivalStamps = useCarnivalStamps()

  useEffect(() => {
    const previous = document.title
    document.title = `${event.title} · Abha & Udit`
    return () => {
      document.title = previous
    }
  }, [event.title])

  // Keep the test state in the URL so a reload — or a pasted test link —
  // lands on the same view. replaceState, not pushState: the admin control
  // is not navigation.
  const switchTo = (next: { active?: ActiveEvent; phase?: Phase }) => {
    const merged = { active: next.active ?? active, phase: next.phase ?? phase }
    setState(merged)
    const url = new URL(window.location.href)
    url.searchParams.set('event', merged.active.event.anchor)
    url.searchParams.set('phase', merged.phase)
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <SiteNav />
      <main className="now-page">
        <header className="now-header">
          <p className="now-kicker">
            {event.subtitle} · {event.date}
          </p>
          <h1 className="now-title">{event.title}</h1>
          <div className="now-ornament" aria-hidden="true" />
          {active.intro[phase] ? (
            <p className="now-intro">{active.intro[phase]}</p>
          ) : null}
        </header>

        {/* The venue map, the same surface a guest gets at /map-view: this
            event's layer of venue-map.json, bounded by its focus rectangle,
            expandable to fullscreen. The carnival's stalls are its stickers,
            and tapping one stamps the passport below. */}
        {layer ? (
          <div className="now-map">
            <EventMap
              key={layer.id}
              layer={layer}
              stamps={carnivalStamps.stamps}
              onToggleActivity={carnivalStamps.toggle}
              label={`Where ${event.title} happens on the farm`}
            />
          </div>
        ) : null}

        {carnival_live ? (
          <CarnivalPassport
            stamps={carnivalStamps.stamps}
            onToggle={carnivalStamps.toggle}
          />
        ) : null}

        {phase === 'before' ? (
          <>
            <div className="now-directions">
              <a
                className="map-venue"
                href={venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="map-venue-pin"
                  src={venue.pin}
                  alt=""
                  width={134}
                  height={192}
                />
                <span className="map-venue-text">
                  <span className="map-venue-address">
                    {venue.addressLines.map((line, i) => (
                      <span key={line}>
                        {line}
                        {i < venue.addressLines.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </span>
                  <span className="map-venue-cue">Open in Google Maps →</span>
                </span>
              </a>
            </div>
            {/* The ordinary schedule-and-wardrobe panel, hosted whole: the
                sched-stack wrapper supplies the layout variables it reads. */}
            <div className="sched-stack">
              <EventPanel event={event} />
            </div>
          </>
        ) : active.duringModule === 'seating' ? (
          <SeatingExperience />
        ) : active.duringModule === 'schedule' ? (
          // Until this event's own live module exists (procession guidance),
          // During Event keeps the current schedule.
          <div className="sched-stack">
            <EventPanel event={event} />
          </div>
        ) : // 'passport': the carnival's module already rides with its map above.
        null}

        {/* This page is the primary face during the event, so the way back to
            the ordinary site is a quiet corner button. It lands on this
            event's own schedule card, not the top of the homepage. */}
        <a className="now-back" href={`/#${event.anchor}`}>
          ← Wedding info
        </a>

        {/* Floating admin-only preview control — a temporary stand-in for the
            time-window system, deliberately dressed as a tool rather than as
            part of the page. */}
        <div className="now-admin" role="group" aria-label="Admin preview control">
          <p className="now-admin-kicker">Preview</p>
          <div className="now-admin-row">
            {activeEvents.map((candidate) => (
              <button
                key={candidate.event.anchor}
                type="button"
                className={candidate === active ? 'is-on' : ''}
                aria-pressed={candidate === active}
                onClick={() => switchTo({ active: candidate })}
              >
                {candidate.shortName}
              </button>
            ))}
          </div>
          <div className="now-admin-row">
            {(
              [
                ['before', 'Before'],
                ['during', 'During'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={phase === value ? 'is-on' : ''}
                aria-pressed={phase === value}
                onClick={() => switchTo({ phase: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="now-admin-row">
            <a className="now-admin-link" href="/map-editor">
              Edit the venue map
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
