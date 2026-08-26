import { Fragment } from 'react'

/**
 * Splits a line into per-word spans so individual words can take a different
 * accent, the way the wardrobe page has always coloured its dress-code lines.
 * `accents` gives the accent index for each word; anything unlisted leads with 0.
 */
export function renderWords(text: string, accents: number[] = []) {
  return text.split(' ').map((word, i) => (
    <Fragment key={`${i}-${word}`}>
      {i > 0 && ' '}
      <span style={accents[i] ? { color: `var(--accent-${accents[i] + 1})` } : undefined}>
        {word}
      </span>
    </Fragment>
  ))
}
