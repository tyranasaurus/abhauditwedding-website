import { useEffect } from 'react'
import { EventMap } from '@/components/EventMap'
import { SiteNav } from '@/components/SiteNav'
import { venueMap } from '@/data/venue-map'
import { venue } from '@/data/map'

/**
 * The venue map at `/map`: the overall layer — every event's areas, paths and
 * stalls at once — on the same `EventMap` surface the live pages use, so it
 * pans, pinches and expands to fullscreen here too. The address underneath
 * opens Google Maps for directions.
 *
 * It used to be a section of the homepage. A map wants the whole screen and a
 * homepage section can only ever give it a slot, so it has a page now, and the
 * nav's Map link comes straight here.
 */
export function MapPage() {
  const layer = venueMap.layers.find((l) => l.eventAnchor === 'overall')

  useEffect(() => {
    const previous = document.title
    document.title = 'The Grounds · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <SiteNav />
      <main className="map-page">
        <header className="map-page-header">
          <h1 className="map-page-title">The Grounds</h1>
          <div className="map-page-ornament" aria-hidden="true" />
        </header>

        {/* Deliberately not inside any transformed wrapper: a transform would
            become the containing block for the map's fullscreen stage, pinning
            `fixed` to that box instead of the viewport — the expanded map would
            open at the size of its own inline frame. */}
        {layer ? (
          <div className="now-map home-map-frame">
            {/* focus, not cover: this layer's focus is nearly the whole
                painting, so the furthest-out zoom has to be the one where all
                of the focus fits — even though a rect that wide leaves blank
                margins on a phone's shape. Not `contain` either, which would
                fit the whole painting and show far more than the focus. */}
            <EventMap
              layer={layer}
              label="Map of the wedding grounds"
              fit="focus"
            />
          </div>
        ) : null}

        <div className="home-map-directions">
          <a
            className="map-venue"
            href={venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="map-venue-pin"
              src={venue.pin}
              alt=""
              width={134}
              height={192}
            />
            <span className="map-venue-text">
              <span className="map-venue-address">
                {venue.addressLines.map((line, i) => (
                  <span key={line}>
                    {line}
                    {i < venue.addressLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </span>
              <span className="map-venue-cue">Open in Google Maps →</span>
            </span>
          </a>
        </div>
      </main>
    </>
  )
}
