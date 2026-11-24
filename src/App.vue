<script setup>
// Eenvoudige hash routing (#/kleur, #/punten, ...): werkt op Vercel zonder extra configuratie.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Home from './views/Home.vue'
import Instellingen from './views/Instellingen.vue'
import Klassement from './views/Klassement.vue'
import Kleurhulp from './views/Kleurhulp.vue'
import Puntenteller from './views/Puntenteller.vue'

const routes = {
  '/': Home,
  '/kleur': Kleurhulp,
  '/punten': Puntenteller,
  '/klassement': Klassement,
  '/instellingen': Instellingen,
}
const pad = ref(location.hash.slice(1) || '/')
const pagina = computed(() => routes[pad.value] ?? Home)

const opHash = () => {
  pad.value = location.hash.slice(1) || '/'
  window.scrollTo(0, 0)
}
onMounted(() => addEventListener('hashchange', opHash))
onUnmounted(() => removeEventListener('hashchange', opHash))
</script>

<template>
  <Transition name="pagina" mode="out-in">
    <component :is="pagina" :key="pad" />
  </Transition>
</template>
