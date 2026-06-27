import { Fragment, useEffect } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { Intro } from '@/components/Intro'
import { EventPanel } from '@/components/EventPanel'
import { ScrollCue } from '@/components/ScrollCue'
import { events } from '@/data/events'

export function Wardrobe() {
  // On a full-page load to /wardrobe#<anchor> (e.g. from the map or homepage),
  // the browser tries to scroll before React has mounted the panel, so the jump
  // is lost. Re-run it once the view is mounted, and again after webfonts settle
  // since the script titles change panel heights.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const jump = () =>
      document
        .getElementById(decodeURIComponent(id))
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    requestAnimationFrame(jump)
    document.fonts?.ready.then(jump)
  }, [])

  return (
    <>
      <SiteNav />
      <main className="wardrobe-site">
        <Intro />
        <section className="event-gallery" aria-label="Wardrobe events">
          {events.map((event) => (
            <Fragment key={event.title}>
              {event.bonus && (
                <div className="bonus-break">
                  <div className="home-ornament" aria-hidden="true" />
                  <p className="bonus-break-eyebrow">{event.bonus.eyebrow}</p>
                  <p className="bonus-break-lead">{event.bonus.lead}</p>
                </div>
              )}
              <EventPanel event={event} />
            </Fragment>
          ))}
        </section>
      </main>
      <ScrollCue />
    </>
  )
}
