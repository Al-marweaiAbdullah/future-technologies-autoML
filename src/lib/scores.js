import { createClient } from '@supabase/supabase-js'

// Scores gaan naar Supabase als .env ingevuld is, anders naar localStorage (handig om te testen).
// We bewaren enkel naam, punten en de herkende labels. Nooit beelden.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const sb = url && key ? createClient(url, key) : null

export const backendNaam = sb ? 'in Supabase' : 'in deze browser'

const LS = 'uno-scores'
const lokaal = () => {
  try {
    return JSON.parse(localStorage.getItem(LS) ?? '[]')
  } catch {
    return []
  }
}

export async function bewaarRonde({ speler, punten, kaarten }) {
  const rij = { speler: speler.trim().slice(0, 30), punten, kaarten }
  if (sb) {
    const { error } = await sb.from('scores').insert(rij)
    if (error) throw error
    return
  }
  try {
    localStorage.setItem(LS, JSON.stringify([...lokaal(), { ...rij, created_at: new Date().toISOString() }]))
  } catch {
    throw new Error('Opslaan in de browser lukte niet.')
  }
}

export async function haalKlassement() {
  let rijen
  if (sb) {
    const { data, error } = await sb.from('scores').select('speler, punten').limit(1000)
    if (error) throw error
    rijen = data
  } else {
    rijen = lokaal()
  }
  const perSpeler = {}
  for (const { speler, punten } of rijen) {
    perSpeler[speler] ??= { speler, totaal: 0, rondes: 0 }
    perSpeler[speler].totaal += punten
    perSpeler[speler].rondes += 1
  }
  return Object.values(perSpeler).sort((a, b) => b.totaal - a.totaal)
}
