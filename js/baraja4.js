// baraja4.js — Reparto para 4 jugadores
// Depende de: baraja.js (PALOS, crearBaraja, getImagen…)

// Las 4 posiciones en orden de turno: Sur lidera, luego sentido horario
const POSICIONES_4 = ['sur', 'este', 'norte', 'oeste'];

/**
 * Reparte 20 cartas entre 4 jugadores (5 cada uno).
 * No hay mazo de robo: todas las cartas se entregan.
 * La última carta repartida (a Oeste, 5ª ronda) determina el triunfo.
 *
 * @param {Array} baraja  - Baraja barajada de 20 cartas
 * @returns {{ manos, triunfo, triunfoCarta }}
 */
function repartir4(baraja) {
  const manos = { sur: [], este: [], norte: [], oeste: [] };

  // 5 rondas × 4 jugadores = 20 cartas
  for (let ronda = 0; ronda < 5; ronda++) {
    POSICIONES_4.forEach((pos, i) => {
      manos[pos].push(baraja[ronda * 4 + i]);
    });
  }

  // Última carta repartida (Oeste, ronda 5) define el triunfo
  const triunfoCarta = manos.oeste[4];
  return {
    manos,
    triunfo: triunfoCarta.palo,
    triunfoCarta,
  };
}

/**
 * Dado quién lidera una baza, devuelve el orden de turno
 * para esa baza (4 posiciones empezando por el líder, sentido horario).
 * @param {string} primero - posición que lidera ('sur'|'este'|'norte'|'oeste')
 */
function ordenBaza4(primero) {
  const inicio = POSICIONES_4.indexOf(primero);
  return POSICIONES_4.map((_, i) => POSICIONES_4[(inicio + i) % 4]);
}
