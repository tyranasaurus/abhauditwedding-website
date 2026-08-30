import { useState } from 'react'

type PassportActivity = {
  id: string
  /** The same watercolor art the carnival map places. */
  art: string
  text: string
}

const ART_PATH = '/art/map/carnival'

const activities: PassportActivity[] = [
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

  const toggle = (id: string) => {
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
  }

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
}: {
  stamps: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <section className="carnival-passport" aria-labelledby="carnival-passport-title">
      <div className="carnival-map-heading">
        <h2 id="carnival-passport-title">Carnival Passport</h2>
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
