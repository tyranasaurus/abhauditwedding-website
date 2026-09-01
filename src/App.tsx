import { SeatingChart } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'
import { MapEditor } from '@/components/MapEditor'
import { MapView } from '@/components/MapView'
import { MapPage } from '@/components/MapPage'
import { NowPage } from '@/components/NowPage'
import { PassportPage } from '@/components/PassportPage'

export default function App() {
  // One static HTML file is served on / and /seating-chart (see vercel.json);
  // pick the view from the path. Full-page navigation handles
  // transitions. The schedule and wardrobe pages have folded into the homepage,
  // so /schedule and /wardrobe redirect to the matching anchor before this runs
  // — see the inline script in index.html. (The /map page is built but currently
  // unlinked — see MapPage.tsx. /map-view renders one event's layer of the
  // venue map document and /map-editor lays that document out; /grounds is
  // the old name for the view and still resolves.)
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/seating-chart') return <SeatingChart />
  if (path === '/map') return <MapPage />
  if (path === '/map-view' || path === '/grounds') return <MapView />
  if (path === '/map-editor') return <MapEditor />
  if (path === '/now') return <NowPage />
  if (path === '/passport') return <PassportPage />
  return <HomePage />
}
