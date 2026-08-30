import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { guests, seatingIntro, tables } from '@/data/seating'
import type { Guest } from '@/data/seating'

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

const ME_STORAGE_KEY = 'seating-chart.me'

/** localStorage can throw (private browsing) and the stored guest can go stale
 *  if the seating data changes, so only a name still on the list counts. */
function loadStoredMe(): Guest | null {
  try {
    const raw = localStorage.getItem(ME_STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<Guest>
    return (
      guests.find(
        (guest) => guest.name === stored.name && guest.table === stored.table,
      ) ?? null
    )
  } catch {
    return null
  }
}

/**
 * The interactive heart of the seating chart — the "Who are you?" finder and
 * the watercolor floor plan. Split from the page shell so the active-event
 * experience (/now) can host the same thing during the reception; the guest's
 * pick lives in localStorage, so it carries between the two hosts.
 */
export function SeatingExperience() {
  const [me, setMe] = useState<Guest | null>(loadStoredMe)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  // Hover is transient; a click/tap pins the table so touch users keep the
  // highlight while they look between the status line and the plan.
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the field when "Not you?" opens it — but not on first load, where
  // an unasked-for keyboard covering the map would greet every phone visitor.
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )

  const needle = normalize(query)
  const matches = useMemo(
    () =>
      needle
        ? sortedGuests.filter((guest) => normalize(guest.name).includes(needle))
        : [],
    [needle, sortedGuests],
  )
  const listOpen = searchFocused && needle.length > 0

  const selectMe = (guest: Guest) => {
    setMe(guest)
    setEditing(false)
    setQuery('')
    setCursor(0)
    setPinned(null)
    setHovered(null)
    try {
      localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(guest))
    } catch {
      // Private browsing: the choice just won't survive a reload.
    }
  }

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((current) => Math.min(current + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      const guest = matches[cursor]
      if (guest) selectMe(guest)
    } else if (event.key === 'Escape') {
      setQuery('')
      if (me) setEditing(false)
    }
  }

  // While typing, a search that narrows to a single table lights it up without
  // waiting for a pick — the live preview of "is that me?".
  const firstMatch = matches[0]
  const soleMatchTable =
    listOpen && firstMatch && matches.every((g) => g.table === firstMatch.table)
      ? firstMatch.table
      : null
  const active = hovered ?? pinned
  // Tables are numbered from zero, so never test a table number for truthiness.
  const lit = active ?? soleMatchTable
  const yourTable = me?.table ?? null

  // The card above the map names whichever table has attention: the lit one
  // while hovering/tapping/searching, otherwise yours.
  const cardTable = lit ?? yourTable
  const cardGuests =
    cardTable !== null
      ? sortedGuests.filter((guest) => guest.table === cardTable)
      : []

  const togglePin = (table: number) =>
    setPinned((current) => (current === table ? null : table))

  const clearSearch = () => {
    setQuery('')
    setCursor(0)
    inputRef.current?.focus()
  }

  const showChip = me !== null && !editing

  return (
    <>
      <div className="seating-finder">
        {showChip && me ? (
          <div className="me-chip">
            <p className="me-chip-text">
              <strong>{me.name}</strong> · Table {me.table}
            </p>
            <button
              type="button"
              className="me-chip-change"
              onClick={() => setEditing(true)}
            >
              Not you?
            </button>
          </div>
        ) : (
          <div className="guest-search">
            <label className="guest-search-label" htmlFor="guest-search">
              Who are you?
            </label>
            <div className="guest-search-field">
              <input
                id="guest-search"
                ref={inputRef}
                type="search"
                className="guest-search-input"
                placeholder="Start typing your name…"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={listOpen && matches.length > 0}
                aria-controls="guest-options"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setCursor(0)
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={onSearchKeyDown}
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
              {listOpen && matches.length > 0 ? (
                /* mousedown would blur the input and close the list before
                   click lands, so swallow it — the click then goes through. */
                <ul
                  className="guest-options"
                  id="guest-options"
                  role="listbox"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {matches.map((guest, index) => (
                    <li
                      key={`${guest.name}-${guest.table}`}
                      role="option"
                      aria-selected={index === cursor}
                    >
                      <button
                        type="button"
                        className={`guest-option${index === cursor ? ' is-cursor' : ''}`}
                        onMouseEnter={() => {
                          setCursor(index)
                          setHovered(guest.table)
                        }}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => selectMe(guest)}
                      >
                        <span className="guest-option-name">{guest.name}</span>
                        <span className="guest-table-tag">
                          Table {guest.table}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {listOpen && matches.length === 0 ? (
              <p className="guest-search-count" role="status">
                No match — try a first name, or ask us and we'll find you.
              </p>
            ) : null}
            {me && editing ? (
              <button
                type="button"
                className="guest-search-cancel"
                onClick={() => {
                  setEditing(false)
                  setQuery('')
                }}
              >
                Never mind — still {me.name}
              </button>
            ) : null}
          </div>
        )}
      </div>

      <section className="seating-map" aria-label="Reception floor plan">
        <div className="table-card" role="status">
          {cardTable !== null ? (
            <>
              <p className="table-card-title">
                Table {cardTable}
                {yourTable === cardTable ? (
                  <span className="table-card-yours"> · your table</span>
                ) : null}
              </p>
              <ul className="table-card-guests">
                {cardGuests.map((guest) => (
                  <li
                    key={`${guest.name}-${guest.table}`}
                    className={`table-card-guest${
                      me && guest.name === me.name && guest.table === me.table
                        ? ' is-you'
                        : ''
                    }`}
                  >
                    {guest.name}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="table-card-hint">
              Find your name above, or tap any table to see who’s seated
              there.
            </p>
          )}
        </div>
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
              className={`table-spot${lit === table.number ? ' is-active' : ''}${
                yourTable === table.number ? ' is-yours' : ''
              }`}
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
              aria-label={
                yourTable === table.number
                  ? `Table ${table.number} — your table`
                  : `Table ${table.number}`
              }
            >
              <span className="table-num" aria-hidden="true">
                {table.number}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

/**
 * The standalone /seating-chart page: the site nav and the page header around
 * the shared experience.
 */
export function SeatingChart() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Seating Chart · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

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
        <SeatingExperience />
      </main>
    </>
  )
}
