import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { registry } from '@/data/home'

/** Scroll distance before the transparent bar fades to solid. */
const SOLID_AT = 80

/** Width below which the section links collapse behind the menu button. */
const MENU_AT = 820

/** The homepage sections the nav links to, in the order they appear. */
const SECTIONS = ['schedule', 'map', 'travel', 'faq'] as const

/**
 * Shared top navigation. On pages tall enough to scroll it is transparent at the
 * top and fades to a solid cream bar once scrolled; on single-screen pages (the
 * map) there is nothing to scroll, so it stays solid rather than floating
 * transparently over the content. The homepage carries every section, so the
 * links point at `/#anchor`: on the homepage that just scrolls, elsewhere it
 * navigates home first. Narrow screens have no room for the links, so they fold
 * into a menu behind the bar's button.
 */
export function SiteNav() {
  const [solid, setSolid] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [here, setHere] = useState<string | null>(null)

  // The whole site is one long page now, so the nav is also a position
  // indicator: mark whichever section currently owns the top of the viewport.
  // Anything above the nav counts, so the marker moves as a section scrolls
  // past rather than only when its top edge is on screen.
  useEffect(() => {
    const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (!targets.length) return

    const update = () => {
      const line = window.innerHeight * 0.35
      let current: string | null = null
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el.id
      }
      setHere(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

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
        {/* The painted monogram rather than the script set as live type: this is
            the one place the letterform can be the artwork itself. */}
        <img
          src="/art/au-monogram-leaves.webp"
          alt="Abha &amp; Udit — home"
          width={620}
          height={556}
        />
      </a>

      <div
        className={`home-nav-links ${menuOpen ? 'is-open' : ''}`}
        id="home-nav-links"
      >
        <a
          href="/#schedule"
          onClick={close}
          aria-current={here === 'schedule' ? 'true' : undefined}
        >
          Schedule
        </a>
        <a
          href="/#map"
          onClick={close}
          aria-current={here === 'map' ? 'true' : undefined}
        >
          Map
        </a>
        <a
          href="/#travel"
          onClick={close}
          aria-current={here === 'travel' ? 'true' : undefined}
        >
          Travel
        </a>
        <a href="/#faq" onClick={close} aria-current={here === 'faq' ? 'true' : undefined}>
          Q&amp;A
        </a>
        <a
          href={registry.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
        >
          Registry
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
