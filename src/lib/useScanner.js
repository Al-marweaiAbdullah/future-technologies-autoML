import { onBeforeUnmount, ref } from 'vue'
import { knipMidden, startCamera, stopCamera } from './camera'
import { laadModel } from './modellen'

/**
 * Herbruikbare scanner: camera + model + voorspellingslus.
 *
 * `fractie`   ref met de grootte van het kader (zie knipMidden).
 * `zoomen`    true = per frame op 3 zoomniveaus rond `fractie` voorspellen en het
 *             niveau kiezen waar het model het zekerst een kaart ziet. Zo hoeft de
 *             afstand tot de kaart minder exact te zijn (nodig voor het waardemodel).
 * `leeg`      naam van de klasse zonder kaart.
 * `opFrame(voorspellingen, gekozenFractie)` wordt ongeveer 5 keer per seconde opgeroepen.
 */
export function useScanner({ modelNaam, fractie, opFrame, zoomen = false, leeg = 'Geen kaart' }) {
  const video = ref(null)
  const voorbeeld = ref(null) // optioneel <canvas>: toont wat het model ziet
  const status = ref('uit') // uit | laden | actief | fout
  const fout = ref('')

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 224

  let stream = null
  let model = null
  let actief = false

  // hoogste kans op een echte kaart (alles behalve "Geen kaart")
  const kaartKans = (p) => Math.max(...p.filter((x) => x.className !== leeg).map((x) => x.probability))

  async function voorspel(v, f) {
    knipMidden(v, canvas, f)
    return model.predict(canvas)
  }

  async function lus() {
    if (!actief) return
    const v = video.value
    if (v && v.readyState >= 2) {
      const basis = fractie.value
      const niveaus = zoomen ? [basis, basis * 0.7, basis * 1.4].map((f) => Math.min(1, Math.max(0.05, f))) : [basis]

      let beste = null
      for (const f of niveaus) {
        const p = await voorspel(v, f)
        const kans = kaartKans(p)
        if (!beste || kans > beste.kans) beste = { p, f, kans }
      }
      // het canvas bevat nu het laatste niveau: teken het gekozen niveau opnieuw voor het voorbeeld
      if (voorbeeld.value) {
        knipMidden(v, voorbeeld.value, beste.f)
      }
      opFrame(beste.p, beste.f)
    }
    setTimeout(lus, 120)
  }

  async function start() {
    status.value = 'laden'
    fout.value = ''
    try {
      ;[model, stream] = await Promise.all([laadModel(modelNaam), startCamera(video.value)])
      actief = true
      status.value = 'actief'
      lus()
    } catch (e) {
      status.value = 'fout'
      fout.value =
        e?.name === 'NotAllowedError'
          ? 'Geen toegang tot de camera. Sta het toe in je browserinstellingen.'
          : e?.message || String(e)
    }
  }

  function stop() {
    actief = false
    stopCamera(stream)
    stream = null
    status.value = 'uit'
  }

  onBeforeUnmount(stop)
  return { video, voorbeeld, status, fout, start, stop }
}
