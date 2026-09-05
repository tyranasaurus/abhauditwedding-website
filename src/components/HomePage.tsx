import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'motion/react'
import { faqs, hero, instagram, mapsSearch, registry, travel, venue } from '@/data/home'
import { events } from '@/data/events'
import { EventPanel } from '@/components/EventPanel'
import {
  currentLivePhase,
  isRehearsing,
  livePhasesByEvent,
  schedule,
} from '@/data/live-phases'
import { useForecast, type ForecastWindow } from '@/lib/use-forecast'
import { SiteNav } from '@/components/SiteNav'
import { isHidden } from '@/data/hidden-pages'

/** Which live phase the homepage is in: the venue clock decides, and a
 *  `?live=<id>` (or `?live=off`) test override — with its floating preview
 *  chip — stands in for the clock while trying phases out. */
function useLivePhase() {
  const [override, setOverride] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('live'),
  )
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    // Minute-granular normally — the windows are hours long and the edges
    // just shouldn't lag. A rehearsal runs in seconds, so it needs a tick fast
    // enough to land inside one.
    const id = window.setInterval(
      () => setNow(Date.now()),
      isRehearsing ? 250 : 60_000,
    )
    return () => window.clearInterval(id)
  }, [])
  const phase = override
    ? (schedule.find((p) => p.id === override) ?? null)
    : currentLivePhase(now)

  const preview = (id: string) => {
    setOverride(id)
    const url = new URL(window.location.href)
    url.searchParams.set('live', id)
    window.history.replaceState(null, '', url)
  }
  return { phase, override, preview }
}

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

function SectionTitle({ title }: { title: string }) {
  return (
    <>
      {/* The needle spray travels with the title, not with the photograph: the
          two marks that jointly say "new chapter" have to be adjacent, or the
          picture arrives before you have been told which section you are in. */}
      <Reveal>
        <img
          className="needle-rule"
          src="/art/needle-divider.webp"
          alt=""
          aria-hidden="true"
          width={1100}
          height={148}
          loading="lazy"
        />
      </Reveal>
      <Reveal className="home-section-head" as="header">
        <h2 className="home-section-title">{title}</h2>
      </Reveal>
    </>
  )
}

// Calendar-day arithmetic rather than elapsed hours: the count turns over on a
// date boundary in Carnation, not at whatever hour the ceremony happens to
// start.
const pacificNowFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function nowInPacific() {
  const parts = pacificNowFormat.formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return { day: `${part('year')}-${part('month')}-${part('day')}` }
}

/** Whole days from one YYYY-MM-DD to another, both read as UTC so DST can't skew it. */
function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  )
}

function countdownLabel({ day }: { day: string }) {
  // The weekend is read from the real date: on the morning of the 5th the site
  // must not still be saying "Tomorrow". Both days read the same, and
  // afterwards the line stops counting and says thank you instead — the site
  // outlives the wedding by a good while.
  if (daysBetween(day, LAST_DAY) < 0) return 'Thanks for coming'
  if (daysBetween(day, FIRST_DAY) <= 0) return "It's today!"

  // Whole calendar days, counted from today. It used to step at 3pm instead,
  // on the reasoning that the weekend itself begins then — but that made the
  // number change under you in the middle of an afternoon, which reads as a
  // glitch rather than as a countdown. A day is a day.
  const untilFirst = daysBetween(day, FIRST_DAY)
  return untilFirst > 1 ? `${untilFirst} days to go` : 'Tomorrow'
}

function Countdown() {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setLabel(countdownLabel(nowInPacific()))
    tick()
    // Day-granular, so a slow tick is plenty — it only has to survive midday.
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
            <a
              className="hero-venue"
              href={hero.venueUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {hero.venue}
            </a>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Countdown />
          </motion.div>
          {/* The handle again, under the countdown. It is in the nav too, but
              the nav is chrome — here it reads as the couple's own, and it is
              what guests need in order to tag their photos. */}
          <motion.a
            className="hero-instagram"
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${instagram.handle} on Instagram`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.05 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle
                cx="17.4"
                cy="6.6"
                r="1.2"
                fill="currentColor"
                stroke="none"
              />
            </svg>
            {instagram.handle}
          </motion.a>
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
      <SectionTitle title="Schedule" />
      <SectionPhoto
        src="/art/couple-schedule.webp"
        alt="Abha and Udit among the ferns and string lights at Carnation Farms"
        focus={[0.62, 0.68]}
      />
      <div className="sched-stack">
        {events.map((event) => (
          <EventPanel
            key={event.anchor}
            event={event}
            forecast={forecast.get(event.anchor)}
          />
        ))}
      </div>
    </section>
  )
}

// A plate belonging to the section rather than a divider between sections —
// which is what it became once the needle took the dividing job.
//
// `focus` is where the two of them are in the frame, as fractions across and
// down. It is the only framing number the page carries; the band shape decides
// what it means, because which axis gets cropped flips as the band narrows.
// Set from the cropper.

/* All three photographs are 1.6:1. `cover` fits whichever dimension is short
 * and crops the other, so a band wider than 1.6 crops the height and shows the
 * whole width, and a band taller than 1.6 does the reverse. The visible
 * fraction on the cropped axis is the ratio of the two aspects, and
 * object-position is measured against the part that does NOT fit — hence
 * (focus - visible/2) / (1 - visible), clamped, because a value outside 0–1
 * would slide the picture off its own box and leave a gap.
 *
 * This arithmetic used to live in the stylesheet as clamp(calc(…)) inside
 * object-position. It was correct, and it computed to 0% on WebKit and on
 * older Chrome, which is a crop hard against the left edge: on the square band
 * that small phones get, one of them was sliced off at the right edge while
 * every phone wider than 600px looked perfect. Percentages are worked out here
 * now and handed over as plain values, so nothing is left for a browser to
 * evaluate. */
const SOURCE_RATIO = 1.6

function framing(band: number, [cx, cy]: [number, number]) {
  const visible = band > SOURCE_RATIO ? SOURCE_RATIO / band : band / SOURCE_RATIO
  const focus = band > SOURCE_RATIO ? cy : cx
  const raw = (focus - visible / 2) / (1 - visible)
  const pos = `${Math.round(Math.min(1, Math.max(0, raw)) * 100)}%`
  return band > SOURCE_RATIO ? `50% ${pos}` : `${pos} 50%`
}

function SectionPhoto({
  src,
  alt,
  focus,
}: {
  src: string
  alt: string
  focus: [number, number]
}) {
  return (
    <>
      <Reveal as="figure" className="section-photo">
        <img
          src={src}
          alt={alt}
          className="section-photo-img"
          style={
            {
              '--pos-wide': framing(16 / 9, focus),
              '--pos-mid': framing(4 / 3, focus),
              '--pos-square': framing(1, focus),
            } as CSSProperties
          }
          loading="lazy"
        />
      </Reveal>
    </>
  )
}

function Travel() {
  return (
    <section className="home-travel" id="travel" aria-label="Travel">
      <SectionTitle title="Travel" />
      <SectionPhoto
        src="/art/couple-travel.webp"
        alt="Abha and Udit on the ferry across Puget Sound"
        focus={[0.32, 0.59]}
      />
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
        {/* The two six-item lists pair off; Eastside Bites runs full width
            beneath them because every one of its rows carries a note. */}
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
        <Reveal as="article" className="travel-list">
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
        <Reveal as="article" className="travel-list travel-list-wide">
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
      <SectionTitle title="Q & A" />
      <SectionPhoto
        src="/art/couple-beach.webp"
        alt="Abha and Udit walking along the shore at the water's edge"
        focus={[0.59, 0.49]}
      />
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
        <p className="footer-date">{hero.date}</p>
        <a
          className="footer-venue"
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {venue.label}
        </a>
        {/* The registry sits in the row rather than below it as its own ask:
            it is the same kind of destination as the three sections, and the
            top nav already lists it alongside them. */}
        <nav className="footer-nav" aria-label="Site">
          <a href="#schedule">Schedule</a>
          {/* The map is a page of its own, so this is a path and not a hash —
              and it only appears while that page is switched on. See
              src/data/hidden-pages.ts. */}
          {!isHidden('/map') && <a href="/map">Map</a>}
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

function offsetOf(id: string) {
  const el = document.getElementById(id)
  if (!el) return 0
  return Math.round(el.getBoundingClientRect().top + window.scrollY)
}

export function HomePage() {
  const { phase, override, preview } = useLivePhase()
  const reduceMotion = useReducedMotion()
  const liveAnchor = phase?.anchor ?? null
  // The live auto-scroll fires once per visit: switching phases in the
  // preview chip must not keep yanking the page around.
  const autoHeld = useRef(false)
  // Bumped by the dev navigator's phase buttons: each click replays the
  // fresh-landing auto-scroll for the newly picked phase.
  const [scrollRequest, setScrollRequest] = useState(0)

  // A phase change while the page is open — the clock crossing a window's edge
  // under a guest who is already reading — glides them to the event that has
  // just become the one they are standing in. Not on the first render: landing
  // is already handled below, and doing both would scroll twice.
  const lastPhase = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    const id = phase?.id ?? null
    const first = lastPhase.current === undefined
    const changed = !first && lastPhase.current !== id
    lastPhase.current = id
    if (changed && id) setScrollRequest((n) => n + 1)
  }, [phase?.id])

  // Everything lives on this one page now, so a deep link is a hash — and a
  // hash is only as good as the page's height at the instant it is followed.
  // The artwork decodes, the forecast lands, and the display faces swap in;
  // each moves the target out from under the guest. The stand-in faces in the
  // stylesheet cure the largest of those, but a jump still has to be held onto
  // until the page has genuinely stopped moving.
  useEffect(() => {
    // Whatever correction is currently running, so a second hash can end it.
    let stop = () => {}

    const hold = (raw: string, force = false) => {
      stop()
      const id = decodeURIComponent(raw)
      const target = document.getElementById(id)
      if (!target) return

      // A forced hold is a dev navigator click on a page that has long since
      // settled, so it wants the opposite of the correction below: one smooth
      // glide, and none of the watching that would read its own animation as
      // the guest taking over.
      if (force) {
        target.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'start',
        })
        return
      }

      let taken = false
      // The last scroll position this effect itself asked for. Anything else
      // the page ends up at came from the guest.
      let ours = -1

      const jump = () => {
        if (taken) return
        const target = document.getElementById(id)
        if (!target) return
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
        ours = Math.round(window.scrollY)
      }

      // Watching the scroll position rather than sniffing for touchmove and
      // wheel, because the guest can scroll before this bundle has even
      // arrived — on a slow connection they had already flicked past the
      // section by the time the listeners existed, and the correction hauled
      // them back. A position that isn't the one we asked for is theirs,
      // however they got there: drag, flick, momentum, keyboard, or the
      // browser's own restoration. A tap moves nothing, so a tap keeps the
      // correction alive — which is the whole point.
      const release = () => {
        taken = true
        stop()
      }
      const watch = () => {
        if (ours >= 0 && Math.abs(Math.round(window.scrollY) - ours) > 2) release()
      }

      const passive = { passive: true } as const
      window.addEventListener('scroll', watch, passive)
      window.addEventListener('keydown', release)

      // Follow the page's height rather than guessing at a delay, and wait on
      // the two things that reflow it most: the faces, and the images.
      const follow = new ResizeObserver(jump)
      follow.observe(document.documentElement)
      window.addEventListener('load', jump)
      document.fonts?.ready.then(jump).catch(() => {})

      // If the guest is already reading somewhere else — scrolled away while
      // the bundle was still downloading — leave them there. A scroll of
      // exactly zero means the browser never got to the fragment at all,
      // which is the case this correction exists for.
      const away =
        window.scrollY > 0 &&
        Math.abs(window.scrollY - offsetOf(id)) > window.innerHeight
      if (!away) requestAnimationFrame(jump)

      const settled = window.setTimeout(() => stop(), 4000)

      stop = () => {
        follow.disconnect()
        window.clearTimeout(settled)
        window.removeEventListener('load', jump)
        window.removeEventListener('scroll', watch)
        window.removeEventListener('keydown', release)
        stop = () => {}
      }
    }

    // The nav's own links change the hash without remounting anything, so the
    // menu taps that need this most used to get no correction at all.
    const onHash = () => {
      const next = window.location.hash.slice(1)
      if (next) hold(next)
    }
    window.addEventListener('hashchange', onHash)

    const first = window.location.hash.slice(1)
    if (scrollRequest > 0 && liveAnchor) {
      // A dev navigator click: replay the landing scroll for the picked
      // phase, from wherever the page currently sits.
      autoHeld.current = true
      hold(liveAnchor, true)
    } else if (first) {
      hold(first)
    } else if (liveAnchor && !autoHeld.current) {
      // An event window is open and the guest asked for nothing more
      // specific: land them on that event's card.
      autoHeld.current = true
      hold(liveAnchor)
    }

    return () => {
      window.removeEventListener('hashchange', onHash)
      stop()
    }
  }, [liveAnchor, scrollRequest])

  return (
    <div className="home" id="top">
      <SiteNav />
      {/* The painting is a set the page walks across: a fixed plate that never
          scrolls, with the whole document travelling over it inside a
          translucent column. */}
      <div className="page-plate" aria-hidden="true" />
      <div className="page-column">
        <Hero />
        <main className="home-main">
          <Schedule />
          <Travel />
          <Faq />
        </main>
        <Footer />
      </div>

      {/* The call into this event's live page: a floating pill pinned to the
          bottom of the screen, worn in that event's own colors. Only the
          `during` phases have one — before an event starts there is nothing
          live to open. */}
      {/* The pill can arrive under a guest who is already on the page — the
          clock crosses into the event while they are reading — so it rises
          into place rather than blinking into existence. Keyed on the phase so
          a change swaps one pill for the next instead of mutating the label
          under the guest's thumb. */}
      <AnimatePresence mode="wait">
        {phase?.pill ? (
          (() => {
            const accents = events.find((e) => e.anchor === phase.anchor)!
              .accents
            return (
              <motion.a
                key={phase.id}
                className="live-pill"
                href={phase.pill.href}
                style={{ '--pill-bg': accents.primary } as CSSProperties}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 28, scale: 0.94 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 14, scale: 0.96 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 }
                }
              >
                {phase.pill.label} →
              </motion.a>
            )
          })()
        ) : null}
      </AnimatePresence>

      {/* Floating phase-preview control, only when a ?live= override is in
          play — a temporary stand-in for waiting until the actual weekend.
          One row per event, Before and During on each, so both behaviors are
          reachable for all three. */}
      {override !== null && (
        <div className="now-admin" role="group" aria-label="Live phase preview">
          <p className="now-admin-kicker">Live preview</p>
          {livePhasesByEvent.map((row) => (
            <div className="now-admin-row" key={row.label}>
              <span className="now-admin-label">{row.label}</span>
              {row.phases.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={phase?.id === candidate.id ? 'is-on' : ''}
                  aria-pressed={phase?.id === candidate.id}
                  onClick={() => {
                    preview(candidate.id)
                    // Replay the fresh-landing scroll for this phase's card.
                    setScrollRequest((n) => n + 1)
                  }}
                >
                  {candidate.stage === 'during' ? 'During' : 'Before'}
                </button>
              ))}
            </div>
          ))}
          <div className="now-admin-row">
            <span className="now-admin-label" />
            <button
              type="button"
              className={phase ? '' : 'is-on'}
              aria-pressed={!phase}
              onClick={() => preview('off')}
            >
              Off — no event live
            </button>
          </div>
          {/* A way into the live pages themselves. Each one turns guests away
              until its event opens, so before the weekend they are only
              reachable with the `?preview` these links carry. Pages that are
              switched off are left out entirely: `?preview` does not reopen
              them. See src/data/hidden-pages.ts. */}
          <div className="now-admin-row">
            <span className="now-admin-label">Pages</span>
            {[
              ['Shaadi', '/shaadi'],
              ['Carnival', '/carnival'],
              ['Reception', '/reception'],
              ['Seating', '/seating-chart'],
            ]
              .filter(([, href]) => !isHidden(href!))
              .map(([label, href]) => (
                <a
                  key={href}
                  className="now-admin-link"
                  href={`${href}?preview`}
                >
                  {label}
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
