<script setup>
import { ref } from 'vue'
import CameraKader from '../components/CameraKader.vue'
import Debug from '../components/Debug.vue'
import KleurSymbool from '../components/KleurSymbool.vue'
import { tril, zeg } from '../lib/feedback'
import { instellingen } from '../lib/instellingen'
import { maakStabiel } from '../lib/stabiel'
import { useScanner } from '../lib/useScanner'

const UITLEG = {
  Rood: { naam: 'Rood', zin: 'Rood' },
  Blauw: { naam: 'Blauw', zin: 'Blauw' },
  Groen: { naam: 'Groen', zin: 'Groen' },
  Geel: { naam: 'Geel', zin: 'Geel' },
  Wild: { naam: 'Zwart', zin: 'Zwarte kaart, je kiest zelf een kleur' },
}
const LEGENDE = ['Rood', 'Blauw', 'Groen', 'Geel']

const fractie = ref(0.8)
const voorspellingen = ref([])
const voortgang = ref(0)
const kleur = ref(null) // laatst bevestigde kleur

const stabiel = maakStabiel({ drempel: () => instellingen.drempel, duur: 800 })

const { video, status, fout, start, stop } = useScanner({
  modelNaam: 'kleur',
  fractie,
  opFrame(p) {
    voorspellingen.value = p
    const r = stabiel(p)
    voortgang.value = r.top.className === 'Geen kaart' ? 0 : r.voortgang
    if (r.top.className === 'Geen kaart' && r.voortgang === 1) kleur.value = null
    if (r.nieuw && r.nieuw !== 'Geen kaart') {
      kleur.value = r.nieuw
      tril()
      zeg(UITLEG[r.nieuw].zin)
    }
  },
})

function aanzetten() {
  zeg('Kleurhulp aan') // iOS laat spraak pas toe na een tik
  start()
}
</script>

<template>
  <main class="pagina">
    <a href="#/" class="terug">‹ Terug</a>
    <h2>Kleur scannen</h2>

    <CameraKader :fractie="fractie" :voortgang="voortgang" :actief="status === 'actief'">
      <video ref="video" playsinline muted autoplay />
      <template #overlay>
        <button v-if="status !== 'actief'" class="knop groot midden" :disabled="status === 'laden'" @click="aanzetten">
          {{ status === 'laden' ? 'Model laden…' : 'Camera starten' }}
        </button>
      </template>
    </CameraKader>

    <p v-if="fout" class="fout">{{ fout }}</p>

    <!-- Het resultaat: de hele kaart kleurt mee, de vorm bevestigt de kleur -->
    <section class="resultaat" :class="kleur ? `k-${kleur.toLowerCase()}` : 'leeg'" aria-live="polite">
      <Transition name="pop" mode="out-in">
        <div :key="kleur ?? 'leeg'" class="inhoud">
          <KleurSymbool :kleur="kleur ?? 'leeg'" :grootte="112" :wit="kleur && kleur !== 'Wild'" />
          <div>
            <div class="naam">{{ kleur ? UITLEG[kleur].naam : 'Geen kaart' }}</div>
            <div class="sub">{{ kleur === 'Wild' ? 'Je kiest zelf een kleur' : kleur ? '' : 'Hou een kaart in het kader' }}</div>
          </div>
        </div>
      </Transition>
    </section>

    <ul class="legende" aria-label="Welke vorm hoort bij welke kleur">
      <li v-for="k in LEGENDE" :key="k"><KleurSymbool :kleur="k" :grootte="20" /> {{ k }}</li>
    </ul>

    <div class="instellingen">
      <label>
        Kadergrootte {{ Math.round(fractie * 100) }}%
        <input v-model.number="fractie" type="range" min="0.3" max="1" step="0.05" />
      </label>
      <button v-if="status === 'actief'" class="knop klein" @click="stop">Camera stoppen</button>
    </div>

    <Debug v-if="instellingen.voorspellingen" :voorspellingen="voorspellingen" />
  </main>
</template>

<style scoped>
.resultaat {
  margin: 16px 0 12px;
  border-radius: var(--r-groot);
  min-height: 160px;
  display: grid;
  align-items: center;
  padding: 22px;
  transition: background-color 0.35s ease;
  background: var(--vlak);
  color: var(--inkt);
}
.k-rood {
  background: var(--rood);
  color: #fff;
}
.k-blauw {
  background: var(--blauw);
  color: #fff;
}
.k-groen {
  background: var(--groen);
  color: #fff;
}
.k-geel {
  background: var(--geel);
  color: var(--inkt);
}
.k-wild {
  background: var(--inkt);
  color: #fff;
}
/* geel is licht: een donkere vorm leest beter dan wit */
.k-geel :deep(polygon) {
  fill: var(--inkt);
}
.inhoud {
  display: flex;
  align-items: center;
  gap: 20px;
}
.naam {
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.9;
}
.leeg .naam {
  font-size: 32px;
  color: var(--dim);
}
.sub {
  margin-top: 6px;
  font-size: 16px;
  opacity: 0.85;
}
.pop-enter-active {
  transition:
    transform 0.45s var(--veer),
    opacity 0.2s;
}
.pop-leave-active {
  transition: opacity 0.12s;
}
.pop-enter-from {
  transform: scale(0.7) rotate(-8deg);
  opacity: 0;
}
.pop-leave-to {
  opacity: 0;
}
.legende {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: var(--dim);
}
.legende li {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
