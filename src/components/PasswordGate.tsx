import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { tryUnlock } from '@/lib/unlock'

// Shown below the splash when the site is locked. On success the unlock store
// flips and the whole app re-renders to reveal the details.
export function PasswordGate() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim() || checking) return
    setChecking(true)
    const ok = await tryUnlock(value)
    if (!ok) {
      setError(true)
      setChecking(false)
    }
    // On success the store emits and this component unmounts with the reveal.
  }

  return (
    <section className="gate" aria-label="Enter the password">
      <motion.div
        className="gate-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <p className="gate-kicker">A Private Celebration</p>
        <h2 className="gate-title">Just for our guests</h2>
        <div className="home-ornament" aria-hidden="true" />
        <p className="gate-blurb">
          Enter the password Abha &amp; Udit shared with you to see the schedule,
          travel, where to stay, and more.
        </p>

        <motion.form
          className="gate-form"
          onSubmit={onSubmit}
          animate={error ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <input
            type="password"
            className="gate-input"
            placeholder="Password"
            aria-label="Password"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(false)
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={checking}>
            {checking ? 'Checking…' : 'Enter'}
          </button>
        </motion.form>

        <p className={`gate-error ${error ? 'is-shown' : ''}`} role="alert">
          {error ? "That password didn't match. Give it another try." : ' '}
        </p>
      </motion.div>
    </section>
  )
}
