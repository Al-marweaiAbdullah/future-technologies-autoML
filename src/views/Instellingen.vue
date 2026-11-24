<script setup>
import { herstel, instellingen } from '../lib/instellingen'
import { zeg } from '../lib/feedback'

function testGeluid() {
  zeg('Dit is een test', { altijd: true })
}
</script>

<template>
  <main class="pagina">
    <a href="#/" class="terug">‹ Terug</a>
    <h2>Instellingen</h2>

    <section class="groep">
      <label class="rij">
        <span>
          <strong>Geluid</strong>
          <small>Zeg de kleur of de punten luidop</small>
        </span>
        <input v-model="instellingen.geluid" type="checkbox" class="toggle" />
      </label>
      <button class="knop klein" @click="testGeluid">Geluid testen</button>

      <label class="rij">
        <span>
          <strong>Trillen</strong>
          <small>Korte trilling bij een herkenning (enkel Android)</small>
        </span>
        <input v-model="instellingen.trillen" type="checkbox" class="toggle" />
      </label>
    </section>

    <section class="groep">
      <label class="rij">
        <span>
          <strong>Voorspellingen tonen</strong>
          <small>Top 3 van het model onder de camera</small>
        </span>
        <input v-model="instellingen.voorspellingen" type="checkbox" class="toggle" />
      </label>

      <label class="blok">
        <span>
          <strong>Zekerheidsdrempel: {{ Math.round(instellingen.drempel * 100) }}%</strong>
          <small>Een kaart telt pas als het model minstens zo zeker is, 1 seconde lang.</small>
        </span>
        <input v-model.number="instellingen.drempel" type="range" min="0.6" max="0.99" step="0.01" />
      </label>
    </section>

    <button class="knop klein" @click="herstel">Standaardwaarden herstellen</button>
  </main>
</template>

<style scoped>
.groep {
  display: grid;
  gap: 4px;
  padding: 8px 18px;
  margin-bottom: 14px;
  border-radius: 18px;
  background: var(--kaart);
}
.groep > .knop {
  justify-self: start;
  margin: 0 0 10px;
  background: rgb(255 255 255 / 0.06);
}
.rij,
.blok {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}
.blok {
  flex-direction: column;
  align-items: stretch;
}
.rij span,
.blok span {
  display: grid;
  gap: 2px;
}
small {
  color: var(--dim);
  font-size: 13px;
}
input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}
.toggle {
  appearance: none;
  flex: none;
  width: 50px;
  height: 30px;
  border-radius: 15px;
  background: #3a3d48;
  position: relative;
  transition: background 0.2s;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: translate 0.2s;
}
.toggle:checked {
  background: var(--accent);
}
.toggle:checked::after {
  translate: 20px 0;
}
</style>
