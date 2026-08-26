import type { CSSProperties } from 'react'
import type { WeddingEvent } from '@/data/events'
import type { DayForecast } from '@/lib/use-forecast'

export function EventPanel({
  event,
  forecast,
}: {
  event: WeddingEvent
  forecast?: DayForecast
}) {
  // --tp/--bp trim the transparent band baked into each webp; --art widens the
  // artwork column on the watch party. See the notes on WeddingEvent.
  const style = {
    '--tp': event.trimTop,
    '--bp': event.trimBottom,
    ...(event.artWidth ? { '--art': event.artWidth } : {}),
  } as CSSProperties

  return (
    <article
      className={`sched-event ${event.className}`}
      id={event.anchor}
      style={style}
    >
      <header className="sched-head">
        <h2>{event.title}</h2>
        <p className="sched-date">
          {event.date}
          {forecast && (
            <span
              className="sched-wx"
              aria-label={`Forecast: ${
                forecast.description ? `${forecast.description}, ` : ''
              }high ${forecast.high}, low ${forecast.low} Fahrenheit`}
            >
              {' · '}
              {forecast.glyph && (
                <>
                  <span className="sched-sky" aria-hidden="true">
                    {forecast.glyph}
                  </span>{' '}
                </>
              )}
              {forecast.high}°<span className="sched-lo"> / {forecast.low}°</span>
            </span>
          )}
        </p>
      </header>

      <div className={`sched-cols${event.timeline ? '' : ' is-solo'}`}>
        {event.timeline && (
          <ol className="sched-times">
            {event.timeline.map((entry) => (
              <li key={`${entry.time} ${entry.label}`}>
                <time>{entry.time}</time>
                <span className="sched-what">{entry.label}</span>
              </li>
            ))}
          </ol>
        )}

        <figure className="sched-art">
          <img
            src={event.image}
            alt={event.imageAlt}
            width={event.imageWidth}
            height={event.imageHeight}
            loading="lazy"
            decoding="async"
          />
          <figcaption className="sched-vibe">{event.vibe}</figcaption>
        </figure>
      </div>

      <div className="sched-note">
        {event.lead && <p className="sched-lead">{event.lead}</p>}
        <p className="sched-tip">{event.note}</p>
      </div>

      {event.venue && (
        <p className="sched-venue">
          <a
            className="btn btn-primary"
            href={event.venue.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {event.venue.label}
          </a>
        </p>
      )}
    </article>
  )
}
