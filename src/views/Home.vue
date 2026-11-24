<script setup>
import KleurSymbool from '../components/KleurSymbool.vue'
import { backendNaam } from '../lib/scores'
import { spel, stand } from '../lib/spel'

const vormen = ['Rood', 'Blauw', 'Groen', 'Geel']
</script>

<template>
  <main class="pagina">
    <header class="hero">
      <div class="vormen" aria-hidden="true">
        <span v-for="(v, i) in vormen" :key="v" class="vorm" :style="{ '--i': i }">
          <KleurSymbool :kleur="v" :grootte="64" />
        </span>
      </div>
      <h1>UNO<br />Kleurhulp</h1>
      <p class="intro">Elke kleur heeft een vorm. Scan een kaart en je weet meteen welke kleur het is.</p>
    </header>

    <nav class="menu">
      <a href="#/kleur" class="rij hoofd">
        <KleurSymbool kleur="Rood" :grootte="34" />
        <span>
          <strong>Kleur scannen</strong>
          <small>Richt je camera op een kaart</small>
        </span>
      </a>
      <a href="#/punten" class="rij">
        <KleurSymbool kleur="Blauw" :grootte="34" />
        <span>
          <strong>{{ spel.bezig ? 'Verder spelen' : 'Spel tot 500' }}</strong>
          <small v-if="spel.bezig && stand.length">{{ stand[0].naam }} leidt met {{ stand[0].punten }} punten</small>
          <small v-else>Punten scannen of zelf invullen</small>
        </span>
      </a>
      <a href="#/klassement" class="rij">
        <KleurSymbool kleur="Groen" :grootte="34" />
        <span>
          <strong>Klassement</strong>
          <small>Alle gespeelde rondes</small>
        </span>
      </a>
      <a href="#/instellingen" class="rij">
        <KleurSymbool kleur="Geel" :grootte="34" />
        <span>
          <strong>Instellingen</strong>
          <small>Geluid, trillen, zekerheid</small>
        </span>
      </a>
    </nav>

    <p class="noot">
      Het herkennen gebeurt op je toestel. Camerabeelden worden niet opgeslagen. Enkel scores worden bewaard, {{ backendNaam }}.
    </p>
  </main>
</template>

<style scoped>
.hero {
  padding: 28px 0 26px;
}
.vormen {
  display: flex;
  gap: 10px;
  margin-bottom: 26px;
}
/* Het ene bewegende moment van de app: de vormen worden "gedeeld" als kaarten. */
.vorm {
  display: block;
  animation: delen 0.7s var(--veer) both;
  animation-delay: calc(var(--i) * 90ms + 80ms);
}
@keyframes delen {
  from {
    opacity: 0;
    transform: translateY(-40px) rotate(-25deg) scale(0.6);
  }
}
h1 {
  font-size: clamp(56px, 18vw, 84px);
  margin: 0 0 14px;
  font-variation-settings: 'wdth' 90;
}
.intro {
  font-size: 19px;
  line-height: 1.35;
  color: var(--dim);
  margin: 0;
  max-width: 30ch;
}
.menu {
  display: grid;
  background: var(--vlak);
  border-radius: var(--r-groot);
  padding: 6px 18px;
}
.rij {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 2px solid var(--bg);
  transition: transform 0.25s var(--veer);
}
.rij:last-child {
  border-bottom: 0;
}
.rij:active {
  transform: scale(0.97);
}
.rij span {
  display: grid;
  gap: 2px;
}
.rij strong {
  font-size: 21px;
  letter-spacing: -0.01em;
}
.rij.hoofd strong {
  font-size: 26px;
}
.rij small {
  color: var(--dim);
  font-size: 15px;
}
.noot {
  margin-top: 22px;
  font-size: 13px;
  color: var(--dim);
  line-height: 1.4;
}
</style>
