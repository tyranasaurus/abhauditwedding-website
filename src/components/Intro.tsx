import { intro } from '@/data/events'

export function Intro() {
  return (
    <section className="intro-page" aria-labelledby="wardrobe-title">
      <div className="intro-frame">
        <img
          src="/art/barn.webp"
          alt=""
          className="barn-watercolor"
          width={1400}
          height={1400}
          fetchPriority="high"
        />

        <div className="intro-copy">
          <h1 id="wardrobe-title">{intro.title}</h1>
          <div className="ornament" aria-hidden="true" />
          <div className="intro-notes">
            {intro.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="signature">{intro.signature}</p>
        </div>
      </div>
    </section>
  )
}
