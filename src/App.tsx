import { useEffect } from 'react'
import { Intro } from '@/components/Intro'
import { EventPanel } from '@/components/EventPanel'
import { ScrollCue } from '@/components/ScrollCue'
import { MapPage } from '@/components/MapPage'
import { events } from '@/data/events'

export default function App() {
  // On a full-page load to /wardrobe#<anchor> (e.g. from the map), the browser
  // tries to scroll before React has mounted the panel, so the jump is lost.
  // Re-run it once the view is mounted, and again after webfonts settle since
  // the script titles change panel heights.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const jump = () => document.getElementById(decodeURIComponent(id))
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    requestAnimationFrame(jump)
    document.fonts?.ready.then(jump)
  }, [])

  // One static HTML file is served on both /wardrobe and /map (see vercel.json);
  // pick the view from the path. Full-page navigation handles transitions.
  if (window.location.pathname.replace(/\/+$/, '') === '/map') {
    return <MapPage />
  }

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
