import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

/** Scroll distance before the transparent bar fades to solid. */
const SOLID_AT = 80

/** Width below which the section links collapse behind the menu button. */
const MENU_AT = 820

/**
 * Shared top navigation. On pages tall enough to scroll it is transparent at the
 * top and fades to a solid cream bar once scrolled; on single-screen pages (the
 * map) there is nothing to scroll, so it stays solid rather than floating
 * transparently over the content. Section links point at `/#anchor` so they work
 * from any page: same-path on the homepage just scrolls, elsewhere it navigates
 * home first. Narrow screens have no room for the links, so they fold into a
 * menu behind the bar's button.
 */
export function SiteNav() {
  const [solid, setSolid] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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

  // While the menu is open, Escape closes it, and so does widening past the
  // breakpoint (otherwise it would still be "open" but laid out inline).
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth > MENU_AT) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])

  // Same-page anchors don't reload, so the menu has to close itself.
  const close = () => setMenuOpen(false)

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

      <div
        className={`home-nav-links ${menuOpen ? 'is-open' : ''}`}
        id="home-nav-links"
      >
        <a href="/#schedule" onClick={close}>
          Schedule
        </a>
        <a href="/wardrobe" onClick={close}>
          Wardrobe
        </a>
        <a href="/#travel" onClick={close}>
          Travel
        </a>
        <a href="/#faq" onClick={close}>
          Q&amp;A
        </a>
      </div>

      <div className="home-nav-actions">
        <button
          type="button"
          className={`home-nav-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="home-nav-links"
          aria-label={menuOpen ? 'Close menu' : 'Menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="home-nav-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </motion.nav>
  )
}
