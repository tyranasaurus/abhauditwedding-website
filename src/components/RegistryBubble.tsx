import { motion, useReducedMotion } from 'motion/react'

import { registry } from '@/data/home'

/**
 * A small fixed pill in the bottom corner linking straight out to the
 * registry. It stays out of the nav on purpose — a gift ask should be easy to
 * find and just as easy to ignore.
 */
export function RegistryBubble() {
  const reduce = useReducedMotion()

  return (
    <motion.a
      className="registry-bubble"
      href={registry.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 12v9H4v-9" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 21V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
      <span>Registry</span>
    </motion.a>
  )
}
