import { SiteNav } from '@/components/SiteNav'

/**
 * Placeholder for the seating chart. Tables aren't assigned yet, so the page
 * exists only so the link can be shared ahead of time.
 */
export function SeatingChart() {
  return (
    <>
      <SiteNav />
      {/* Same painted plate as the homepage, so the link doesn't drop guests
          onto a bare page. */}
      <div className="page-plate" aria-hidden="true" />
      <main className="soon-page page-column" aria-labelledby="seating-title">
        <p className="soon-kicker">Seating chart</p>
        <h1 id="seating-title" className="soon-title">
          Coming soon
        </h1>
        <div className="soon-ornament" aria-hidden="true" />
        <a className="btn btn-back" href="/#top">
          ← Back home
        </a>
      </main>
    </>
  )
}
