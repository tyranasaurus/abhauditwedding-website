import { useEffect, useMemo, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { guests, normalizeName } from '@/data/seating'

/**
 * The whole seating plan as a list, at /reception/tables: every table and
 * everyone sitting at it. The reception page answers "where am I?" one guest
 * at a time; this answers "who is where?" all at once, which is the view for
 * setting out place cards and for checking the plan against the sheet.
 *
 * The search narrows rather than jumps: matching guests stay in their table,
 * with the table around them, because the answer to "where is Priya?" is the
 * people she is sitting with.
 */
export function TableListPage() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const previous = document.title
    document.title = 'Tables · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  // Grouped by table, each table's guests in alphabetical order — the order
  // the eye scans when it is looking for one name.
  const tables = useMemo(() => {
    const byTable = new Map<number, string[]>()
    for (const guest of guests) {
      const seated = byTable.get(guest.table)
      if (seated) seated.push(guest.name)
      else byTable.set(guest.table, [guest.name])
    }
    return [...byTable.entries()]
      .sort(([a], [b]) => a - b)
      .map(([table, names]) => ({
        table,
        names: [...names].sort((a, b) => a.localeCompare(b)),
      }))
  }, [])

  const needle = normalizeName(query)
  const results = useMemo(() => {
    if (!needle) return tables.map((t) => ({ ...t, hits: new Set<string>() }))
    // A bare number is a table, not a name: "7" should find table 7 rather
    // than every guest with a 7 in their name, of whom there are none.
    const asTable = /^\d+$/.test(needle) ? Number(needle) : null
    return tables
      .map((t) => ({
        ...t,
        hits: new Set(
          t.names.filter((name) => normalizeName(name).includes(needle)),
        ),
      }))
      .filter((t) => t.hits.size > 0 || t.table === asTable)
  }, [tables, needle])

  const found = results.reduce((sum, t) => sum + t.hits.size, 0)

  return (
    <>
      <SiteNav />
      <main className="tables-page">
        <header className="tables-head">
          <h1 className="tables-title">Tables</h1>
          <div className="seating-ornament" aria-hidden="true" />

          <div className="tables-search">
            <label className="tables-search-label" htmlFor="table-search">
              Search a name or a table number
            </label>
            <div className="tables-search-field">
              <input
                id="table-search"
                type="search"
                className="guest-search-input"
                placeholder="Search a name or a table number…"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <button
                  type="button"
                  className="guest-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          <p className="tables-count" role="status">
            {!needle
              ? `${tables.length} tables · ${guests.length} guests`
              : results.length === 0
                ? 'Nothing by that name or number'
                : found === 0
                  ? // A table was asked for by number, so say what is at it
                    // rather than "0 guests", which reads as a miss.
                    `Table ${results[0]!.table} · ${results[0]!.names.length} seated`
                  : `${found} ${found === 1 ? 'guest' : 'guests'} · ${
                      results.length
                    } ${results.length === 1 ? 'table' : 'tables'}`}
          </p>
        </header>

        <ol className="tables-list">
          {results.map(({ table, names, hits }) => (
            <li className="table-block" key={table}>
              <h2 className="table-block-number">
                Table {table}
                <span className="table-block-seats">
                  {names.length} {names.length === 1 ? 'seat' : 'seats'}
                </span>
              </h2>
              <ul className="table-block-guests">
                {names.map((name) => (
                  <li key={name} className={hits.has(name) ? 'is-hit' : ''}>
                    {name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
    </>
  )
}
