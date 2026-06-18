import { useEffect, useState } from 'react'

// A gentle down-chevron hinting that the page scrolls. It fades out the moment
// the guest starts scrolling, so it never lingers or gets in the way.
export function ScrollCue() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={hidden ? 'scroll-cue is-hidden' : 'scroll-cue'}
      aria-label="Scroll to the wardrobe events"
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
    </button>
  )
}
