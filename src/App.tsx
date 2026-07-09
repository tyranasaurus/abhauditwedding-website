import { useEffect } from 'react'
import { Wardrobe } from '@/components/Wardrobe'
import { HomePage } from '@/components/HomePage'
import { useUnlocked } from '@/lib/unlock'

export default function App() {
  const unlocked = useUnlocked()

  // One static HTML file is served on / and /wardrobe (see vercel.json); pick
  // the view from the path. Full-page navigation handles transitions. (The /map
  // page is built but currently unlinked — see MapPage.tsx.)
  const path = window.location.pathname.replace(/\/+$/, '')

  // /wardrobe is entirely guest-only detail, so while locked we send those
  // visitors back to the homepage where the password gate lives. (The
  // ?password= share link is already consumed before render in main.tsx.)
  useEffect(() => {
    if (!unlocked && path === '/wardrobe') {
      window.history.replaceState({}, '', '/')
    }
  }, [unlocked, path])

  if (!unlocked) return <HomePage />

  if (path === '/wardrobe') return <Wardrobe />
  return <HomePage />
}
