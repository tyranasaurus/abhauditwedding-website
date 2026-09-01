import { useEffect } from 'react'
import { EventMap, layerForEvent } from '@/components/EventMap'
import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
import { SiteNav } from '@/components/SiteNav'

/**
 * The carnival's interactive page at /passport, opened by the homepage's live
 * pill while the carnival is on: the lawn map and the stampable activity
 * passport, in the carnival's own pinks and purples (both sections bring their
 * own carnival-colored headings). One stamp set is shared by map and
 * checklist, so a tap in either lights both.
 *
 * The map is `EventMap` — the same surface /now and /map-view show — reading
 * the carnival's layer of venue-map.json, so there is one carnival map on the
 * site rather than one per page.
 */
export function PassportPage() {
  const { stamps, toggle } = useCarnivalStamps()
  const layer = layerForEvent('carnegie-to-carnation')

  useEffect(() => {
    const previous = document.title
    document.title = 'Carnival Passport · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <SiteNav />
      <main className="now-page passport-page">
        {layer ? (
          <div className="now-map">
            <EventMap
              layer={layer}
              stamps={stamps}
              onToggleActivity={toggle}
              label="The Carnival lawn"
            />
          </div>
        ) : null}
        <CarnivalPassport stamps={stamps} onToggle={toggle} />
      </main>
    </>
  )
}
