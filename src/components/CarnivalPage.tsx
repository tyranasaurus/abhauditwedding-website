import { CarnivalPassport, useCarnivalStamps } from '@/components/CarnivalPassport'
import { LiveEventPage } from '@/components/LiveEventPage'

/**
 * The carnival's live page at /carnival, opened by the homepage's live pill
 * while the carnival is on: the event's full panel, the lawn map, then the
 * stampable activity passport. One stamp set is shared by map and checklist,
 * so a tap in either lights both.
 *
 * `/passport` still resolves here: it was the page's first name and links to
 * it are already out in the world.
 */
export function CarnivalPage() {
  const { stamps, toggle } = useCarnivalStamps()

  return (
    <LiveEventPage
      anchor="carnegie-to-carnation"
      mapLabel="The Carnival lawn"
      mapHeading="Carnival Passport"
      stamps={stamps}
      onToggleActivity={toggle}
    >
      {/* The map is the first half of the passport — the heading above it
          says so — so the checklist below does not title itself again. */}
      <CarnivalPassport stamps={stamps} onToggle={toggle} heading={false} />
    </LiveEventPage>
  )
}
