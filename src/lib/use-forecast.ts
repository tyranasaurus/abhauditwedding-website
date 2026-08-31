import { useEffect, useState } from 'react'

/** The hours an event actually runs, in local time. */
export interface ForecastWindow {
  /** Identifies the result; we use the event's anchor. */
  key: string
  /** ISO date, e.g. '2026-09-05'. */
  date: string
  /** First and last hour of the event, 0–23. */
  from: number
  to: number
}

export interface WindowForecast {
  /** Coolest and warmest it gets during the event, in °F. */
  low: number
  high: number
}

/** Carnation Farms. */
const LAT = 47.6725
const LON = -121.9165

interface HourlyBlock {
  time?: string[]
  temperature_2m?: (number | null)[]
}

/**
 * Live forecast for the hours each outdoor event actually runs, fetched in the
 * browser on each load — there is no build step and nothing cached, so the
 * numbers sharpen on their own as the wedding approaches.
 *
 * Hourly rather than daily on purpose: the daily low happens around 4am, which
 * says nothing about an afternoon or evening event.
 *
 * Open-Meteo needs no key, allows browser requests and covers roughly 16 days
 * ahead; outside that window it returns no rows and the dates render bare. Any
 * failure resolves to an empty map for the same reason: a missing forecast
 * should leave no trace, not an error.
 */
export function useForecast(windows: ForecastWindow[]): Map<string, WindowForecast> {
  const [days, setDays] = useState<Map<string, WindowForecast>>(new Map())
  // The windows are static per page, so collapse them into a stable dependency
  // rather than re-running whenever the caller builds a new array.
  const key = windows.map((w) => `${w.key}:${w.date}:${w.from}-${w.to}`).join(',')

  useEffect(() => {
    if (!windows.length) return
    const dates = windows.map((w) => w.date).sort()
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${LAT}&longitude=${LON}` +
      '&hourly=temperature_2m' +
      '&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles' +
      `&start_date=${dates[0]}&end_date=${dates[dates.length - 1]}`

    const abort = new AbortController()
    fetch(url, { signal: abort.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { hourly?: HourlyBlock } | null) => {
        const hourly = body?.hourly
        if (!hourly?.time) return
        const at = new Map(hourly.time.map((stamp, i) => [stamp, i]))
        const next = new Map<string, WindowForecast>()

        for (const window of windows) {
          const temps: number[] = []

          for (let hour = window.from; hour <= window.to; hour++) {
            const i = at.get(`${window.date}T${String(hour).padStart(2, '0')}:00`)
            if (i == null) continue
            const temp = hourly.temperature_2m?.[i]
            if (temp == null) continue
            temps.push(temp)
          }

          if (!temps.length) continue
          next.set(window.key, {
            low: Math.round(Math.min(...temps)),
            high: Math.round(Math.max(...temps)),
          })
        }
        if (next.size) setDays(next)
      })
      .catch(() => {
        /* offline, blocked, or aborted — the dates stay bare */
      })
    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return days
}
