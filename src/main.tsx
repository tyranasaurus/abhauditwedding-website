import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumePasswordParam } from '@/lib/unlock'

// Handle a ?password=<pw> share link before the first render so the app mounts
// already unlocked (no locked flash), then mount.
consumePasswordParam().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
