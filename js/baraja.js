// baraja.js — Gestión del mazo (20 cartas: As, 3, Sota, Caballo, Rey)

const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
const VALORES = [1, 3, 10, 11, 12]; // 10=sota, 11=caballo, 12=rey
const JERARQUIA = [1, 3, 12, 11, 10]; // de mayor a menor

const NOMBRES_VALOR = { 1: 'As', 3: 'Tres', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

// Puntos que vale cada carta
const PUNTOS_CARTA = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 };

// Mapeo de valor a posición en el PNG (baraja de 40):
// As→1, 3→3, Sota→8, Caballo→9, Rey→10
const VALOR_A_POS_PNG = { 1: 1, 3: 3, 10: 8, 11: 9, 12: 10 };

function getImagen(palo, valor) {
  const suitIndex = PALOS.indexOf(palo);
  const pos = VALOR_A_POS_PNG[valor];
  return `Baraja cartas españolas/${suitIndex * 10 + pos}.PNG`;
}

function getNombreCarta(carta) {
  return `${NOMBRES_VALOR[carta.valor]} de ${carta.palo}`;
}

function crearBaraja() {
  const baraja = [];
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      baraja.push({ palo, valor, imagen: getImagen(palo, valor) });
    }
  }
  return barajar(baraja);
}

function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function repartir(baraja) {
  // 2 jugadores, 5 cartas cada uno, alternando
  // La última carta repartida (la 10ª, al jugador IA) define el triunfo
  // Las 10 restantes forman el mazo de robo
  const manoHumano = [];
  const manoIA = [];
  for (let r = 0; r < 5; r++) {
    manoHumano.push(baraja[r * 2]);
    manoIA.push(baraja[r * 2 + 1]);
  }
  const triunfoCarta = manoIA[4]; // última carta repartida
  const mazo = baraja.slice(10); // 10 cartas restantes para robar
  return { manoHumano, manoIA, triunfo: triunfoCarta.palo, triunfoCarta, mazo };
}

// ¿La carta 'nueva' gana a 'actual' considerando triunfo y palo de salida?
function nuevaGana(nueva, actual, triunfo, paloSalida) {
  const nuevaEsTriunfo = nueva.palo === triunfo;
  const actualEsTriunfo = actual.palo === triunfo;

  if (nuevaEsTriunfo && !actualEsTriunfo) return true;
  if (!nuevaEsTriunfo && actualEsTriunfo) return false;

  const nuevaSiguePalo = nueva.palo === paloSalida;
  const actualSiguePalo = actual.palo === paloSalida;

  if (!nuevaEsTriunfo) {
    if (nuevaSiguePalo && !actualSiguePalo) return true;
    if (!nuevaSiguePalo) return false;
  }

  return JERARQUIA.indexOf(nueva.valor) < JERARQUIA.indexOf(actual.valor);
}

function puntosCartaFn(valor) {
  return PUNTOS_CARTA[valor] || 0;
}
