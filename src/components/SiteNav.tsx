import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { hero } from '@/data/home'
import { useUnlocked } from '@/lib/unlock'

/** Scroll distance before the transparent bar fades to solid. */
const SOLID_AT = 80

/**
 * Shared top navigation. On pages tall enough to scroll it is transparent at the
 * top and fades to a solid cream bar once scrolled; on single-screen pages (the
 * map) there is nothing to scroll, so it stays solid rather than floating
 * transparently over the content. Section links point at `/#anchor` so they work
 * from any page: same-path on the homepage just scrolls, elsewhere it navigates
 * home first.
 */
export function SiteNav() {
  const [solid, setSolid] = useState(true)
  const unlocked = useUnlocked()
  useEffect(() => {
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight > SOLID_AT
      setSolid(!scrollable || window.scrollY > SOLID_AT)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    window.addEventListener('load', update)
    // Webfonts and images change page height after mount; re-measure when ready.
    document.fonts?.ready.then(update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('load', update)
    }
  }, [])

  return (
    <motion.nav
      className={`home-nav ${solid ? 'is-solid' : ''}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      aria-label="Primary"
    >
      <a className="home-nav-brand" href="/#top">
        A&nbsp;&amp;&nbsp;U
      </a>
      {/* While locked the only thing past the splash is the gate, so the section
          and inner-page links would all dead-end there — hide until unlocked. */}
      {unlocked ? (
        <div className="home-nav-links">
          <a href="/#schedule">Schedule</a>
          <a href="/wardrobe">Wardrobe</a>
          <a href="/#travel">Travel</a>
          <a href="/#registry">Registry</a>
          <a href="/#faq">Q&amp;A</a>
          <a
            className="home-nav-rsvp"
            href={hero.rsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            RSVP
          </a>
        </div>
      ) : null}
    </motion.nav>
  )
}
