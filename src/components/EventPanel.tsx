import type { WardrobeEvent } from '@/data/events'
import { renderWords } from '@/lib/render-words'

export function EventPanel({ event }: { event: WardrobeEvent }) {
  return (
    <article className={`event-panel ${event.className}`}>
      <header className="event-heading">
        <h2>{renderWords(event.title)}</h2>
        <p className="event-label">{event.label}</p>
        <p className="event-datetime">{event.datetime}</p>
      </header>

      <div className="event-stage">
        <img
          src={event.image}
          alt={event.imageAlt}
          className="stage-cutout"
          width={event.imageWidth}
          height={event.imageHeight}
          loading="lazy"
          decoding="async"
        />
      </div>

      <p className="attire-vibe">
        {renderWords(event.vibe, event.vibeAccentIndexes)}
      </p>

      <div className="attire-grid">
        <div>
          <h3>Ethnic</h3>
          <p>{event.ethnic}</p>
        </div>
        <div>
          <h3>Western</h3>
          <p>{event.western}</p>
        </div>
      </div>

      <footer className="event-footer">
        <p className="event-notes">{event.note}</p>
      </footer>
    </article>
  )
}
