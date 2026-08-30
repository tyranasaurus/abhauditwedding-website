import { useEffect, useState } from 'react'
import { CarnivalMap } from '@/components/CarnivalMap'
import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
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
    activeEvents.find((a) => a.event.anchor === params.get('event')) ??
    defaultActiveEvent
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
  // Temporary: drag-to-lay-out mode for the carnival map, toggled from the
  // admin chip and shareable as ?edit=1.
  const [editingMap, setEditingMap] = useState(
    () => new URLSearchParams(window.location.search).get('edit') === '1',
  )
  const { event } = active
  const is_carnival = event.anchor === 'carnegie-to-carnation'
  // Shared by the carnival map and passport, so a tap in either lights both.
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

        {is_carnival ? (
          <>
            <CarnivalMap
              editing={editingMap}
              stamps={carnivalStamps.stamps}
              onToggleActivity={carnivalStamps.toggle}
            />
            {/* The activity passport rides with the map in both phases: it is
                the carnival's live module, and before the event it doubles as
                the menu of what's coming. */}
            <CarnivalPassport
              stamps={carnivalStamps.stamps}
              onToggle={carnivalStamps.toggle}
            />
          </>
        ) : (
          <div className="now-map" aria-label="Where this event happens on the farm">
            <div className="map-frame">
              <img
                src="/art/map/aerial.webp"
                alt="Hand-painted aerial watercolor map of the wedding grounds, with this event's locations highlighted."
                className="map-base"
                width={1180}
                height={1180}
                fetchPriority="high"
              />
              <span className="map-vignette" aria-hidden="true" />
              {/* Each location is highlighted rather than pinned: a thin
                  translucent box laid over its painted footprint, traced off
                  the artwork in active-events.ts. */}
              {active.highlights.map((box) => (
                <span
                  key={`${box.x},${box.y}`}
                  className="now-highlight"
                  aria-hidden="true"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                    transform: `translate(-50%, -50%) rotate(${box.angle}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

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
          {is_carnival && (
            <div className="now-admin-row">
              <button
                type="button"
                className={editingMap ? 'is-on' : ''}
                aria-pressed={editingMap}
                onClick={() => {
                  const next = !editingMap
                  setEditingMap(next)
                  const url = new URL(window.location.href)
                  if (next) url.searchParams.set('edit', '1')
                  else url.searchParams.delete('edit')
                  window.history.replaceState(null, '', url)
                }}
              >
                {editingMap ? 'Done editing' : 'Edit map'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
