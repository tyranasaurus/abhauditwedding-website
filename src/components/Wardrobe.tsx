import { useEffect } from 'react'
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
      <main className="wardrobe-site">
        <Intro />
        <section className="event-gallery" aria-label="Wardrobe events">
          {events.map((event) => (
            <EventPanel event={event} key={event.title} />
          ))}
        </section>
      </main>
      <ScrollCue />
    </>
  )
}
