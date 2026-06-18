import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

// A gentle down-chevron hinting that the page scrolls. The opacity is linked to
// scroll position, so it fades out smoothly the moment the guest scrolls and
// never lingers. The slow bob draws a soft glance without being intrusive.
export function ScrollCue() {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 80], [0.65, 0])
  const pointerEvents = useTransform(opacity, (value) =>
    value < 0.05 ? 'none' : 'auto',
  )

  return (
    <motion.button
      type="button"
      className="scroll-cue"
      aria-label="Scroll to the wardrobe events"
      style={{ x: '-50%', opacity, pointerEvents }}
      animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
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
