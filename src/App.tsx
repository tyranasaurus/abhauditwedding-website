import { SchedulePage } from '@/components/SchedulePage'
import { SeatingChart } from '@/components/SeatingChart'
import { RegistryPage } from '@/components/RegistryPage'
import { HomePage } from '@/components/HomePage'

export default function App() {
  // One static HTML file is served on /, /schedule, /wardrobe, /seating-chart and
  // /registry (see vercel.json); pick the view from the path. Full-page navigation
  // handles transitions. /wardrobe is an alias for /schedule since the two pages
  // merged — every link already handed out still resolves. (The /map page is built
  // but currently unlinked — see MapPage.tsx.)
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/schedule' || path === '/wardrobe') return <SchedulePage />
  if (path === '/seating-chart') return <SeatingChart />
  if (path === '/registry') return <RegistryPage />
  return <HomePage />
}
