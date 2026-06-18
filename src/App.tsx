import { Intro } from '@/components/Intro'
import { EventPanel } from '@/components/EventPanel'
import { events } from '@/data/events'

export default function App() {
  return (
    <main className="wardrobe-site">
      <Intro />
      <section className="event-gallery" aria-label="Wardrobe events">
        {events.map((event) => (
          <EventPanel event={event} key={event.title} />
        ))}
      </section>
    </main>
  )
}
