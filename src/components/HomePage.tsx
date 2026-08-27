import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'motion/react'
import { hero, travel, faqs, registry, venue, mapsSearch } from '@/data/home'
import { events } from '@/data/events'
import { EventPanel } from '@/components/EventPanel'
import { useForecast, type ForecastWindow } from '@/lib/use-forecast'
import { SiteNav } from '@/components/SiteNav'
import { RegistryBubble } from '@/components/RegistryBubble'

/** The weekend, as calendar days in the venue's own timezone. */
const FIRST_DAY = '2026-09-05'
const LAST_DAY = '2026-09-06'

// A small scroll-reveal wrapper used throughout the page. Fades and lifts its
// children into place the first time they enter the viewport.
function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'figure'
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}

function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <Reveal className="home-section-head" as="header">
      {kicker ? <p className="home-kicker">{kicker}</p> : null}
      <h2 className="home-section-title">{title}</h2>
      <div className="home-ornament" aria-hidden="true" />
    </Reveal>
  )
}

// Calendar-day arithmetic rather than elapsed hours: the count should turn over
// at midnight in Carnation, not at whatever hour the ceremony happens to start.
const pacificDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function todayInPacific() {
  const parts = pacificDay.formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Whole days from one YYYY-MM-DD to another, both read as UTC so DST can't skew it. */
function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  )
}

function countdownLabel(today: string) {
  const untilFirst = daysBetween(today, FIRST_DAY)
  if (untilFirst > 1) return `${untilFirst} days to go`
  if (untilFirst === 1) return 'Tomorrow'
  // Both days of the weekend read the same; after that the count retires.
  return daysBetween(today, LAST_DAY) >= 0 ? "It's today!" : null
}

function Countdown() {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setLabel(countdownLabel(todayInPacific()))
    tick()
    // Day-granular, so a slow tick is plenty — it only has to survive midnight.
    const id = window.setInterval(tick, 300_000)
    return () => window.clearInterval(id)
  }, [])
  if (!label) return null
  return <span className="hero-countdown">{label}</span>
}

function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  // Gentle parallax: the portrait drifts up a touch as you scroll past.
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40])

  return (
    <header className="hero" ref={ref}>
      <div className="hero-sky" aria-hidden="true" />
      {/* The corner sprigs are artwork, not motion — reduced motion should drop
          the settling-in animation, not the flowers. */}
      <motion.img
        src="/art/map/sprig-corner.webp"
        alt=""
        className="hero-sprig hero-sprig--tl"
        initial={reduce ? false : { opacity: 0, rotate: -8, scale: 0.9 }}
        animate={{ opacity: 0.85, rotate: 0, scale: 1 }}
        transition={{ duration: reduce ? 0 : 1.2, ease: 'easeOut' }}
      />
      <motion.img
        src="/art/map/sprig-corner.webp"
        alt=""
        className="hero-sprig hero-sprig--br"
        initial={reduce ? false : { opacity: 0, rotate: 172, scale: 0.9 }}
        animate={{ opacity: 0.85, rotate: 180, scale: 1 }}
        transition={{ duration: reduce ? 0 : 1.2, ease: 'easeOut' }}
      />

      <div className="hero-inner">
        <motion.div
          className="hero-portrait-wrap"
          style={{ y: portraitY }}
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* The arch that the rest of the page echoes: the photo sits in a
              paper mat, traced a little further out by a single forest line. */}
          <motion.span
            className="hero-portrait-arch"
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.1,
              delay: 0.35,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          />
          <span className="hero-portrait-clip">
            <img
              src="/art/couple.webp"
              alt="Abha and Udit embracing in the forest at Carnation Farms"
              className="hero-portrait"
              width={2048}
              height={2048}
              fetchPriority="high"
            />
          </span>
        </motion.div>

        <motion.div className="hero-copy" style={{ y: copyY }}>
          <motion.h1
            className="hero-names"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.25,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {hero.names}
          </motion.h1>
          <motion.div
            className="hero-meta"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            <span className="hero-date">{hero.date}</span>
            <span className="hero-dot" aria-hidden="true">
              ·
            </span>
            <span className="hero-venue">{hero.venue}</span>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Countdown />
          </motion.div>
        </motion.div>
      </div>
    </header>
  )
}

/** The hours we show weather for — the two outdoor events. */
const FORECAST_WINDOWS: ForecastWindow[] = events.flatMap((event) =>
  event.forecastWindow ? [{ key: event.anchor, ...event.forecastWindow }] : [],
)
function Schedule() {
  const forecast = useForecast(FORECAST_WINDOWS)

  return (
    <section className="home-schedule" id="schedule" aria-label="Schedule">
      <SectionPhoto
        src="/art/couple-schedule.webp"
        alt="Abha and Udit among the ferns and string lights at Carnation Farms"
        position="50% 45%"
      />
      <SectionTitle title="Schedule" />
      <div className="sched-stack">
        {events.map((event) => (
          <Fragment key={event.anchor}>
            {event.divider && (
              <div className="sched-divider" aria-hidden="true">
                <div className="home-ornament" />
              </div>
            )}
            <EventPanel event={event} forecast={forecast.get(event.anchor)} />
          </Fragment>
        ))}
      </div>
    </section>
  )
}

// A photo of the two of them, matted and set in the same arch as the hero. The
// dome here is shallower — these are landscape shots, and a full round arch
// would crop into the tops of their heads.
function SectionPhoto({
  src,
  alt,
  position,
}: {
  src: string
  alt: string
  position?: string
}) {
  return (
    <Reveal as="figure" className="section-photo">
      <img
        src={src}
        alt={alt}
        className="section-photo-img"
        style={position ? { objectPosition: position } : undefined}
        loading="lazy"
      />
    </Reveal>
  )
}

function Travel() {
  return (
    <section className="home-travel" id="travel" aria-label="Travel">
      <SectionPhoto
        src="/art/couple-travel.webp"
        alt="Abha and Udit on the ferry across Puget Sound"
        position="50% 48%"
      />
      <SectionTitle title="Travel" />
      <Reveal className="travel-intro">
        <p>{travel.intro}</p>
      </Reveal>

      <div className="travel-notes">
        {travel.notes.map((note, i) => (
          <Reveal
            as="article"
            className="travel-note"
            key={note.title}
            delay={i * 0.08}
          >
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </Reveal>
        ))}
      </div>

      <div className="travel-lists">
        {/* Seattle and the day trips share the left column, stacked. */}
        <div className="travel-list-stack">
          <Reveal as="article" className="travel-list">
            <h3 className="travel-list-title">Our Favorite Seattle Spots</h3>
            <ul>
              {travel.seattleSpots.map((s) => (
                <li key={s.name}>
                  <a
                    className="travel-spot-name"
                    href={mapsSearch(s.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.name}
                  </a>
                  {s.note ? (
                    <span className="travel-spot-note">{s.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal as="article" className="travel-list" delay={0.1}>
            <h3 className="travel-list-title">PNW Day Trips</h3>
            <ul>
              {travel.pnwDayTrips.map((s) => (
                <li key={s.name}>
                  <a
                    className="travel-spot-name"
                    href={mapsSearch(s.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.name}
                  </a>
                  {s.note ? (
                    <span className="travel-spot-note">{s.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal as="article" className="travel-list" delay={0.2}>
          <h3 className="travel-list-title">Our Favorite Eastside Bites</h3>
          <ul>
            {travel.eastsideBites.map((s) => (
              <li key={s.name}>
                <a
                  className="travel-spot-name"
                  href={mapsSearch(s.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.name}
                </a>
                {s.note ? (
                  <span className="travel-spot-note">{s.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function FaqItem({
  q,
  a,
  link,
  index,
}: {
  q: string
  a: string
  link?: { label: string; href: string }
  index: number
}) {
  const [open, setOpen] = useState(false)
  const panelId = `faq-answer-${index}`
  return (
    <Reveal as="li" className="faq-item" delay={(index % 2) * 0.06}>
      <button
        type="button"
        className="faq-q"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <motion.span
          className="faq-icon"
          aria-hidden="true"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-a"
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <p>{a}</p>
            {link && (
              <a
                className="faq-link"
                href={link.href}
                {...(/^https?:/.test(link.href)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {link.label} →
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  )
}

function Faq() {
  return (
    <section className="home-faq" id="faq" aria-label="Questions and answers">
      <SectionPhoto
        src="/art/couple-beach.webp"
        alt="Abha and Udit walking along the shore at the water's edge"
        position="50% 50%"
      />
      <SectionTitle kicker="Good to Know" title="Q & A" />
      <ul className="faq-list">
        {faqs.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} link={f.link} index={i} />
        ))}
      </ul>
    </section>
  )
}

function Footer() {
  return (
    <footer className="home-footer">
      <Reveal>
        <p className="footer-names">{hero.names}</p>
        <div className="home-ornament" aria-hidden="true" />
        <p className="footer-date">{hero.date}</p>
        <a
          className="footer-venue"
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {venue.label}
        </a>
        <nav className="footer-nav" aria-label="Site">
          <a href="#schedule">Schedule</a>
          <a href="#travel">Travel</a>
          <a href="#faq">Q&amp;A</a>
          <a href={registry.url} target="_blank" rel="noopener noreferrer">
            Registry
          </a>
        </nav>
      </Reveal>
    </footer>
  )
}

export function HomePage() {
  // Everything lives on this one page now, so a deep link is a hash. The browser
  // tries to scroll before React has rendered the target, and the page keeps
  // growing after that as the display faces swap in and the artwork decodes —
  // each of which moves the target further down. So re-run the jump at every
  // point the page can still have settled, and stop the moment the guest
  // scrolls for themselves.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    let taken = false
    const jump = () => {
      if (taken) return
      document
        .getElementById(decodeURIComponent(id))
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
    const release = () => {
      taken = true
    }
    const opts = { once: true, passive: true } as const
    window.addEventListener('wheel', release, opts)
    window.addEventListener('touchstart', release, opts)
    window.addEventListener('keydown', release, { once: true })

    requestAnimationFrame(jump)
    // Anything that changes the page's height moves the target: a display face
    // swapping in, the artwork decoding, the forecast arriving and adding its
    // credit line. Follow the height rather than guessing at a delay.
    const follow = new ResizeObserver(jump)
    follow.observe(document.documentElement)
    const settled = window.setTimeout(() => follow.disconnect(), 3000)

    return () => {
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
      follow.disconnect()
      window.clearTimeout(settled)
    }
  }, [])

  return (
    <div className="home" id="top">
      <SiteNav />
      <Hero />
      <main className="home-main">
        <Schedule />
        <Travel />
        <Faq />
      </main>
      <Footer />
      <RegistryBubble />
    </div>
  )
}
