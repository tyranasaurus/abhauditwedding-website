import { useSyncExternalStore } from 'react'

// Light, client-side gate so only guests with the shared password see the
// details. The password is never stored in plain text: we compare the SHA-256
// of what's entered against this known hash, and persist the hash itself in
// localStorage as the "unlocked" token. (This is obfuscation, not hard
// security — the page bundle is still public — but it keeps the wedding
// details off search engines and away from casual visitors.)
const PASSWORD_HASH =
  'b1e1798527df281f68ba3d83a11c28b2b7933bd4a49bed72894e4e7874f79309'
const STORAGE_KEY = 'abhaudit-unlock'

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === PASSWORD_HASH
  } catch {
    return false
  }
}

let unlocked = readStored()
const listeners = new Set<() => void>()

function setUnlocked(next: boolean) {
  if (unlocked === next) return
  unlocked = next
  listeners.forEach((l) => l())
}

/** Hash the candidate password and, if it matches, persist + flip to unlocked. */
export async function tryUnlock(password: string): Promise<boolean> {
  const hash = await sha256Hex(password.trim())
  if (hash !== PASSWORD_HASH) return false
  try {
    localStorage.setItem(STORAGE_KEY, hash)
  } catch {
    // Private mode / storage disabled: still unlock for this session.
  }
  setUnlocked(true)
  return true
}

export function getUnlocked(): boolean {
  return unlocked
}

/** Subscribe to unlock changes (used by useSyncExternalStore). */
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** React hook: re-renders the subscriber whenever the unlock state flips. */
export function useUnlocked(): boolean {
  return useSyncExternalStore(subscribe, getUnlocked, getUnlocked)
}

// If the page was opened via ?password=<pw> (a share link), validate it up
// front, drop the param from the URL, and unlock. Resolves once handled so the
// app can render with the correct state and avoid a locked flash.
export async function consumePasswordParam(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const pw = params.get('password')
  if (pw === null) return
  await tryUnlock(pw)
  const url = new URL(window.location.href)
  url.searchParams.delete('password')
  const clean = url.pathname + url.search + url.hash
  window.history.replaceState({}, '', clean || '/')
}
