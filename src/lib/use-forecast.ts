import { useEffect, useState } from 'react'

export interface DayForecast {
  high: number
  low: number
  /** Emoji for the sky, or '' when the code is one we don't map. */
  glyph: string
  /** The same condition in words, for screen readers. */
  description: string
}

/** Carnation Farms. */
const LAT = 47.6725
const LON = -121.9165

// WMO weather codes, grouped into the conditions worth distinguishing here.
const SKY: [number[], string, string][] = [
  [[0], '☀️', 'clear'],
  [[1], '🌤️', 'mainly clear'],
  [[2], '⛅', 'partly cloudy'],
  [[3], '☁️', 'overcast'],
  [[45, 48], '🌫️', 'fog'],
  [[51, 53, 55, 80, 81, 82], '🌦️', 'showers'],
  [[56, 57, 61, 63, 65, 66, 67], '🌧️', 'rain'],
  [[71, 73, 75, 77, 85, 86], '❄️', 'snow'],
  [[95, 96, 99], '⛈️', 'thunderstorms'],
]

interface DailyBlock {
  time?: string[]
  weather_code?: (number | null)[]
  temperature_2m_max?: (number | null)[]
  temperature_2m_min?: (number | null)[]
}

/**
 * Live forecast for the given ISO dates, fetched in the browser on each load —
 * there is no build step and nothing cached, so the numbers sharpen on their own
 * as the wedding approaches. Open-Meteo needs no key, allows browser requests and
 * covers roughly 16 days ahead; outside that window it returns no rows and the
 * dates simply render bare. Any failure resolves to an empty map for the same
 * reason: a missing forecast should leave no trace, not an error.
 */
export function useForecast(dates: string[]): Map<string, DayForecast> {
  const [days, setDays] = useState<Map<string, DayForecast>>(new Map())
  // The set of dates is static per page, so join it into a stable dependency
  // rather than re-running whenever the caller builds a new array.
  const key = dates.join(',')

  useEffect(() => {
    const wanted = key ? key.split(',') : []
    if (!wanted.length) return
    const sorted = [...wanted].sort()
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${LAT}&longitude=${LON}` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles' +
      `&start_date=${sorted[0]}&end_date=${sorted[sorted.length - 1]}`

    const abort = new AbortController()
    fetch(url, { signal: abort.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { daily?: DailyBlock } | null) => {
        const daily = body?.daily
        if (!daily?.time) return
        const next = new Map<string, DayForecast>()
        for (const date of wanted) {
          const i = daily.time.indexOf(date)
          if (i < 0) continue
          const high = daily.temperature_2m_max?.[i]
          const low = daily.temperature_2m_min?.[i]
          if (high == null || low == null) continue
          const code = daily.weather_code?.[i]
          const sky = SKY.find(([codes]) => code != null && codes.includes(code))
          next.set(date, {
            high: Math.round(high),
            low: Math.round(low),
            glyph: sky ? sky[1] : '',
            description: sky ? sky[2] : '',
          })
        }
        if (next.size) setDays(next)
      })
      .catch(() => {
        /* offline, blocked, or aborted — the dates stay bare */
      })
    return () => abort.abort()
  }, [key])

  return days
}
