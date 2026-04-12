// ia4.js — IA para los 3 bots en la partida de 4 jugadores
// Depende de: baraja.js, reglas.js, ia.js, reglas4.js

/**
 * Un bot decide su apuesta.
 * Delega en decidirApuestaIA (ia.js) comparando con la mejor apuesta actual.
 *
 * @param {Array}  mano              - Mano del bot
 * @param {string} triunfo
 * @param {string} mejorApuestaActual - Mejor apuesta que ya se ha hecho ('paso'|'cuatrola'|'quintola')
 * @returns {string} apuesta del bot
 */
function decidirApuesta4(mano, triunfo, mejorApuestaActual) {
  return decidirApuestaIA(mano, triunfo, mejorApuestaActual);
}

/**
 * Un bot decide qué carta jugar.
 *
 * Adapta el contexto de equipo al formato esperado por decidirCartaIA (ia.js):
 *   - Si el equipo del bot tiene el contrato → el bot "necesita bazas" (rol IA agresivo)
 *   - Si el equipo rival tiene el contrato → el bot "debe bloquear" (rol humano defensivo)
 *
 * @param {string} posBot       - Posición del bot ('norte'|'este'|'oeste')
 * @param {Array}  mano         - Mano del bot
 * @param {Array}  baza         - Baza en curso [{ jugador, carta }]
 * @param {string} triunfo
 * @param {Array}  cartasJugadas - Todas las cartas resueltas en bazas anteriores
 * @param {number} bazasA       - Bazas ganadas por el Equipo A en esta mano
 * @param {number} bazasB       - Bazas ganadas por el Equipo B en esta mano
 * @param {object|null} contrato - { equipo:'A'|'B'|null, tipo, valor }
 * @returns {object} carta elegida
 */
function decidirCarta4(posBot, mano, baza, triunfo, cartasJugadas, bazasA, bazasB, contrato) {
  const miEquipo = EQUIPOS_4[posBot];

  // Traducir el contrato al formato que espera decidirCartaIA:
  //   jugador:'ia'    → el llamante (ia.js) necesita cumplir bazas
  //   jugador:'humano'→ el llamante debe bloquear al rival
  let contratoAdaptado = null;
  if (contrato && contrato.tipo !== 'paso') {
    contratoAdaptado = {
      jugador: contrato.equipo === miEquipo ? 'ia' : 'humano',
      tipo:    contrato.tipo,
      valor:   contrato.valor,
    };
  }

  const bazasPropias = miEquipo === 'A' ? bazasA : bazasB;
  const bazasRivales = miEquipo === 'A' ? bazasB : bazasA;

  return decidirCartaIA(
    mano, baza, triunfo,
    cartasJugadas || [],
    bazasPropias, bazasRivales,
    contratoAdaptado
  );
}
