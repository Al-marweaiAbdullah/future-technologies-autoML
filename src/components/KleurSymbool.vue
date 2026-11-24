<script setup>
// Elke kleur heeft een eigen vorm, zodat de kleur ook zonder kleurzicht herkenbaar is.
// `wit`: vorm in wit tekenen (op een gekleurde achtergrond).
import { computed } from 'vue'
const props = defineProps({
  kleur: { type: String, required: true },
  grootte: { type: Number, default: 120 },
  wit: { type: Boolean, default: false },
})
const vul = computed(() => (props.wit ? '#fff' : `var(--${props.kleur.toLowerCase()})`))
</script>

<template>
  <svg :width="grootte" :height="grootte" viewBox="0 0 100 100" role="img" :aria-label="kleur">
    <polygon v-if="kleur === 'Rood'" points="50,6 96,90 4,90" :fill="vul" stroke-linejoin="round" />
    <circle v-else-if="kleur === 'Blauw'" cx="50" cy="50" r="45" :fill="vul" />
    <rect v-else-if="kleur === 'Groen'" x="8" y="8" width="84" height="84" rx="10" :fill="vul" />
    <polygon
      v-else-if="kleur === 'Geel'"
      points="50,3 62,37 98,37 69,59 80,95 50,73 20,95 31,59 2,37 38,37"
      :fill="vul"
    />
    <g v-else-if="kleur === 'Wild'">
      <path d="M50 50 L50 5 A45 45 0 0 1 95 50 Z" fill="var(--rood)" />
      <path d="M50 50 L95 50 A45 45 0 0 1 50 95 Z" fill="var(--geel)" />
      <path d="M50 50 L50 95 A45 45 0 0 1 5 50 Z" fill="var(--groen)" />
      <path d="M50 50 L5 50 A45 45 0 0 1 50 5 Z" fill="var(--blauw)" />
    </g>
    <circle v-else cx="50" cy="50" r="42" fill="none" stroke="var(--lijn)" stroke-width="5" stroke-dasharray="9 9" />
  </svg>
</template>
