import { computed, reactive, watch } from 'vue'

// Een spel tot 500 punten (officiële UNO regel). Bewaard in localStorage,
// zodat een spel niet verloren gaat als de pagina herlaadt.
const SLEUTEL = 'uno-spel'
export const DOEL = 500

function leeg() {
  return { spelers: [], rondes: [], bezig: false }
}

function lees() {
  try {
    return { ...leeg(), ...JSON.parse(localStorage.getItem(SLEUTEL) ?? '{}') }
  } catch {
    return leeg()
  }
}

export const spel = reactive(lees())

watch(
  spel,
  (v) => {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify(v))
    } catch {
      /* private modus */
    }
  },
  { deep: true },
)

export const stand = computed(() =>
  spel.spelers
    .map((naam) => ({
      naam,
      punten: spel.rondes.filter((r) => r.winnaar === naam).reduce((s, r) => s + r.punten, 0),
    }))
    .sort((a, b) => b.punten - a.punten),
)

export const winnaar = computed(() => stand.value.find((s) => s.punten >= DOEL) ?? null)

export function startSpel(namen) {
  spel.spelers = namen
  spel.rondes = []
  spel.bezig = true
}

export function voegRondeToe(winnaarNaam, kaarten) {
  const punten = kaarten.reduce((s, k) => s + k.punten, 0)
  spel.rondes.push({ winnaar: winnaarNaam, punten, kaarten })
  return punten
}

export function stopSpel() {
  Object.assign(spel, leeg())
}

// Vaste kleur per speler (volgorde van invoer), zodat iedereen zichzelf terugvindt.
const KLEUREN = ['rood', 'blauw', 'groen', 'geel']
export function kleurVan(naam) {
  const i = spel.spelers.indexOf(naam)
  return KLEUREN[(i < 0 ? 0 : i) % KLEUREN.length]
}
