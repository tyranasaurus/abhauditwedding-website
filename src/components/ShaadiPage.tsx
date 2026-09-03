import { LiveEventPage } from '@/components/LiveEventPage'

/**
 * The ceremony's live page at /shaadi, opened by the homepage's live pill
 * while the Sunset Shaadi is on: the event's full panel, then the map
 * focused on the meadow and the dinner lawn. The shaadi has no live module
 * of its own yet — the map is the point.
 */
export function ShaadiPage() {
  return (
    <LiveEventPage
      anchor="sunset-shaadi"
      mapLabel="The ceremony meadow and dinner lawn"
    />
  )
}
