import { ReceptionPage } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'
import { MapEditor } from '@/components/MapEditor'
import { MapView } from '@/components/MapView'
import { NowPage } from '@/components/NowPage'
import { CarnivalPage } from '@/components/CarnivalPage'
import { ShaadiPage } from '@/components/ShaadiPage'

export default function App() {
  // One static HTML file is served on / and /seating-chart (see vercel.json);
  // pick the view from the path. Full-page navigation handles
  // transitions. The schedule and wardrobe pages have folded into the homepage,
  // so /schedule and /wardrobe redirect to the matching anchor before this runs
  // — see the inline script in index.html. (/map-view renders one event's
  // layer of the venue map document and /map-editor lays that document out;
  // /grounds is the old name for the view and still resolves.)
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/reception') return <ReceptionPage />
  // Same page, opened on the chart: the address guests are handed to find
  // their table.
  if (path === '/seating-chart') return <ReceptionPage toChart />
  if (path === '/map-view' || path === '/grounds') return <MapView />
  if (path === '/map-editor') return <MapEditor />
  if (path === '/now') return <NowPage />
  // /passport was this page's first name; links to it are already out.
  if (path === '/carnival' || path === '/passport') return <CarnivalPage />
  if (path === '/shaadi') return <ShaadiPage />
  return <HomePage />
}
