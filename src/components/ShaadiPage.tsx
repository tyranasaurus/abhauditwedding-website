import { LiveEventPage } from '@/components/LiveEventPage'

/**
 * The ceremony's live page at /shaadi, opened by the homepage's live pill
 * while the Sunset Shaadi is on: the event's full panel, then the map of the
 * hall the ceremony is set in. The shaadi has no live module of its own yet —
 * the map is the point.
 */
export function ShaadiPage() {
  return (
    <LiveEventPage
      anchor="sunset-shaadi"
      mapLabel="The Hippodrome, set for the ceremony"
      // The hall is the whole subject here, exactly as it is for the
      // reception, and the two share a focus rect — so they share its
      // handling: open on the room rather than the farm around it, and stay
      // the way up the page is, since a focus taller than it is wide already
      // fills a portrait screen and a quarter turn would only make a guest
      // tilt their head.
      fit="focus"
      upright
      expandToInset
    />
  )
}
