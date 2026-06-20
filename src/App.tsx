import { Wardrobe } from '@/components/Wardrobe'
import { MapPage } from '@/components/MapPage'
import { HomePage } from '@/components/HomePage'

export default function App() {
  // One static HTML file is served on /, /wardrobe, and /map (see vercel.json);
  // pick the view from the path. Full-page navigation handles transitions.
  const path = window.location.pathname.replace(/\/+$/, '')

  if (path === '/map') return <MapPage />
  if (path === '/wardrobe') return <Wardrobe />
  return <HomePage />
}
