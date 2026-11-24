/**
 * Maakt van losse voorspellingen een betrouwbare "trigger".
 *
 * Een label telt pas als:
 *   1. de zekerheid boven `drempel` ligt (bv. 90%)
 *   2. hetzelfde label `duur` milliseconden lang blijft (bv. 1 seconde)
 *
 * Met `vereisLeeg: true` moet er tussen twee triggers eerst `leeg` ("Geen kaart")
 * herkend worden. Zo telt dezelfde kaart niet dubbel en is het moeilijker te foppen
 * door gewoon de camera op één kaart te laten liggen.
 */
export function maakStabiel({ drempel = 0.9, duur = 1000, leeg = 'Geen kaart', vereisLeeg = false } = {}) {
  let kandidaat = null
  let sinds = 0
  let laatste = null
  let vrij = true
  let onzekerSinds = null

  // drempel mag een getal zijn of een functie (zodat een instelling live kan veranderen)
  const minimum = typeof drempel === 'function' ? drempel : () => drempel

  return function update(voorspellingen, nu = performance.now()) {
    const top = voorspellingen.reduce((a, b) => (b.probability > a.probability ? b : a))

    if (top.probability < minimum()) {
      kandidaat = null
      // Lang genoeg twijfelen (2x duur) telt ook als "kaart weg".
      // Anders blijft de teller hangen als "Geen kaart" nooit boven de drempel komt.
      onzekerSinds ??= nu
      if (nu - onzekerSinds >= duur * 2) {
        vrij = true
        laatste = null
      }
      return { top, voortgang: 0, nieuw: null }
    }
    onzekerSinds = null
    if (top.className !== kandidaat) {
      kandidaat = top.className
      sinds = nu
    }

    const voortgang = Math.min(1, (nu - sinds) / duur)
    let nieuw = null

    if (voortgang === 1) {
      if (kandidaat === leeg) {
        vrij = true
        laatste = leeg
      } else if (vereisLeeg ? vrij : kandidaat !== laatste) {
        nieuw = kandidaat
        laatste = kandidaat
        vrij = false
      }
    }
    return { top, voortgang, nieuw }
  }
}
