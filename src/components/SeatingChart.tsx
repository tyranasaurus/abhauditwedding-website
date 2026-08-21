import { useEffect, useMemo, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { guests, seatingIntro, tables } from '@/data/seating'

/**
 * Interactive seating chart for the Sangeet Reception at the Hippodrome. Guests
 * find their name in the list; hovering (or tapping, which pins) lights up
 * their table on the watercolor floor plan. Hovering a table works in reverse
 * and highlights everyone seated there.
 */
export function SeatingChart() {
  // Hover is transient; a click/tap pins the table so touch users keep the
  // highlight while they scroll between the list and the plan.
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const active = hovered ?? pinned

  useEffect(() => {
    const previous = document.title
    document.title = 'Seating Chart · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )
  const activeGuests = active
    ? sortedGuests.filter((guest) => guest.table === active)
    : []

  const togglePin = (table: number) =>
    setPinned((current) => (current === table ? null : table))

  return (
    <>
      <SiteNav />
      <main className="seating-page">
        <header className="seating-header">
          <p className="seating-kicker">{seatingIntro.kicker}</p>
          <h1 className="seating-title">{seatingIntro.title}</h1>
          <div className="seating-ornament" aria-hidden="true" />
          <p className="seating-intro">{seatingIntro.blurb}</p>
        </header>

        <div className="seating-layout">
          <section className="seating-guests" aria-label="Guest list">
            <ul className="guest-list">
              {sortedGuests.map((guest) => (
                <li key={guest.name}>
                  <button
                    type="button"
                    className={`guest-name${active === guest.table ? ' is-lit' : ''}${
                      pinned === guest.table ? ' is-pinned' : ''
                    }`}
                    onMouseEnter={() => setHovered(guest.table)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(guest.table)}
                    onBlur={() => setHovered(null)}
                    onClick={() => togglePin(guest.table)}
                  >
                    <span className="guest-name-text">{guest.name}</span>
                    <span className="guest-table-tag" aria-label={`Table ${guest.table}`}>
                      {guest.table}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="seating-map" aria-label="Reception floor plan">
            <div className="seating-frame">
              <img
                src="/art/map/seating-floorplan.webp"
                alt="Watercolor floor plan of the Hippodrome reception hall: twenty round tables around a central dance floor, with the bar, buffet, and dessert stations along the top."
                className="seating-base"
                width={1536}
                height={2752}
                fetchPriority="high"
              />
              {tables.map((table) => (
                <button
                  key={table.number}
                  type="button"
                  className={`table-spot${active === table.number ? ' is-active' : ''}`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    width: `${table.r * 2}%`,
                  }}
                  onMouseEnter={() => setHovered(table.number)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(table.number)}
                  onBlur={() => setHovered(null)}
                  onClick={() => togglePin(table.number)}
                  aria-label={`Table ${table.number}`}
                >
                  <span className="table-num" aria-hidden="true">
                    {table.number}
                  </span>
                </button>
              ))}
            </div>
            <p className="seating-status" role="status">
              {active ? (
                <>
                  <strong>Table {active}</strong> ·{' '}
                  {activeGuests.map((guest) => guest.name).join(', ')}
                </>
              ) : (
                'Hover or tap a name to spot the table.'
              )}
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
