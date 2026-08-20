import { useEffect } from 'react'
import { Wardrobe } from '@/components/Wardrobe'
import { SeatingChart } from '@/components/SeatingChart'
import { HomePage } from '@/components/HomePage'
import { useUnlocked } from '@/lib/unlock'

/** Inner pages that are entirely guest-only detail (see the redirect below). */
const GUEST_PATHS = ['/wardrobe', '/seating-chart']

export default function App() {
  const unlocked = useUnlocked()

  // One static HTML file is served on /, /wardrobe and /seating-chart (see
  // vercel.json); pick the view from the path. Full-page navigation handles
  // transitions. (The /map page is built but currently unlinked — see
  // MapPage.tsx.)
  const path = window.location.pathname.replace(/\/+$/, '')

  // While locked we send those visitors back to the homepage where the password
  // gate lives. (The ?password= share link is already consumed before render in
  // main.tsx.)
  useEffect(() => {
    if (!unlocked && GUEST_PATHS.includes(path)) {
      window.history.replaceState({}, '', '/')
    }
  }, [unlocked, path])

  if (!unlocked) return <HomePage />

  if (path === '/wardrobe') return <Wardrobe />
  if (path === '/seating-chart') return <SeatingChart />
  return <HomePage />
}
