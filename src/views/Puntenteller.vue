<script setup>
import { computed, ref, watch } from 'vue'
import CameraKader from '../components/CameraKader.vue'
import Debug from '../components/Debug.vue'
import KleurSymbool from '../components/KleurSymbool.vue'
import { tril, zeg } from '../lib/feedback'
import { instellingen } from '../lib/instellingen'
import { puntenVoor } from '../lib/modellen'
import { bewaarRonde } from '../lib/scores'
import { DOEL, kleurVan, spel, stand, startSpel, stopSpel, voegRondeToe, winnaar } from '../lib/spel'
import { maakStabiel } from '../lib/stabiel'
import { useScanner } from '../lib/useScanner'

const VORM = { rood: 'Rood', blauw: 'Blauw', groen: 'Groen', geel: 'Geel' }

/* ---------- Spel starten ---------- */
const nieuweNaam = ref('')
const namen = ref([])
function naamToevoegen() {
  const n = nieuweNaam.value.trim().slice(0, 20)
  if (n && !namen.value.includes(n) && namen.value.length < 8) namen.value.push(n)
  nieuweNaam.value = ''
}
function begin() {
  startSpel([...namen.value])
  rondeWinnaar.value = namen.value[0]
  namen.value = []
}

/* ---------- Ronde ---------- */
const rondeWinnaar = ref(spel.spelers[0] ?? '')
const kaarten = ref([])
const totaal = computed(() => kaarten.value.reduce((s, k) => s + k.punten, 0))
const zwevend = ref([]) // "+20" animaties
let teller = 0

function kaartToevoegen(label, punten, bron) {
  const id = ++teller
  kaarten.value.push({ id, label, punten, bron })
  zwevend.value.push({ id, tekst: `+${punten}` })
  setTimeout(() => (zwevend.value = zwevend.value.filter((z) => z.id !== id)), 900)
}
function naam(k) {
  if (k.bron === 'zelf' && k.label === 'Zelf') return 'Zelf ingevuld'
  return k.label === 'Actie' ? 'Actiekaart' : k.label === 'Wild' ? 'Zwarte kaart' : `Cijfer ${k.label}`
}

/* ---------- Zelf invullen ---------- */
const modus = ref('zelf') // 'zelf' | 'scan'
const eigenGetal = ref('')
const KNOPPEN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
function eigenToevoegen() {
  const n = Math.round(Number(eigenGetal.value))
  if (n > 0 && n <= 500) kaartToevoegen('Zelf', n, 'zelf')
  eigenGetal.value = ''
}

/* ---------- Scannen ---------- */
const fractie = ref(0.18)
const voorspellingen = ref([])
const voortgang = ref(0)
const stabiel = maakStabiel({ drempel: () => instellingen.drempel, duur: 1000, vereisLeeg: true })

const { video, voorbeeld, status, fout, start, stop } = useScanner({
  modelNaam: 'waarde',
  fractie,
  zoomen: true,
  opFrame(p) {
    voorspellingen.value = p
    const r = stabiel(p)
    voortgang.value = r.top.className === 'Geen kaart' ? 0 : r.voortgang
    if (r.nieuw) {
      const punten = puntenVoor(r.nieuw)
      kaartToevoegen(r.nieuw, punten, 'scan')
      tril()
      zeg(`${punten} punten`)
    }
  },
})
watch(modus, (m) => m === 'zelf' && stop())

/* ---------- Ronde afsluiten ---------- */
const bericht = ref('')
const bezig = ref(false)
const feest = ref(false)

async function rondeAfsluiten() {
  if (!rondeWinnaar.value || !kaarten.value.length) return
  bezig.value = true
  const lijst = kaarten.value.map((k) => (k.bron === 'zelf' ? `${k.label} (zelf)` : k.label))
  const punten = voegRondeToe(rondeWinnaar.value, kaarten.value)
  kaarten.value = []
  bericht.value = `+${punten} voor ${rondeWinnaar.value}`
  try {
    await bewaarRonde({ speler: rondeWinnaar.value, punten, kaarten: lijst })
  } catch (e) {
    bericht.value += `. Niet online bewaard: ${e?.message ?? e}`
  } finally {
    bezig.value = false
  }
  if (winnaar.value) {
    feest.value = true
    stop()
    zeg(`${winnaar.value.naam} wint het spel`)
  }
}

function nieuwSpel() {
  if (!feest.value && !confirm('Het huidige spel stoppen? De tussenstand gaat verloren.')) return
  feest.value = false
  stop()
  stopSpel()
  kaarten.value = []
  bericht.value = ''
}

// confetti: de vier vormen, willekeurig verspreid
const confetti = Array.from({ length: 28 }, (_, i) => ({
  vorm: ['Rood', 'Blauw', 'Groen', 'Geel'][i % 4],
  x: Math.random() * 100,
  d: Math.random() * 0.8,
  r: Math.random() * 720 - 360,
  s: 16 + Math.random() * 22,
}))
</script>

<template>
  <main class="pagina">
    <a href="#/" class="terug">‹ Terug</a>

    <!-- ============ Nieuw spel ============ -->
    <template v-if="!spel.bezig">
      <h2>Spel tot {{ DOEL }}</h2>
      <p class="uitleg">
        Wie een ronde wint, krijgt de punten van de kaarten die de anderen nog vasthebben. Wie eerst {{ DOEL }} punten
        heeft, wint het spel.
      </p>

      <form class="spelers-invoer" @submit.prevent="naamToevoegen">
        <input v-model="nieuweNaam" class="invoer" maxlength="20" placeholder="Naam van een speler" />
        <button class="knop plus" :disabled="!nieuweNaam.trim()" aria-label="Speler toevoegen">+</button>
      </form>

      <TransitionGroup name="chip" tag="ul" class="chips">
        <li v-for="(n, i) in namen" :key="n" class="chip">
          <KleurSymbool :kleur="Object.values(VORM)[i % 4]" :grootte="18" />
          {{ n }}
          <button aria-label="Verwijder" @click="namen.splice(i, 1)">×</button>
        </li>
      </TransitionGroup>
      <p v-if="namen.length < 2" class="hint">Voeg minstens 2 spelers toe.</p>

      <button class="knop" :disabled="namen.length < 2" @click="begin">Spel starten</button>
    </template>

    <!-- ============ Spel bezig ============ -->
    <template v-else>
      <h2>Tussenstand</h2>

      <ol class="stand">
        <li v-for="s in stand" :key="s.naam" :class="`k-${kleurVan(s.naam)}`">
          <div class="stand-kop">
            <KleurSymbool :kleur="VORM[kleurVan(s.naam)]" :grootte="22" />
            <strong>{{ s.naam }}</strong>
            <span class="score">{{ s.punten }}</span>
          </div>
          <div class="baan"><div class="vulling" :style="{ transform: `scaleX(${Math.min(1, s.punten / DOEL)})` }" /></div>
        </li>
      </ol>

      <section class="ronde">
        <h3>Wie won deze ronde?</h3>
        <div class="kies">
          <button
            v-for="n in spel.spelers"
            :key="n"
            :class="['optie', `k-${kleurVan(n)}`, { gekozen: rondeWinnaar === n }]"
            @click="rondeWinnaar = n"
          >
            {{ n }}
          </button>
        </div>

        <h3>Kaarten van de anderen</h3>
        <div class="tabs" role="tablist">
          <button role="tab" :aria-selected="modus === 'zelf'" :class="{ actief: modus === 'zelf' }" @click="modus = 'zelf'">
            Zelf invullen
          </button>
          <button role="tab" :aria-selected="modus === 'scan'" :class="{ actief: modus === 'scan' }" @click="modus = 'scan'">
            Scannen
          </button>
        </div>

        <!-- Zelf invullen -->
        <div v-show="modus === 'zelf'" class="toetsen">
          <button v-for="k in KNOPPEN" :key="k" class="toets" @click="kaartToevoegen(k, Number(k), 'zelf')">{{ k }}</button>
          <button class="toets breed actie" @click="kaartToevoegen('Actie', 20, 'zelf')">
            Actiekaart <small>+20</small>
          </button>
          <button class="toets breed wild" @click="kaartToevoegen('Wild', 50, 'zelf')">
            Zwarte kaart <small>+50</small>
          </button>
          <form class="eigen" @submit.prevent="eigenToevoegen">
            <input
              v-model="eigenGetal"
              class="invoer"
              type="number"
              inputmode="numeric"
              min="1"
              max="500"
              placeholder="Ander aantal punten"
            />
            <button class="knop plus" :disabled="!eigenGetal" aria-label="Punten toevoegen">+</button>
          </form>
        </div>

        <!-- Scannen -->
        <div v-show="modus === 'scan'">
          <p class="uitleg klein">Richt het kader op het cijfer in de hoek van de kaart, zodat het cijfer het kader vult.</p>
          <CameraKader :fractie="fractie" :voortgang="voortgang" :actief="status === 'actief'">
            <video ref="video" playsinline muted autoplay />
            <template #overlay>
              <button v-if="status !== 'actief'" class="knop groot midden" :disabled="status === 'laden'" @click="start">
                {{ status === 'laden' ? 'Model laden…' : 'Camera starten' }}
              </button>
              <figure v-show="status === 'actief'" class="ziet">
                <canvas ref="voorbeeld" width="224" height="224" />
                <figcaption>Model ziet</figcaption>
              </figure>
            </template>
          </CameraKader>
          <p v-if="fout" class="fout">{{ fout }}</p>
          <div class="instellingen">
            <label>
              Kadergrootte {{ Math.round(fractie * 100) }}%
              <input v-model.number="fractie" type="range" min="0.08" max="0.5" step="0.01" />
            </label>
          </div>
          <Debug v-if="instellingen.voorspellingen" :voorspellingen="voorspellingen" />
        </div>

        <!-- Ronde totaal -->
        <div class="rondetotaal">
          <span>Deze ronde</span>
          <strong :key="totaal" class="bump">{{ totaal }}</strong>
          <TransitionGroup name="zweef" tag="div" class="zwevers">
            <span v-for="z in zwevend" :key="z.id" class="zweef">{{ z.tekst }}</span>
          </TransitionGroup>
        </div>
        <TransitionGroup name="kaart" tag="ul" class="kaarten">
          <li v-for="(k, i) in kaarten" :key="k.id">
            <span>{{ naam(k) }}</span>
            <small>{{ k.bron === 'scan' ? 'gescand' : 'zelf' }}</small>
            <span class="pt">+{{ k.punten }}</span>
            <button class="x" aria-label="Verwijder" @click="kaarten.splice(i, 1)">×</button>
          </li>
        </TransitionGroup>

        <button class="knop" :disabled="bezig || !kaarten.length || !rondeWinnaar" @click="rondeAfsluiten">
          {{ kaarten.length ? `${totaal} punten geven aan ${rondeWinnaar}` : 'Voeg eerst kaarten toe' }}
        </button>
        <p v-if="bericht" class="bericht">{{ bericht }}</p>
      </section>

      <button class="knop klein stop" @click="nieuwSpel">Spel stoppen</button>
    </template>

    <!-- ============ Winnaar ============ -->
    <Transition name="feest">
      <div v-if="feest && winnaar" class="feest" role="dialog" aria-modal="true">
        <span
          v-for="(c, i) in confetti"
          :key="i"
          class="snipper"
          :style="{ left: c.x + '%', animationDelay: c.d + 's', '--r': c.r + 'deg' }"
        >
          <KleurSymbool :kleur="c.vorm" :grootte="c.s" />
        </span>
        <div class="feest-kaart">
          <KleurSymbool :kleur="VORM[kleurVan(winnaar.naam)]" :grootte="72" />
          <h2>{{ winnaar.naam }} wint!</h2>
          <p>{{ winnaar.punten }} punten na {{ spel.rondes.length }} rondes</p>
          <button class="knop" @click="nieuwSpel">Nieuw spel</button>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.uitleg {
  color: var(--dim);
  font-size: 17px;
  line-height: 1.4;
  margin-top: 0;
}
.uitleg.klein {
  font-size: 15px;
}
.hint {
  color: var(--dim);
  font-size: 14px;
}

/* --- spelers toevoegen --- */
.spelers-invoer,
.eigen {
  display: flex;
  gap: 10px;
}
.knop.plus {
  width: 56px;
  flex: none;
  padding: 0;
  font-size: 26px;
}
.chips {
  list-style: none;
  padding: 0;
  margin: 14px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  background: var(--vlak);
  border-radius: 999px;
  font-weight: 700;
}
.chip button {
  border: 0;
  background: var(--bg);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 16px;
  color: var(--dim);
}
.chip-enter-active {
  transition: all 0.35s var(--veer);
}
.chip-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.chip-leave-active {
  transition: all 0.15s;
}
.chip-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* --- tussenstand --- */
.k-rood {
  --c: var(--rood);
}
.k-blauw {
  --c: var(--blauw);
}
.k-groen {
  --c: var(--groen);
}
.k-geel {
  --c: var(--geel);
}
.stand {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
  display: grid;
  gap: 14px;
}
.stand-kop {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
}
.score {
  margin-left: auto;
  font-size: 28px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.baan {
  margin-top: 6px;
  height: 12px;
  border-radius: 6px;
  background: var(--lijn);
  overflow: hidden;
}
.vulling {
  height: 100%;
  background: var(--c);
  transform-origin: left;
  transition: transform 0.8s var(--veer);
}

/* --- ronde --- */
.ronde {
  background: var(--vlak);
  border-radius: var(--r-groot);
  padding: 20px 18px;
  display: grid;
  gap: 12px;
}
.ronde h3 {
  font-size: 22px;
  margin: 6px 0 0;
}
.kies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.optie {
  font: inherit;
  font-weight: 700;
  font-size: 16px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 2px solid var(--lijn);
  background: var(--vlak);
  color: var(--inkt);
  transition:
    transform 0.25s var(--veer),
    background 0.2s;
}
.optie.gekozen {
  background: var(--c);
  border-color: var(--c);
  color: #fff;
  transform: scale(1.06);
}
.optie.k-geel.gekozen {
  color: var(--inkt);
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg);
  border-radius: 999px;
  padding: 4px;
}
.tabs button {
  font: inherit;
  font-weight: 700;
  border: 0;
  background: none;
  padding: 10px;
  border-radius: 999px;
  color: var(--dim);
  transition: background 0.2s;
}
.tabs button.actief {
  background: var(--vlak);
  color: var(--inkt);
  box-shadow: 0 1px 4px rgb(20 24 40 / 0.12);
}

/* toetsenbord */
.toetsen {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.toets {
  font: inherit;
  font-size: 24px;
  font-weight: 800;
  aspect-ratio: 1;
  border: 0;
  border-radius: var(--r-mid);
  background: var(--bg);
  color: var(--inkt);
  transition: transform 0.2s var(--veer);
}
.toets:active {
  transform: scale(0.88);
}
.toets.breed {
  grid-column: span 5;
  aspect-ratio: auto;
  padding: 14px;
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toets small {
  font-size: 18px;
}
.toets.actie {
  background: var(--blauw);
  color: #fff;
}
.toets.wild {
  background: var(--inkt);
  color: #fff;
}
.eigen {
  grid-column: span 5;
}

.ziet {
  position: absolute;
  right: 12px;
  top: 12px;
  margin: 0;
  display: grid;
  gap: 4px;
  justify-items: center;
}
.ziet canvas {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 3px solid #fff;
}
.ziet figcaption {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px #000;
}

/* ronde totaal + zwevende punten */
.rondetotaal {
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 8px;
  font-weight: 700;
  color: var(--dim);
}
.rondetotaal strong {
  font-size: 48px;
  color: var(--inkt);
  font-variant-numeric: tabular-nums;
}
.bump {
  animation: bump 0.35s var(--veer);
}
@keyframes bump {
  from {
    transform: scale(1.25);
  }
}
.zwevers {
  position: absolute;
  right: 0;
  top: 0;
  pointer-events: none;
}
.zweef {
  position: absolute;
  right: 0;
  top: -6px;
  font-size: 22px;
  font-weight: 800;
  color: var(--groen);
  animation: zweef 0.9s ease-out forwards;
}
@keyframes zweef {
  to {
    transform: translateY(-46px);
    opacity: 0;
  }
}
.kaarten {
  list-style: none;
  padding: 0;
  margin: 0;
}
.kaarten li {
  display: grid;
  grid-template-columns: 1fr auto auto 32px;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 2px solid var(--bg);
  font-weight: 600;
}
.kaarten small {
  color: var(--dim);
  font-weight: 500;
}
.pt {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}
.x {
  border: 0;
  background: none;
  color: var(--dim);
  font-size: 24px;
}
.kaart-enter-active {
  transition: all 0.3s var(--veer);
}
.kaart-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.kaart-leave-active {
  transition: all 0.15s;
}
.kaart-leave-to {
  opacity: 0;
}
.bericht {
  margin: 0;
  color: var(--dim);
  font-weight: 600;
}
.stop {
  margin-top: 18px;
}

/* winnaar */
.feest {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(21 23 31 / 0.75);
  overflow: hidden;
}
.feest-kaart {
  position: relative;
  background: var(--vlak);
  border-radius: var(--r-groot);
  padding: 30px 24px 24px;
  text-align: center;
  width: min(100%, 360px);
  animation: binnen 0.6s var(--veer);
}
.feest-kaart h2 {
  margin: 14px 0 8px;
}
.feest-kaart p {
  color: var(--dim);
  margin: 0 0 20px;
}
@keyframes binnen {
  from {
    transform: scale(0.6) rotate(-6deg);
    opacity: 0;
  }
}
.snipper {
  position: absolute;
  top: -40px;
  animation: val 2.6s cubic-bezier(0.3, 0.6, 0.6, 1) forwards;
}
@keyframes val {
  to {
    transform: translateY(110vh) rotate(var(--r));
  }
}
.feest-enter-active,
.feest-leave-active {
  transition: opacity 0.25s;
}
.feest-enter-from,
.feest-leave-to {
  opacity: 0;
}
</style>
