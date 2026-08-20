import { SiteNav } from '@/components/SiteNav'

/**
 * Placeholder for the seating chart. Tables aren't assigned yet, so the page
 * exists only so the link can be shared ahead of time.
 */
export function SeatingChart() {
  return (
    <>
      <SiteNav />
      <main className="soon-page" aria-labelledby="seating-title">
        <p className="soon-kicker">Seating chart</p>
        <h1 id="seating-title" className="soon-title">
          Coming soon
        </h1>
        <div className="soon-ornament" aria-hidden="true" />
        <a className="soon-back" href="/#top">
          ← Back home
        </a>
      </main>
    </>
  )
}
