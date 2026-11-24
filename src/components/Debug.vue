<script setup>
// Toont de 3 hoogste voorspellingen. Handig tijdens het testen en voor je fouttabel.
import { computed } from 'vue'
const props = defineProps({ voorspellingen: { type: Array, default: () => [] } })
const top3 = computed(() => [...props.voorspellingen].sort((a, b) => b.probability - a.probability).slice(0, 3))
</script>

<template>
  <ul class="debug" aria-label="Voorspellingen van het model">
    <li v-for="p in top3" :key="p.className">
      <span>{{ p.className }}</span>
      <span class="bar"><span :style="{ transform: `scaleX(${p.probability})` }" /></span>
      <span class="pct">{{ Math.round(p.probability * 100) }}%</span>
    </li>
  </ul>
</template>

<style scoped>
.debug {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: var(--dim);
}
li {
  display: grid;
  grid-template-columns: 86px 1fr 44px;
  align-items: center;
  gap: 10px;
}
.bar {
  height: 8px;
  background: var(--lijn);
  border-radius: 4px;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--inkt);
  transform-origin: left;
  transition: transform 0.15s linear;
}
.pct {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
