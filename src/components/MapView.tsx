import { useEffect, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { EventMap } from '@/components/EventMap'
import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
import { venueMap } from '@/data/venue-map'
import { grounds } from '@/data/map'

/**
 * The map browser at `/map-view`: pick an event, see its layer of the venue
 * map. The map surface itself is `EventMap`, the same component `/now` shows a
 * guest — this page is only the chooser and the notes around it.
 */

function layerFromLocation() {
  const wanted = new URLSearchParams(window.location.search).get('event')
  return (
    venueMap.layers.find((layer) => layer.id === wanted) ?? venueMap.layers[0]!
  )
}

export function MapView() {
  const [layer, setLayer] = useState(layerFromLocation)
  // The carnival's stickers check off passport activities, and the stamps are
  // shared with the passport itself, so a tap in either lights both.
  const carnivalStamps = useCarnivalStamps()
  const hasActivities = layer.stickers.some((sticker) => sticker.activity)

  useEffect(() => {
    const previous = document.title
    document.title = `${layer.name} · map · Abha & Udit`
    return () => {
      document.title = previous
    }
  }, [layer.name])

  const switchTo = (next: typeof layer) => {
    setLayer(next)
    const url = new URL(window.location.href)
    url.searchParams.set('event', next.id)
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <SiteNav />
      <main className="mv-page">
        <header className="mv-header">
          <div className="mv-events" role="group" aria-label="Which event">
            {venueMap.layers.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={candidate.id === layer.id ? 'is-on' : ''}
                aria-pressed={candidate.id === layer.id}
                onClick={() => switchTo(candidate)}
              >
                {candidate.name}
              </button>
            ))}
          </div>
          <a className="mv-edit" href={`/map-editor?event=${layer.id}`}>
            Edit map →
          </a>
        </header>

        <EventMap
          key={layer.id}
          layer={layer}
          stamps={carnivalStamps.stamps}
          onToggleActivity={carnivalStamps.toggle}
          label={`Map of ${layer.name}`}
        />

        <p className="mv-note">
          Painted from an aerial taken at a heading of {grounds.headingDeg}°, so
          the top of the map points southwest and the compass rose is turned{' '}
          {grounds.northRotationDeg}° to keep pointing true north. Drag to pan,
          pinch or scroll to zoom.
          {hasActivities ? ' Tap a stall to stamp your passport.' : ''}
        </p>

        {hasActivities ? (
          <CarnivalPassport
            stamps={carnivalStamps.stamps}
            onToggle={carnivalStamps.toggle}
          />
        ) : null}
      </main>
    </>
  )
}
