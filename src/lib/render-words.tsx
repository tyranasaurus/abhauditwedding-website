import { Fragment } from 'react'

/**
 * Splits a line into per-word spans so individual words can take their own
 * colour, the way the wardrobe page has always coloured its dress-code lines.
 * `colors` gives one colour per word; anything unlisted inherits.
 */
export function renderWords(text: string, colors: string[] = []) {
  return text.split(' ').map((word, i) => (
    <Fragment key={`${i}-${word}`}>
      {i > 0 && ' '}
      <span style={colors[i] ? { color: colors[i] } : undefined}>{word}</span>
    </Fragment>
  ))
}
