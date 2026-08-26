import { Fragment, useEffect } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { EventPanel } from '@/components/EventPanel'
import { ScrollCue } from '@/components/ScrollCue'
import { events } from '@/data/events'
import { useForecast } from '@/lib/use-forecast'

/** The days we show weather for — the two outdoor events. */
const FORECAST_DATES = events
  .map((event) => event.forecastDate)
  .filter((date): date is string => Boolean(date))

/**
 * Schedule and wardrobe in one page, served on both /schedule and /wardrobe so
 * every link already handed out keeps working. Each event is deep-linkable via
 * its anchor.
 */
export function SchedulePage() {
  const forecast = useForecast(FORECAST_DATES)

  useEffect(() => {
    document.title = 'Schedule · Abha & Udit'
  }, [])

  // On a full-page load to /schedule#<anchor>, the browser tries to scroll before
  // React has mounted the panel, so the jump is lost. Re-run it once mounted, and
  // again after webfonts settle since the script titles change panel heights.
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
      <main className="sched-site">
        <header className="sched-intro">
          <h1>Schedule</h1>
          <div className="sched-ornament" aria-hidden="true" />
        </header>

        {events.map((event) => (
          <Fragment key={event.anchor}>
            {event.divider && (
              <div className="sched-divider" aria-hidden="true">
                <div className="sched-ornament" />
              </div>
            )}
            <EventPanel
              event={event}
              forecast={
                event.forecastDate ? forecast.get(event.forecastDate) : undefined
              }
            />
          </Fragment>
        ))}

        {forecast.size > 0 && (
          <p className="sched-wx-credit">Forecast for Carnation · Open-Meteo</p>
        )}
      </main>
      <ScrollCue />
    </>
  )
}
