<script setup>
import { onMounted, ref } from 'vue'
import { backendNaam, haalKlassement } from '../lib/scores'

const rijen = ref([])
const fout = ref('')
const laden = ref(true)

onMounted(async () => {
  try {
    rijen.value = await haalKlassement()
  } catch (e) {
    fout.value = e?.message ?? String(e)
  } finally {
    laden.value = false
  }
})
</script>

<template>
  <main class="pagina">
    <a href="#/" class="terug">‹ Terug</a>
    <h2>Klassement</h2>
    <p class="bron">Scores bewaard {{ backendNaam }}</p>

    <p v-if="laden">Laden…</p>
    <p v-else-if="fout" class="fout">{{ fout }}</p>
    <div v-else-if="!rijen.length" class="leeg">
      <p>Nog geen rondes gespeeld. Na elke ronde verschijnen de punten hier.</p>
      <a href="#/punten" class="knop">Spel starten</a>
    </div>

    <ol v-else>
      <li v-for="(r, i) in rijen" :key="r.speler" :class="{ eerste: i === 0 }">
        <span class="plaats">{{ i + 1 }}</span>
        <span class="naam">{{ r.speler }}</span>
        <span class="rondes">{{ r.rondes }} {{ r.rondes === 1 ? 'ronde' : 'rondes' }}</span>
        <strong>{{ r.totaal }}</strong>
      </li>
    </ol>
  </main>
</template>

<style scoped>
.bron {
  color: var(--dim);
}
.leeg p {
  font-size: 17px;
  color: var(--dim);
}
.leeg .knop {
  display: block;
  text-align: center;
  text-decoration: none;
}
li.eerste {
  background: var(--geel);
  padding: 20px 16px;
}
li.eerste strong {
  font-size: 30px;
}
li.eerste .plaats,
li.eerste .rondes {
  color: var(--inkt);
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
li {
  display: grid;
  grid-template-columns: 32px 1fr auto 64px;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--kaart);
}
.plaats {
  color: var(--dim);
}
.naam {
  font-weight: 600;
}
.rondes {
  color: var(--dim);
  font-size: 13px;
}
strong {
  text-align: right;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
</style>
