import { useCallback, useState } from 'react'
import { venueMap } from '@/data/venue-map'

type PassportActivity = {
  id: string
  /** The same watercolor art the carnival map places. */
  art: string
  text: string
}

const ART_PATH = '/art/map/carnival'

const declaredActivities: PassportActivity[] = [
  {
    id: 'pani-puri',
    art: `${ART_PATH}/pani-puri.webp`,
    text: 'Stuff your face with Pani Puri',
  },
  {
    id: 'cmu-fence',
    art: `${ART_PATH}/cmu-fence.webp`,
    text: 'Sign and leave a message to Abha and Udit on the CMU Fence',
  },
  {
    id: 'picnic',
    art: `${ART_PATH}/picnic-carrom-jenga.webp`,
    text: 'Hang out on the picnic blankets and play some games',
  },
  {
    id: 'mehendi',
    art: `${ART_PATH}/henna.webp`,
    text: 'Get drawn into the fun at the Mehendi Station',
  },
  {
    id: 'bazaar',
    art: `${ART_PATH}/bazaar.webp`,
    text: 'Embellish your fit with accessories at the Bazaar',
  },
  {
    id: 'umbrella-booth',
    art: `${ART_PATH}/umbrella-arch.webp`,
    text: 'Make lasting memories at the primary photo booth',
  },
  {
    id: 'bike-booth',
    art: `${ART_PATH}/bicycle.webp`,
    text: 'Ride down memory lane at the Bike Photo Booth',
  },
  {
    id: 'nazar-studio',
    art: `${ART_PATH}/sunglasses.webp`,
    text: 'Get your SWAG on at Nazar Studio',
  },
  {
    id: 'block-print',
    art: `${ART_PATH}/block-print-tote.webp`,
    text: 'Block out a tote for all your goodies at the Block Print Station',
  },
  {
    id: 'jigsaw',
    art: `${ART_PATH}/jigsaw.webp`,
    text: "Help piece together Abha & Udit's favorite memories at the Jigsaw Puzzle",
  },
  {
    id: 'yarn',
    art: `${ART_PATH}/yarn-art.webp`,
    text: "Connect the threads of Abha & Udit's story at the Yarn Art Station",
  },
  {
    id: 'food',
    art: `${ART_PATH}/samosa.webp`,
    text: 'Devour food with your eyes, and then your mouth',
  },
  {
    id: 'sweets',
    art: `${ART_PATH}/candy-bag.webp`,
    text: 'Indulge your sweet tooth at the Candy Cart',
  },
  {
    id: 'airstream',
    art: `${ART_PATH}/lemonade.webp`,
    text: 'Cruise over for a drink at the airstream',
  },
]

/**
 * The activities in the order a guest meets them walking the lawn: a clockwise
 * circuit starting from the top-left of the map.
 *
 * Derived from where the stickers actually sit in `venue-map.json` rather than
 * from the order they happen to be declared in, so moving a stall in
 * `/map-editor` reorders the checklist to match instead of leaving the map and
 * the list quietly disagreeing. An activity with no sticker keeps its declared
 * place at the end.
 */
/** Bearings closer than this are the same stop on the walk, not two. */
const SAME_STOP_DEGREES = 3

function tourOrder(list: PassportActivity[]): PassportActivity[] {
  const layer = venueMap.layers.find(
    (candidate) => candidate.eventAnchor === 'carnegie-to-carnation',
  )
  if (!layer) return list
  const placedAt = new Map(
    layer.stickers
      .filter((sticker) => sticker.activity)
      .map((sticker) => [sticker.activity!, sticker]),
  )
  const placed = list.filter((activity) => placedAt.has(activity.id))
  const unplaced = list.filter((activity) => !placedAt.has(activity.id))
  if (placed.length < 3) return list

  const points = placed.map((activity) => placedAt.get(activity.id)!)
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length

  // Angle about the middle of the lawn, measured clockwise from the top-left
  // diagonal. y grows downward, so atan2 is already clockwise on screen; the
  // +135 turn just moves the zero to the corner the walk starts from.
  const bearing = (activity: PassportActivity) => {
    const at = placedAt.get(activity.id)!
    const degrees = (Math.atan2(at.y - cy, at.x - cx) * 180) / Math.PI
    return (degrees + 495) % 360
  }

  const reach = (activity: PassportActivity) => {
    const at = placedAt.get(activity.id)!
    return Math.hypot(at.x - cx, at.y - cy)
  }

  return [
    ...[...placed].sort((a, b) => {
      // Two stalls on essentially the same bearing are one stop on the walk,
      // and the angle between them is noise. Take the OUTER one first: that is
      // the one met first coming around the perimeter, with the inner one
      // sitting just off the path. Kept tight at 3° so it only catches real pairs
      // — the next closest pair on this lawn is 4.4° apart and keeps its
      // left-to-right order along the bottom.
      const turn = bearing(a) - bearing(b)
      if (Math.abs(turn) < SAME_STOP_DEGREES) return reach(b) - reach(a)
      return turn
    }),
    ...unplaced,
  ]
}

const activities = tourOrder(declaredActivities)

const STAMPS_KEY = 'carnival-passport.stamps'

/** localStorage can throw (private browsing), and old stamps for activities
 *  that no longer exist just get ignored on the next save. */
function loadStamps(): Set<string> {
  try {
    const raw = localStorage.getItem(STAMPS_KEY)
    if (!raw) return new Set()
    return new Set(
      (JSON.parse(raw) as string[]).filter((id) =>
        activities.some((a) => a.id === id),
      ),
    )
  } catch {
    return new Set()
  }
}

/** One stamp set shared by the passport and the carnival map, so checking an
 *  activity off in either place lights it up in both. */
export function useCarnivalStamps() {
  const [stamps, setStamps] = useState<Set<string>>(loadStamps)

  // Stable identity: the map's overlay is memoised against this, and a fresh
  // function each render would defeat that on every animation frame.
  const toggle = useCallback((id: string) => {
    setStamps((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(STAMPS_KEY, JSON.stringify([...next]))
      } catch {
        // Private browsing: the stamps just won't survive a reload.
      }
      return next
    })
  }, [])

  return { stamps, toggle }
}

/**
 * The Carnival activity passport: everything a guest can do on the lawn, as a
 * tappable checklist. Tapping a card stamps it; stamps live in localStorage,
 * so the passport keeps its ink across visits on the same phone.
 */
export function CarnivalPassport({
  stamps,
  onToggle,
  heading = true,
}: {
  stamps: Set<string>
  onToggle: (id: string) => void
  /** The passport's own title. Off where something above has already named
   *  it — the live page titles the map that opens it. */
  heading?: boolean
}) {
  return (
    <section
      className="carnival-passport"
      aria-label={heading ? undefined : 'Carnival Passport'}
      aria-labelledby={heading ? 'carnival-passport-title' : undefined}
    >
      <div className="carnival-map-heading">
        {heading && <h2 id="carnival-passport-title">Carnival Passport</h2>}
        <p className="passport-progress" role="status">
          {stamps.size === 0
            ? 'Tap an activity to stamp your passport.'
            : stamps.size === activities.length
              ? `All ${activities.length} stamped — dhamaal achieved!`
              : `${stamps.size} of ${activities.length} stamped`}
        </p>
      </div>
      <ul className="passport-grid">
        {activities.map((activity) => {
          const stamped = stamps.has(activity.id)
          return (
            <li key={activity.id}>
              <button
                type="button"
                className={`passport-card${stamped ? ' is-stamped' : ''}`}
                aria-pressed={stamped}
                onClick={() => onToggle(activity.id)}
              >
                <span className="passport-art" aria-hidden="true">
                  <img src={activity.art} alt="" loading="lazy" />
                </span>
                <span className="passport-text">{activity.text}</span>
                <span className="passport-stamp" aria-hidden="true">
                  ✓
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
