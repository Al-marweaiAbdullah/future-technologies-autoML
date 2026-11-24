import { reactive, watch } from 'vue'

// Instellingen worden per toestel bewaard in localStorage.
const SLEUTEL = 'uno-instellingen'

const standaard = {
  geluid: false, // kleur of punten luidop zeggen
  trillen: true, // korte trilling bij herkenning (enkel Android)
  voorspellingen: true, // top 3 voorspellingen tonen (handig om te testen)
  drempel: 0.9, // minimale zekerheid voor een herkenning
}

function lees() {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL) ?? '{}')
  } catch {
    return {}
  }
}

export const instellingen = reactive({ ...standaard, ...lees() })

watch(
  instellingen,
  (v) => {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify(v))
    } catch {
      /* bv. private modus: dan gewoon niet bewaren */
    }
  },
  { deep: true },
)

export function herstel() {
  Object.assign(instellingen, standaard)
}
