import type { CSSProperties } from 'react'
import type { WeddingEvent } from '@/data/events'
import type { WindowForecast } from '@/lib/use-forecast'
import { renderWords } from '@/lib/render-words'

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
    '--accent': event.accents[0],
    '--accent-2': event.accents[1],
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
              aria-label={`Forecast during the event: ${forecast.description}, low ${
                forecast.low
              }, high ${forecast.high} degrees Fahrenheit${
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
              {forecast.low}°<span className="sched-range-sep"> / </span>
              {forecast.high}°
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
          <figcaption className="sched-vibe">
            {renderWords(event.vibe, event.vibeAccents)}
          </figcaption>
        </figure>
      </div>

      <p className="sched-note">{event.note}</p>

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
