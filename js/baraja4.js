// baraja4.js — Reparto para 4 jugadores
// Depende de: baraja.js (PALOS, crearBaraja, getImagen…)

// Las 4 posiciones en orden de turno: Sur lidera, luego sentido horario
const POSICIONES_4 = ['sur', 'este', 'norte', 'oeste'];

/**
 * Reparte 20 cartas entre 4 jugadores (5 cada uno).
 * El repartidor recibe la última carta (boca arriba = triunfo).
 * El orden de reparto empieza por el jugador siguiente al repartidor.
 *
 * @param {Array}  baraja      - Baraja barajada de 20 cartas
 * @param {string} repartidor  - Posición del repartidor ('sur'|'este'|'norte'|'oeste')
 * @returns {{ manos, triunfo, triunfoCarta, repartidor }}
 */
function repartir4(baraja, repartidor = 'oeste') {
  const manos = { sur: [], este: [], norte: [], oeste: [] };

  // Orden de reparto: primero el jugador a la izquierda del repartidor, el repartidor es el último
  const idxR     = POSICIONES_4.indexOf(repartidor);
  const dealOrder = [0, 1, 2, 3].map(i => POSICIONES_4[(idxR + 1 + i) % 4]);

  // 5 rondas × 4 jugadores = 20 cartas
  for (let ronda = 0; ronda < 5; ronda++) {
    dealOrder.forEach((pos, i) => {
      manos[pos].push(baraja[ronda * 4 + i]);
    });
  }

  // La última carta del repartidor (la 5ª que recibe) es el triunfo
  const triunfoCarta = manos[repartidor][4];
  return {
    manos,
    triunfo:      triunfoCarta.palo,
    triunfoCarta,
    repartidor,
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
