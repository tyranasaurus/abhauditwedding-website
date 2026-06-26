import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'motion/react'
import {
  hero,
  schedule,
  exploreCards,
  travel,
  stay,
  faqs,
  venue,
  mapsSearch,
} from '@/data/home'
import { SiteNav } from '@/components/SiteNav'
import { PasswordGate } from '@/components/PasswordGate'
import { useUnlocked } from '@/lib/unlock'

const WEDDING_DATE = new Date('2026-09-05T16:00:00-07:00')

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
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
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

function SectionTitle({
  kicker,
  title,
}: {
  kicker: string
  title: string
}) {
  return (
    <Reveal className="home-section-head" as="header">
      <p className="home-kicker">{kicker}</p>
      <h2 className="home-section-title">{title}</h2>
      <div className="home-ornament" aria-hidden="true" />
    </Reveal>
  )
}

function Countdown() {
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => {
      const ms = WEDDING_DATE.getTime() - Date.now()
      setDays(Math.max(0, Math.ceil(ms / 86_400_000)))
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])
  if (days === null) return null
  return (
    <span className="hero-countdown">
      {days === 0 ? 'The day is here' : `${days} days to go`}
    </span>
  )
}

function Hero() {
  const reduce = useReducedMotion()
  const unlocked = useUnlocked()
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
      {!reduce && (
        <>
          <motion.img
            src="/art/map/sprig-corner.webp"
            alt=""
            className="hero-sprig hero-sprig--tl"
            initial={{ opacity: 0, rotate: -8, scale: 0.9 }}
            animate={{ opacity: 0.85, rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.img
            src="/art/map/sprig-corner.webp"
            alt=""
            className="hero-sprig hero-sprig--br"
            initial={{ opacity: 0, rotate: 172, scale: 0.9 }}
            animate={{ opacity: 0.85, rotate: 180, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </>
      )}

      <div className="hero-inner">
        <motion.div
          className="hero-portrait-wrap"
          style={{ y: portraitY }}
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <motion.span
            className="hero-portrait-ring"
            aria-hidden="true"
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          />
          <span className="hero-portrait-clip">
            <img
              src="/art/couple-photo.webp"
              alt="Abha and Udit embracing in the forest at Carnation Farms"
              className="hero-portrait"
              width={1400}
              height={2100}
              fetchPriority="high"
            />
          </span>
        </motion.div>

        <motion.div className="hero-copy" style={{ y: copyY }}>
          <motion.p
            className="hero-eyebrow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            Together with their families
          </motion.p>
          <motion.h1
            className="hero-names"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {hero.names}
          </motion.h1>
          {/* The date and location are guest-only: they appear once the password
              unlocks the page, alongside the rest of the details. */}
          {unlocked && (
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
          )}
          <motion.div
            className="hero-actions"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <a
              className="btn btn-primary"
              href={hero.rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              RSVP
            </a>
            <a className="btn btn-ghost" href="#schedule">
              See the weekend
            </a>
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

function Schedule() {
  return (
    <section className="home-schedule" id="schedule" aria-label="Schedule">
      <SectionTitle kicker="The Weekend" title="Schedule" />
      <ol className="schedule-list">
        {schedule.map((stop, i) => (
          <Reveal
            as="li"
            className={`schedule-stop accent-${stop.accent}`}
            key={stop.title}
            delay={i * 0.08}
          >
            <a className="schedule-link" href={stop.href}>
              <span className="schedule-when">
                <span className="schedule-day">{stop.day}</span>
                <span className="schedule-date">{stop.date}</span>
                <span className="schedule-time">{stop.time}</span>
              </span>
              <span className="schedule-bullet" aria-hidden="true" />
              <span className="schedule-what">
                <span className="schedule-kind">{stop.kind}</span>
                <span className="schedule-title">{stop.title}</span>
                <span className="schedule-cue">What to wear →</span>
              </span>
            </a>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

// A full-bleed photo interlude — the same forest portrait the live site leads
// with, here giving the scroll a breath between the schedule and the planning
// details.
function CoupleBand() {
  return (
    <Reveal as="section" className="home-band" aria-hidden="true">
      <div className="home-band-frame">
        <img
          src="/art/couple-band.webp"
          alt=""
          className="home-band-img"
          width={2000}
          height={1365}
          loading="lazy"
        />
      </div>
    </Reveal>
  )
}

function Explore() {
  return (
    <section className="home-explore" id="explore" aria-label="Wardrobe">
      <SectionTitle kicker="Plan Your Visit" title="Wardrobe" />
      <div className="explore-grid">
        {exploreCards.map((card, i) => (
          <Reveal as="article" key={card.href} delay={i * 0.1}>
            <motion.a
              className="explore-card"
              href={card.href}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="explore-art">
                <img src={card.image} alt={card.imageAlt} loading="lazy" />
              </div>
              <div className="explore-body">
                <p className="explore-kicker">{card.kicker}</p>
                <h3 className="explore-title">{card.title}</h3>
                <p className="explore-blurb">{card.blurb}</p>
                <span className="explore-cue">{card.cue} →</span>
              </div>
            </motion.a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Travel() {
  return (
    <section className="home-travel" id="travel" aria-label="Travel">
      <SectionTitle kicker="Getting Here" title="Travel" />
      <Reveal className="travel-intro">
        <p>{travel.intro}</p>
      </Reveal>

      <div className="travel-notes">
        {travel.notes.map((note, i) => (
          <Reveal as="article" className="travel-note" key={note.title} delay={i * 0.08}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
            <a
              href={note.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="travel-link"
            >
              {note.link.label} →
            </a>
          </Reveal>
        ))}
      </div>

      <div className="travel-lists">
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
                {s.note ? <span className="travel-spot-note">{s.note}</span> : null}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal as="article" className="travel-list" delay={0.1}>
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
                {s.note ? <span className="travel-spot-note">{s.note}</span> : null}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Stay() {
  const { hotel } = stay
  return (
    <section className="home-stay" id="stay" aria-label="Where to stay">
      <SectionTitle kicker="Rest Your Head" title="Where to Stay" />
      <Reveal className="stay-intro">
        <p>{stay.intro}</p>
      </Reveal>
      <Reveal className="stay-card" delay={0.05}>
        <div className="stay-card-main">
          <h3 className="stay-hotel">{hotel.name}</h3>
          <p className="stay-area">{hotel.area}</p>
          <p className="stay-address">{hotel.address}</p>
          <p className="stay-cutoff">{hotel.cutoffNote}</p>
        </div>
        <div className="stay-card-aside">
          <span className="stay-rate">{hotel.rate}</span>
          <span className="stay-bookby">{hotel.bookBy}</span>
          <a
            className="btn btn-primary"
            href={hotel.bookUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            See availability
          </a>
        </div>
      </Reveal>
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
  return (
    <Reveal as="li" className="faq-item" delay={(index % 2) * 0.06}>
      <button
        type="button"
        className="faq-q"
        aria-expanded={open}
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
                target="_blank"
                rel="noopener noreferrer"
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
          {venue.name} · {venue.addressLines.join(', ')}
        </a>
        <nav className="footer-nav" aria-label="Site">
          <a href="/wardrobe">Wardrobe Guide</a>
          <a href={hero.rsvpUrl} target="_blank" rel="noopener noreferrer">
            RSVP
          </a>
        </nav>
      </Reveal>
    </footer>
  )
}

export function HomePage() {
  const unlocked = useUnlocked()

  useEffect(() => {
    const prev = document.title
    // Keep the date out of the tab title until the page is unlocked, matching
    // the gated date/location in the hero.
    document.title = unlocked
      ? 'Abha & Udit · September 5–6, 2026'
      : 'Abha & Udit'
    return () => {
      document.title = prev
    }
  }, [unlocked])

  return (
    <div className="home" id="top">
      <SiteNav />
      <Hero />
      {unlocked ? (
        <>
          <main className="home-main">
            <Schedule />
            <CoupleBand />
            <Explore />
            <Travel />
            <Stay />
            <Faq />
          </main>
          <Footer />
        </>
      ) : (
        <PasswordGate />
      )}
    </div>
  )
}
