import { Wardrobe } from '@/components/Wardrobe'
import { SeatingChart } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'

export default function App() {
  // One static HTML file is served on /, /wardrobe and /seating-chart (see
  // vercel.json); pick the view from the path. Full-page navigation handles
  // transitions. (The /map page is built but currently unlinked — see
  // MapPage.tsx.)
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/wardrobe') return <Wardrobe />
  if (path === '/seating-chart') return <SeatingChart />
  return <HomePage />
}
