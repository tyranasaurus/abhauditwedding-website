import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Shows a gentle scroll-down chevron only when the hero fits the first screen
// with room to spare and the guest is still at the top. If the intro overflows
// the viewport (e.g. small phones), the cue stays hidden — the cut-off content
// is its own "scroll for more" signal, and a fixed arrow would otherwise land
// on top of the text. This keeps it clean across every device.
export function ScrollCue() {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const frame = document.querySelector('.intro-frame')
      if (!frame) {
        setVisible(false)
        return
      }
      const roomBelowHero =
        window.innerHeight - frame.getBoundingClientRect().bottom
      setVisible(window.scrollY < 8 && roomBelowHero > 72)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    // Recompute once webfonts settle, since the script title shifts the height.
    document.fonts?.ready.then(update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <motion.button
      type="button"
      className="scroll-cue"
      aria-label="Scroll to the wardrobe events"
      style={{ x: '-50%', pointerEvents: visible ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: visible ? 0.65 : 0,
        y: reduceMotion ? 0 : [0, 7, 0],
      }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        y: reduceMotion
          ? { duration: 0 }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      }}
      onClick={() =>
        document
          .querySelector('.event-gallery')
          ?.scrollIntoView({ behavior: 'smooth' })
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="30"
        height="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 9l7 7 7-7" />
      </svg>
    </motion.button>
  )
}
