import { useEffect, useMemo, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { guests, seatingIntro, tables } from '@/data/seating'

/** Fold accents and punctuation so "Renee" finds "Renée" and "Dsouza" finds
 *  "D'Souza" — guests type their own name from memory, not from the list. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

/**
 * Interactive seating chart for the Sangeet Reception at the Hippodrome. Guests
 * search for their name; hovering (or tapping, which pins) lights up their
 * table on the watercolor floor plan. Hovering a table works in reverse and
 * highlights everyone seated there.
 */
export function SeatingChart() {
  // Hover is transient; a click/tap pins the table so touch users keep the
  // highlight while they scroll between the list and the plan.
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
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

  const needle = normalize(query)
  const matches = useMemo(
    () =>
      needle
        ? sortedGuests.filter((guest) => normalize(guest.name).includes(needle))
        : sortedGuests,
    [needle, sortedGuests],
  )

  // When a search narrows to a single table, light it up without waiting for a
  // tap — that is the whole point of searching your own name.
  const firstMatch = matches[0]
  const soleMatchTable =
    needle && firstMatch && matches.every((g) => g.table === firstMatch.table)
      ? firstMatch.table
      : null
  const lit = active ?? soleMatchTable
  // Tables are numbered from zero, so never test a table number for truthiness.
  const hasLit = lit !== null

  const activeGuests = hasLit
    ? sortedGuests.filter((guest) => guest.table === lit)
    : []

  const togglePin = (table: number) =>
    setPinned((current) => (current === table ? null : table))

  const clearSearch = () => {
    setQuery('')
    setPinned(null)
    inputRef.current?.focus()
  }

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
            <div className="guest-search">
              <label className="guest-search-label" htmlFor="guest-search">
                Search for your name
              </label>
              <div className="guest-search-field">
                <input
                  id="guest-search"
                  ref={inputRef}
                  type="search"
                  className="guest-search-input"
                  placeholder="Start typing…"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPinned(null)
                  }}
                />
                {query ? (
                  <button
                    type="button"
                    className="guest-search-clear"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <p className="guest-search-count" role="status">
                {needle
                  ? matches.length === 0
                    ? "No match — try a first name, or ask us and we'll find you."
                    : `${matches.length} ${matches.length === 1 ? 'name' : 'names'}`
                  : `${sortedGuests.length} guests`}
              </p>
            </div>

            {matches.length > 0 ? (
              <ul className="guest-list">
                {matches.map((guest) => (
                  <li key={`${guest.name}-${guest.table}`}>
                    <button
                      type="button"
                      className={`guest-name${lit === guest.table ? ' is-lit' : ''}${
                        pinned === guest.table ? ' is-pinned' : ''
                      }`}
                      onMouseEnter={() => setHovered(guest.table)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(guest.table)}
                      onBlur={() => setHovered(null)}
                      onClick={() => togglePin(guest.table)}
                    >
                      <span className="guest-name-text">{guest.name}</span>
                      <span
                        className="guest-table-tag"
                        aria-label={`Table ${guest.table}`}
                      >
                        {guest.table}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
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
                  className={`table-spot${lit === table.number ? ' is-active' : ''}`}
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
              {hasLit ? (
                <>
                  <strong>Table {lit}</strong> ·{' '}
                  {activeGuests.map((guest) => guest.name).join(', ')}
                </>
              ) : (
                'Search or tap a name to spot the table.'
              )}
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
