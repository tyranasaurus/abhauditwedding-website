import { SeatingChart } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'

export default function App() {
  // One static HTML file is served on / and /seating-chart (see vercel.json);
  // pick the view from the path. Full-page navigation handles
  // transitions. The schedule and wardrobe pages have folded into the homepage,
  // so /schedule and /wardrobe redirect to the matching anchor before this runs
  // — see the inline script in index.html. (The /map page is built but currently
  // unlinked — see MapPage.tsx.)
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/seating-chart') return <SeatingChart />
  return <HomePage />
}
