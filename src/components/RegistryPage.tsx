import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { SiteNav } from '@/components/SiteNav'
import { registry } from '@/data/home'

/**
 * A short, shareable page at /registry. Its whole job is to hand guests the
 * direct link, so the button is the only thing competing for attention.
 */
export function RegistryPage() {
  const reduce = useReducedMotion()

  useEffect(() => {
    const prev = document.title
    document.title = 'Registry · Abha & Udit'
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <>
      <SiteNav />
      <main className="registry-page" aria-labelledby="registry-title">
        <motion.div
          className="registry-card"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <img
            src="/art/barn-wedding-logo.webp"
            alt=""
            className="registry-mark"
            width={1200}
            height={1101}
            fetchPriority="high"
          />

          <p className="registry-kicker">{registry.kicker}</p>
          <h1 id="registry-title" className="registry-title">
            {registry.title}
          </h1>
          <div className="registry-ornament" aria-hidden="true" />

          <div className="registry-copy">
            {registry.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <a
            className="btn btn-lead registry-cta"
            href={registry.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {registry.cta} →
          </a>
          <p className="registry-note">{registry.note}</p>

          <a className="btn btn-back registry-back" href="/#top">
            ← Back home
          </a>
        </motion.div>
      </main>
    </>
  )
}
