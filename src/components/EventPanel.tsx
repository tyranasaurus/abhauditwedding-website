import type { CSSProperties } from 'react'
import type { WeddingEvent } from '@/data/events'
import type { WindowForecast } from '@/lib/use-forecast'

export function EventPanel({
  event,
  forecast,
}: {
  event: WeddingEvent
  forecast?: WindowForecast
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
              aria-label={`Forecast during the event: ${forecast.description}, ${
                forecast.start
              } to ${forecast.end} degrees Fahrenheit${
                forecast.showRain ? `, ${forecast.rain} percent chance of rain` : ''
              }`}
            >
              {' · '}
              {forecast.glyph && (
                <>
                  <span className="sched-sky" aria-hidden="true">
                    {forecast.glyph}
                  </span>{' '}
                </>
              )}
              {forecast.start}° <span className="sched-arrow">→</span>{' '}
              {forecast.end}°
              {forecast.showRain && (
                <span className="sched-rain"> · {forecast.rain}% rain</span>
              )}
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
