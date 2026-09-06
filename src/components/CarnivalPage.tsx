import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
import { LiveEventPage } from '@/components/LiveEventPage'

/**
 * The carnival's live page at /carnival, opened by the homepage's live pill
 * while the carnival is on: the event's full panel, then the stampable
 * activity passport.
 *
 * No map. A guest on the lawn can already see the lawn — the stalls are within
 * sight of each other — so the passport is the whole point of the page, and it
 * lists the activities in the order the walk meets them (read off where the
 * stickers sit in venue-map.json) rather than making anyone find themselves on
 * a drawing first. The passport titles itself again now that nothing above it
 * does.
 *
 * `/passport` still resolves here: it was the page's first name and links to
 * it are already out in the world.
 */
export function CarnivalPage() {
  const { stamps, toggle } = useCarnivalStamps()

  return (
    <LiveEventPage anchor="carnegie-to-carnation" map={false}>
      <CarnivalPassport stamps={stamps} onToggle={toggle} />
    </LiveEventPage>
  )
}
