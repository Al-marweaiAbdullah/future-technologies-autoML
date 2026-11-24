// Spraak en trillen als extra feedback naast het scherm. Beide volgen de instellingen.
import { instellingen } from './instellingen'

export function zeg(tekst, { altijd = false } = {}) {
  if (!altijd && !instellingen.geluid) return
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(tekst)
  u.lang = 'nl-BE'
  const stem = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('nl'))
  if (stem) u.voice = stem
  speechSynthesis.speak(u)
}

// Werkt op Android, iOS Safari ondersteunt trillen niet.
export function tril(ms = 80) {
  if (instellingen.trillen) navigator.vibrate?.(ms)
}
