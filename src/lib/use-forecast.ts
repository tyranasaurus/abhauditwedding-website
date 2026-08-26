import { useEffect, useState } from 'react'

/** The hours an outdoor event actually runs, in local time. */
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
  glyph: string
  description: string
  /** Highest chance of precipitation across the window, 0–100. */
  rain: number
  /** Whether that chance is worth putting on the page. */
  showRain: boolean
}

/** Carnation Farms. */
const LAT = 47.6725
const LON = -121.9165

/**
 * Below this, rain is not worth mentioning and never picks the glyph. The daily
 * summary labels 5 September "drizzle" off three hours at a 4% chance, which is
 * a rain cloud on a wedding day for no reason.
 */
const RAIN_THRESHOLD = 25

// WMO weather codes. Sky conditions and precipitation are kept apart so a low
// chance of rain can be shown as the cloud cover it really is.
const OVERCAST: [number[], string, string] = [[3], '☁️', 'overcast']
const SKY: [number[], string, string][] = [
  [[0], '☀️', 'clear'],
  [[1], '🌤️', 'mainly clear'],
  [[2], '⛅', 'partly cloudy'],
  OVERCAST,
  [[45, 48], '🌫️', 'fog'],
]
const WET: [number[], string, string][] = [
  [[51, 53, 55, 80, 81, 82], '🌦️', 'showers'],
  [[56, 57, 61, 63, 65, 66, 67], '🌧️', 'rain'],
  [[71, 73, 75, 77, 85, 86], '❄️', 'snow'],
  [[95, 96, 99], '⛈️', 'thunderstorms'],
]

const lookup = (table: typeof SKY, code: number) =>
  table.find(([codes]) => codes.includes(code))

/** The condition that best describes a window, given how likely rain actually is. */
function summarise(codes: number[], rain: number): [string, string] {
  if (rain >= RAIN_THRESHOLD) {
    // Lead with the most serious wet condition present.
    for (const entry of [...WET].reverse()) {
      if (codes.some((code) => entry[0].includes(code))) return [entry[1], entry[2]]
    }
  }
  // Otherwise describe the sky. Wet codes still imply cloud, so anything we
  // can't place as a sky condition falls back to overcast rather than vanishing.
  const tally = new Map<string, number>()
  for (const code of codes) {
    const sky = lookup(SKY, code)
    const label = sky ? sky[2] : 'overcast'
    tally.set(label, (tally.get(label) ?? 0) + 1)
  }
  let best = OVERCAST
  let seen = -1
  for (const [label, count] of tally) {
    if (count <= seen) continue
    best = SKY.find(([, , name]) => name === label) ?? OVERCAST
    seen = count
  }
  return [best[1], best[2]]
}

interface HourlyBlock {
  time?: string[]
  weather_code?: (number | null)[]
  temperature_2m?: (number | null)[]
  precipitation_probability?: (number | null)[]
}

/**
 * Live forecast for the hours each outdoor event actually runs, fetched in the
 * browser on each load — there is no build step and nothing cached, so the
 * numbers sharpen on their own as the wedding approaches.
 *
 * Hourly rather than daily on purpose: the daily low happens around 4am, which
 * says nothing about an evening ceremony, and the daily condition code collapses
 * a few low-probability hours into a label that reads far worse than the odds.
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
      '&hourly=temperature_2m,weather_code,precipitation_probability' +
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
          const codes: number[] = []
          let rain = 0

          for (let hour = window.from; hour <= window.to; hour++) {
            const i = at.get(`${window.date}T${String(hour).padStart(2, '0')}:00`)
            if (i == null) continue
            const temp = hourly.temperature_2m?.[i]
            if (temp == null) continue
            temps.push(temp)
            const code = hourly.weather_code?.[i]
            if (code != null) codes.push(code)
            rain = Math.max(rain, hourly.precipitation_probability?.[i] ?? 0)
          }

          if (!temps.length) continue
          const [glyph, description] = summarise(codes, rain)
          next.set(window.key, {
            low: Math.round(Math.min(...temps)),
            high: Math.round(Math.max(...temps)),
            glyph,
            description,
            rain: Math.round(rain),
            showRain: rain >= RAIN_THRESHOLD,
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
