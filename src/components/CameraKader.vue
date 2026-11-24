<script setup>
// Wrapper rond het camerabeeld met een kader dat toont welk stuk naar het model gaat.
// De <video> zelf komt via de slot, zodat de pagina er een ref naar kan houden.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  fractie: { type: Number, default: 1 },
  voortgang: { type: Number, default: 0 },
  actief: { type: Boolean, default: false },
})

const root = ref(null)
const maten = ref({ cw: 0, ch: 0, vw: 0, vh: 0 })
let video = null
let observer = null

function meet() {
  const r = root.value
  if (!r) return
  maten.value = { cw: r.clientWidth, ch: r.clientHeight, vw: video?.videoWidth || 0, vh: video?.videoHeight || 0 }
}

// Het kader moet exact overeenkomen met wat knipMidden() uitknipt:
// fractie × kortste zijde van de video, geschaald zoals object-fit: cover dat doet.
const kaderPx = computed(() => {
  const { cw, ch, vw, vh } = maten.value
  if (!vw || !vh) return Math.min(cw, ch) * props.fractie
  const schaal = Math.max(cw / vw, ch / vh)
  return Math.min(vw, vh) * schaal * props.fractie
})

// voortgangsring rond het kader (omtrek van een afgerond vierkant, benaderd)
const omtrek = 400

onMounted(() => {
  video = root.value.querySelector('video')
  video?.addEventListener('loadedmetadata', meet)
  video?.addEventListener('resize', meet)
  observer = new ResizeObserver(meet)
  observer.observe(root.value)
  meet()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  video?.removeEventListener('loadedmetadata', meet)
  video?.removeEventListener('resize', meet)
})
</script>

<template>
  <div ref="root" class="camera" :class="{ aan: actief }">
    <slot />
    <div v-if="actief" class="kader" :class="{ vol: voortgang >= 1 }" :style="{ width: kaderPx + 'px' }">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="2" y="2" width="96" height="96" rx="10" pathLength="400" class="spoor" />
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="10"
          pathLength="400"
          class="ring"
          :style="{ strokeDashoffset: omtrek * (1 - voortgang) }"
        />
      </svg>
    </div>
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.camera {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: var(--r-groot);
  overflow: hidden;
  isolation: isolate;
  /* voor de camera aan staat: de vier kleuren als achtergrond */
  background:
    radial-gradient(circle at 20% 20%, var(--rood) 0 22%, transparent 23%),
    radial-gradient(circle at 80% 30%, var(--blauw) 0 18%, transparent 19%),
    radial-gradient(circle at 30% 80%, var(--groen) 0 20%, transparent 21%),
    radial-gradient(circle at 78% 78%, var(--geel) 0 24%, transparent 25%), var(--inkt);
}
.camera.aan {
  background: #000;
}
.camera :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.kader {
  position: absolute;
  left: 50%;
  top: 50%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 14px;
  box-shadow: 0 0 0 2000px rgb(10 12 20 / 0.5);
  transition:
    width 0.15s,
    scale 0.3s var(--veer);
}
.kader.vol {
  scale: 1.06;
}
.kader svg {
  position: absolute;
  inset: -3px;
  width: calc(100% + 6px);
  height: calc(100% + 6px);
  overflow: visible;
}
.kader rect {
  fill: none;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}
.spoor {
  stroke: rgb(255 255 255 / 0.85);
}
.ring {
  stroke: var(--geel);
  stroke-width: 7;
  stroke-dasharray: 400;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s linear;
}
</style>
