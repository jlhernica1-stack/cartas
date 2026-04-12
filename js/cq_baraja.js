// cq_baraja.js — Baraja completa de 40 cartas para Cinquillo

const CQ_PALOS  = ['oros', 'copas', 'espadas', 'bastos'];
const CQ_VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // 10=sota,11=cab,12=rey
const CQ_RANK    = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // posición = rango (0-9)

const CQ_NOMBRES = {
  1:'As', 2:'Dos', 3:'Tres', 4:'Cuatro', 5:'Cinco',
  6:'Seis', 7:'Siete', 10:'Sota', 11:'Caballo', 12:'Rey'
};

function cqRank(valor) {
  return CQ_RANK.indexOf(valor);
}

function cqGetImagen(palo, valor) {
  const suitIdx = CQ_PALOS.indexOf(palo);
  const valIdx  = CQ_VALORES.indexOf(valor); // 0-9
  return `Baraja cartas españolas/${suitIdx * 10 + valIdx + 1}.PNG`;
}

function cqGetNombre(carta) {
  return `${CQ_NOMBRES[carta.valor]} de ${carta.palo}`;
}

function cqCrearBaraja() {
  const baraja = [];
  for (const palo of CQ_PALOS)
    for (const valor of CQ_VALORES)
      baraja.push({ palo, valor, imagen: cqGetImagen(palo, valor) });
  return cqBarajar(baraja);
}

function cqBarajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reparte las 40 cartas entre 2 jugadores (20 cada uno)
function cqRepartir(baraja) {
  return {
    manoHumano: baraja.slice(0, 20),
    manoIA:     baraja.slice(20, 40),
  };
}

// ─── Reglas ───────────────────────────────────────────────────────────────────

// mesa = { oros: Set<valor>, copas: ..., espadas: ..., bastos: ... }
function cqEsLegal(carta, mesa) {
  // El 5 de oros es la única carta legal hasta que esté en la mesa
  if (!mesa['oros'].has(5)) {
    return carta.palo === 'oros' && carta.valor === 5;
  }

  const jugadas = mesa[carta.palo];

  // Jugar un 5: arranca ese palo si aún no está
  if (carta.valor === 5) return !jugadas.has(5);

  // El palo no ha empezado todavía
  if (!jugadas.has(5)) return false;

  const rank = cqRank(carta.valor);
  const ranks = [...jugadas].map(v => cqRank(v));
  const minR  = Math.min(...ranks);
  const maxR  = Math.max(...ranks);

  return rank === minR - 1 || rank === maxR + 1;
}

function cqCartasLegales(mano, mesa) {
  return mano.filter(c => cqEsLegal(c, mesa));
}

// Dónde va la carta en el tablero: { palo, rankIdx }
function cqPosicionEnMesa(carta) {
  return { palo: carta.palo, rankIdx: cqRank(carta.valor) };
}
