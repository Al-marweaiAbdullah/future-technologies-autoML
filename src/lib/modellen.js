import * as tmImage from '@teachablemachine/image'

// Beide modellen zijn getraind in Teachable Machine en geëxporteerd naar TensorFlow.js.
// Ze staan in public/models/<naam>/ en draaien volledig lokaal in de browser.
const cache = {}

export function laadModel(naam) {
  const basis = `${import.meta.env.BASE_URL}models/${naam}/`
  cache[naam] ??= tmImage.load(basis + 'model.json', basis + 'metadata.json')
  return cache[naam]
}

// Officiële UNO puntentelling: cijferkaart = waarde, actiekaart = 20, zwarte kaart = 50.
export function puntenVoor(label) {
  if (label === 'Actie') return 20
  if (label === 'Wild') return 50
  const n = Number(label)
  return Number.isInteger(n) ? n : 0
}
