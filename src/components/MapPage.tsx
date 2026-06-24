import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { SiteNav } from '@/components/SiteNav'
import { mapIntro, pois, venue, type MapPoi } from '@/data/map'

function PoiMarker({ poi }: { poi: MapPoi }) {
  const [open, setOpen] = useState(false)
  const Marker = poi.href ? motion.a : motion.div
  const ariaLabel = `${poi.title} — ${poi.when}`

  return (
    <Marker
      id={`poi-${poi.id}`}
      className={`poi accent-${poi.accent}`}
      style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...(poi.href
        ? { href: poi.href, 'aria-label': ariaLabel }
        : { role: 'img', 'aria-label': ariaLabel })}
    >
      <motion.span
        className="poi-label"
        layout
        style={{ x: '-50%' }}
        transition={{ layout: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] } }}
      >
        <motion.span className="poi-label-body" layout="position">
          <span className="poi-label-title">{poi.title}</span>
          {open ? (
            <span className="poi-label-detail">
              <span className="poi-label-kicker">{poi.kicker}</span>
              <span className="poi-label-when">{poi.when}</span>
              <span className="poi-label-blurb">{poi.blurb}</span>
              {poi.href ? (
                <span className="poi-label-cue">View details →</span>
              ) : null}
            </span>
          ) : null}
        </motion.span>
      </motion.span>
      <span className="poi-pin">
        <span className="poi-glyph">
          <img src={poi.icon} alt="" />
        </span>
      </span>
    </Marker>
  )
}

export function MapPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Carnation Farms · Abha & Udit'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <SiteNav />
      <main className="map-page">
      <header className="map-header">
        <p className="map-kicker">{mapIntro.kicker}</p>
        <h1 className="map-title">{mapIntro.title}</h1>
        <div className="map-ornament" aria-hidden="true" />
        <p className="map-intro">{mapIntro.blurb}</p>
      </header>

      <div className="map-legend-panel">
        <ul className="map-legend">
          {pois.map((poi) => {
            const Row = poi.href ? 'a' : 'div'
            return (
              <li key={poi.id} className={`legend-row accent-${poi.accent}`}>
                <Row
                  className="legend-link"
                  {...(poi.href ? { href: poi.href } : {})}
                >
                  <span className="legend-emblem" aria-hidden="true">
                    <img src={poi.icon} alt="" />
                  </span>
                  <span className="legend-text">
                    <span className="legend-kicker">{poi.kicker}</span>
                    <span className="legend-name">{poi.title}</span>
                    <span className="legend-when">{poi.when}</span>
                  </span>
                  {poi.href ? (
                    <span className="legend-cue" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                </Row>
              </li>
            )
          })}
        </ul>

        <a
          className="map-venue"
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="map-venue-pin"
            src={venue.pin}
            alt=""
            width={134}
            height={192}
          />
          <span className="map-venue-text">
            <span className="map-venue-address">
              {venue.addressLines.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < venue.addressLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </span>
            <span className="map-venue-cue">Open in Google Maps →</span>
          </span>
        </a>

        <a className="map-back" href="/wardrobe">
          ← Wardrobe guide
        </a>
      </div>

      <div className="map-stage" aria-label="Map of the wedding grounds">
        <div className="map-frame">
          <img
            src="/art/map/aerial.webp"
            alt="Hand-painted aerial watercolor map of the wedding grounds: a riverside meadow with woodland, lawns, and red barns."
            className="map-base"
            width={1180}
            height={1180}
            fetchPriority="high"
          />
          <span className="map-vignette" aria-hidden="true" />

          <img
            src="/art/map/sprig-corner.webp"
            alt=""
            className="map-sprig map-sprig--tl"
            width={640}
            height={651}
          />
          <img
            src="/art/map/compass-rose.webp"
            alt=""
            className="map-compass"
            width={440}
            height={483}
          />

          {pois.map((poi) => (
            <PoiMarker key={poi.id} poi={poi} />
          ))}
        </div>
      </div>
      </main>
    </>
  )
}
