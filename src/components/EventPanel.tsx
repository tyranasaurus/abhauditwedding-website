import type { CSSProperties } from 'react'
import type { WeddingEvent } from '@/data/events'
import type { WindowForecast } from '@/lib/use-forecast'
import { renderWords } from '@/lib/render-words'
import { SkyGlyph } from '@/components/SkyGlyph'

export function EventPanel({
  event,
  forecast,
}: {
  event: WeddingEvent
  forecast?: WindowForecast
}) {
  // --art widens the artwork column on the watch party.
  const style = {
    '--accent': event.accents.primary,
    '--accent-sec': event.accents.secondary,
    '--accent-mark': event.accents.marks ?? event.accents.secondary,
    ...(event.artWidth ? { '--art': event.artWidth } : {}),
    ...(event.captionDrop ? { '--cap-drop': event.captionDrop } : {}),
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
              aria-label={`Forecast during the event: ${forecast.sky}, low ${
                forecast.low
              }, high ${forecast.high} degrees Fahrenheit${
                forecast.showRain ? `, ${forecast.rain} percent chance of rain` : ''
              }`}
            >
              {' · '}
              <SkyGlyph kind={forecast.sky} />{' '}
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
            {event.timeline.map((entry) => {
              // "3:30 PM" sets as 3:30 with a small quiet p, so the hour is what
              // catches the eye rather than the meridiem.
              const parts = entry.time.match(/^(.*?)\s*([AP])M$/i)
              const clock = parts?.[1]
              const meridiem = parts?.[2]
              return (
                <li key={`${entry.time} ${entry.label}`}>
                  <time aria-label={entry.time}>
                    {clock && meridiem ? (
                      <>
                        {clock}
                        <span className="sched-meridiem" aria-hidden="true">
                          {meridiem.toLowerCase()}
                        </span>
                      </>
                    ) : (
                      entry.time
                    )}
                  </time>
                  <span className="sched-what">{entry.label}</span>
                </li>
              )
            })}
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
            {renderWords(event.vibe, event.vibeColors)}
          </figcaption>
        </figure>
      </div>

      <p className="sched-note">{event.note}</p>

      {event.venue && (
        <p className="sched-venue">
          <a
            className="sched-venue-link"
            href={event.venue.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sched-venue-name">{event.venue.name}</span>
            <span className="sched-venue-area">{event.venue.area}</span>
            <span className="sched-venue-cue">Get directions →</span>
          </a>
        </p>
      )}
    </article>
  )
}
