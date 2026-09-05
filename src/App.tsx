import { ReceptionPage } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'
import { MapEditor } from '@/components/MapEditor'
import { MapPage } from '@/components/MapPage'
import { MapView } from '@/components/MapView'
import { CarnivalPage } from '@/components/CarnivalPage'
import { ShaadiPage } from '@/components/ShaadiPage'
import { isHidden } from '@/data/hidden-pages'

/**
 * Whether the map editor may open here.
 *
 * It is a tool for laying the venue out, not part of the wedding site, and it
 * writes to a file only a dev server can write — so it belongs to the machine
 * the site is being built on. Two locks, and the first is the one that
 * matters: `/map-editor` has no rewrite in vercel.json, so on the deployed
 * site the edge 404s it before any of this runs. This check covers everything
 * else a dev server answers on — a LAN address for testing on a phone is
 * still local, a public tunnel is not.
 */
function editorAllowed(): boolean {
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  )
}

export default function App() {
  // One static HTML file is served on / and /seating-chart (see vercel.json);
  // pick the view from the path. Full-page navigation handles
  // transitions. The schedule and wardrobe pages have folded into the homepage,
  // so /schedule and /wardrobe redirect to the matching anchor before this runs
  // — see the inline script in index.html. (/map-view renders one event's
  // layer of the venue map document and /map-editor lays that document out;
  // /grounds is the old name for the view and still resolves.)
  const path = window.location.pathname.replace(/\/+$/, '')

  // Switched-off pages come first, ahead of every route below: whatever the
  // path would have rendered, a hidden one renders nothing and the guest
  // lands on the homepage. See src/data/hidden-pages.ts — the Shaadi and
  // Carnival live pages and the map pages are off; the Reception is not.
  if (isHidden(path)) {
    window.location.replace('/')
    return null
  }

  if (path === '/reception') return <ReceptionPage />
  // Same page, opened on the chart: the address guests are handed to find
  // their table.
  if (path === '/seating-chart') return <ReceptionPage toChart />
  if (path === '/map') return <MapPage />
  if (path === '/map-view' || path === '/grounds') return <MapView />
  if (path === '/map-editor' && editorAllowed()) return <MapEditor />
  // /passport was this page's first name; links to it are already out.
  if (path === '/carnival' || path === '/passport') return <CarnivalPage />
  if (path === '/shaadi') return <ShaadiPage />
  return <HomePage />
}
