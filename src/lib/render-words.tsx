// Wrap each word in a span so individual word gaps and per-word vibe accents
// can be targeted from CSS (matching the reference artwork). Word index 1 gets
// the secondary accent, index 2 the tertiary.
export function renderWords(text: string, accentIndexes: number[] = []) {
  return text.split(' ').map((word, index) => (
    <span
      className={
        accentIndexes.includes(index)
          ? index === 1
            ? 'vibe-accent-2'
            : 'vibe-accent-3'
          : undefined
      }
      key={`${text}-${word}-${index}`}
    >
      {index > 0 ? ' ' : ''}
      {word}
    </span>
  ))
}
