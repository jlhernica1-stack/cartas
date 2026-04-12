// reglas4.js — Reglas adaptadas para 4 jugadores en 2 equipos
// Depende de: baraja.js, reglas.js, baraja4.js

// Mapa de posición → equipo
const EQUIPOS_4 = { sur: 'A', norte: 'A', este: 'B', oeste: 'B' };

/**
 * Calcula los puntos de cartas acumulados por cada equipo en una mano.
 * @param {Array}  cartasA           - Cartas ganadas por el Equipo A
 * @param {Array}  cartasB           - Cartas ganadas por el Equipo B
 * @param {string} ultimaBazaEquipo  - 'A' o 'B': quién ganó la última baza (+10 pts)
 * @param {number} cantesA           - Puntos de cantes declarados por el Equipo A
 * @param {number} cantesB           - Puntos de cantes declarados por el Equipo B
 * @returns {{ ptA, ptB }}
 */
function calcularPuntosEquipo(cartasA, cartasB, ultimaBazaEquipo, cantesA, cantesB) {
  const sumar = cs => cs.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  let ptA = sumar(cartasA) + (cantesA || 0);
  let ptB = sumar(cartasB) + (cantesB || 0);
  if (ultimaBazaEquipo === 'A') ptA += 10;
  else if (ultimaBazaEquipo === 'B') ptB += 10;
  return { ptA, ptB };
}

/**
 * Wrapper de esJugadaLegal (reglas.js) para el contexto de 4 jugadores.
 * La lógica de reglas no cambia por el número de jugadores,
 * ya que solo depende de la baza acumulada hasta el turno del jugador.
 */
function esJugadaLegal4(carta, mano, baza, triunfo) {
  return esJugadaLegal(carta, mano, baza, triunfo);
}

/**
 * Resuelve una baza completa de 4 cartas.
 * Reutiliza ganadorActualBaza de reglas.js, que soporta N entradas.
 * @param {Array}  baza    - [{ jugador: posición, carta }, …]
 * @param {string} triunfo - palo de triunfo
 * @returns {string} posición ganadora ('sur'|'este'|'norte'|'oeste')
 */
function resolverBaza4(baza, triunfo) {
  return ganadorActualBaza(baza, triunfo).jugador;
}

/**
 * Detecta cantes disponibles para un jugador concreto.
 * Delegación directa a detectarCantesDisponibles de reglas.js.
 */
function detectarCantesJugador(mano, triunfo, cantesDeclarados) {
  return detectarCantesDisponibles(mano, triunfo, cantesDeclarados);
}
