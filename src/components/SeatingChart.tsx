import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LiveEventPage } from '@/components/LiveEventPage'
import { guests, seatingIntro } from '@/data/seating'
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
export function SeatingExperience({
  pinned = null,
  onSelectionChange,
}: {
  /** A table tapped on the map, which the card below should describe. */
  pinned?: number | null
  /** Reports the guest's table and whichever one is being looked at, so the
   *  venue map below can mark them. */
  onSelectionChange?: (selection: { yours: number | null; lit: number | null }) => void
} = {}) {
  const [me, setMe] = useState<Guest | null>(loadStoredMe)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
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
  // Only a tap or a search lights a table — deliberately NOT hover.
  //
  // Hovering used to drive this too, which did two bad things. It swapped the
  // card's guest list as the pointer crossed the map, and since tables seat
  // six to ten the card changed height and the page jumped underneath the
  // cursor. Worse, hover took priority over the tap: any stale hover — every
  // touch device, where `mouseleave` never comes — left the card and the ring
  // stuck on the old table while taps silently updated state behind it, so
  // selecting another table appeared to do nothing.
  //
  // Tables are numbered from zero, so never test a table number for truthiness.
  const lit = pinned ?? soleMatchTable
  const yourTable = me?.table ?? null

  // The card above the map names whichever table has attention: the lit one
  // while hovering/tapping/searching, otherwise yours.
  const cardTable = lit ?? yourTable
  const cardGuests =
    cardTable !== null
      ? sortedGuests.filter((guest) => guest.table === cardTable)
      : []

  // Hand the selection up so the map can light the same table. An effect
  // rather than a call inside the setters: `lit` also changes as the guest
  // types, and the map should follow that too.
  useEffect(() => {
    onSelectionChange?.({ yours: yourTable, lit })
  }, [yourTable, lit, onSelectionChange])

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
                        // Moves the keyboard cursor only. It used to light
                        // the guest's table as well, which changed the card's
                        // height and shifted the list out from under the
                        // pointer mid-hover.
                        onMouseEnter={() => setCursor(index)}
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
          </div>
        )}
      </div>

      <section className="seating-map" aria-label="Reception floor plan">
        <div className="table-card" role="status">
          {cardTable !== null ? (
            <>
              {/* Just the number. Your own table is already marked on the
                  plan by its copper seal, so saying it again here only made
                  the title jump around as the selection changed. */}
              <p className="table-card-title">Table {cardTable}</p>
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
              Find your name above, or tap any table on the map to see who’s
              seated there.
            </p>
          )}
        </div>
      </section>
    </>
  )
}

/**
 * The standalone /seating-chart page: the site nav and the page header around
 * the shared experience.
 */
/**
 * The reception's live page at /seating-chart: the event's full panel and the
 * Hippodrome map, then the seating experience. `LiveEventPage` supplies the
 * panel, the map and the title, so this is the reception's own module plus
 * the heading that introduces it.
 */
export function ReceptionPage({
  toChart = false,
}: {
  /** Open scrolled to the seating chart. `/seating-chart` sets this; the
   *  page's own address, `/reception`, opens at the top like its siblings. */
  toChart?: boolean
}) {
  const section = useRef<HTMLElement>(null)

  // Reached as /seating-chart, open on the chart itself: a guest following
  // that link was sent to find their table, and the schedule and venue map
  // above it are context they can scroll back up to, not the thing they came
  // for. Reached as /reception, the page opens at the top like the others.
  //
  // Jumped, not smooth-scrolled: an animation from the top of the page would
  // race whatever the browser is doing with its own scroll restoration, and a
  // guest who reloads mid-look should land where they were, not watch the page
  // travel. Deferred a frame so it runs after the first paint has laid the
  // panel and map out at their real heights.
  useEffect(() => {
    if (!toChart || window.location.hash) return
    const frame = requestAnimationFrame(() => {
      section.current?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [toChart])

  // The finder's state, held here so the map below can mark the same table.
  const [selection, setSelection] = useState<{
    yours: number | null
    lit: number | null
  }>({ yours: null, lit: null })
  const [pickedOnMap, setPickedOnMap] = useState<number | null>(null)

  return (
    <LiveEventPage
      anchor="naach-the-night-away"
      mapLabel="The Hippodrome, with your table marked"
      // The hall is the whole subject here, so the map opens on it rather
      // than on the farm around it, and stays the way up the page is: this
      // focus is taller than it is wide, so it already fills a portrait
      // screen and a quarter turn would only make a guest tilt their head.
      fit="focus"
      upright
      expandToInset
      tables={{
        yours: selection.yours,
        lit: pickedOnMap ?? selection.lit,
        onSelect: (table) =>
          setPickedOnMap((current) => (current === table ? null : table)),
      }}
      aboveMap={
        <section
          className="seating-section"
          aria-labelledby="seating-title"
          ref={section}
        >
          <header className="seating-header">
            <h1 className="seating-title" id="seating-title">
              {seatingIntro.title}
            </h1>
            <div className="seating-ornament" aria-hidden="true" />
          </header>
            <SeatingExperience
            pinned={pickedOnMap}
            onSelectionChange={setSelection}
          />
        </section>
      }
    />
  )
}
