// reglas.js — Motor de reglas del juego (montar / asistir / fallar / arrastre)

// Devuelve la entrada ganadora actual { jugador, carta } de una baza en curso
function ganadorActualBaza(baza, triunfo) {
  if (baza.length === 0) return null;
  const paloSalida = baza[0].carta.palo;
  return baza.reduce((g, j) =>
    nuevaGana(j.carta, g.carta, triunfo, paloSalida) ? j : g
  );
}

// ¿Es legal jugar 'carta' dados el estado de la baza y la mano completa?
// Reglas: montar > asistir > fallar > montar el fallo > libre
function esJugadaLegal(carta, mano, baza, triunfo) {
  if (baza.length === 0) return true; // sale libremente

  const paloSalida = baza[0].carta.palo;
  const ganador = ganadorActualBaza(baza, triunfo);

  const tengoPaloSalida = mano.some(c => c.palo === paloSalida);
  const tengoTriunfo    = mano.some(c => c.palo === triunfo);

  // ── Arrastre: salió triunfo ──────────────────────────────────────────
  if (paloSalida === triunfo) {
    if (tengoTriunfo) return carta.palo === triunfo;
    return true; // sin triunfo: carta libre
  }

  // ── Tiene el palo de salida ──────────────────────────────────────────
  if (tengoPaloSalida) {
    if (carta.palo !== paloSalida) return false; // obligado a asistir/montar

    // ¿Puede montar (ganar con el mismo palo)?
    const puedeMontarConPalo = mano.some(
      c => c.palo === paloSalida && nuevaGana(c, ganador.carta, triunfo, paloSalida)
    );
    if (puedeMontarConPalo) {
      // Obligado a montar: la carta jugada debe ganar al actual ganador
      return nuevaGana(carta, ganador.carta, triunfo, paloSalida);
    }
    return true; // asistir: cualquier carta del palo sirve
  }

  // ── No tiene el palo: obligado a fallar con triunfo ─────────────────
  if (tengoTriunfo) {
    if (carta.palo !== triunfo) return false; // debe tirar triunfo

    // Si ya hay triunfo ganando, debe montar el fallo si puede
    const hayTriunfoGanando = ganador.carta.palo === triunfo;
    if (hayTriunfoGanando) {
      const puedeMontarFallo = mano.some(
        c => c.palo === triunfo && nuevaGana(c, ganador.carta, triunfo, paloSalida)
      );
      if (puedeMontarFallo) {
        return nuevaGana(carta, ganador.carta, triunfo, paloSalida);
      }
    }
    return true; // cualquier triunfo
  }

  // ── Sin palo ni triunfo: carta libre ────────────────────────────────
  return true;
}

// Devuelve el jugador ('humano' | 'ia') que gana la baza
function resolverBaza(baza, triunfo) {
  return ganadorActualBaza(baza, triunfo).jugador;
}

// Devuelve todos los cantes disponibles al salir una baza:
// tener Rey+Caballo del mismo palo en mano y no haberlo declarado ya.
function detectarCantesDisponibles(mano, triunfo, yaDeclarados) {
  const cantes = [];
  for (const palo of PALOS) {
    if (yaDeclarados && yaDeclarados.has(palo)) continue;
    const tieneRey     = mano.some(c => c.palo === palo && c.valor === 12);
    const tieneCaballo = mano.some(c => c.palo === palo && c.valor === 11);
    if (tieneRey && tieneCaballo) {
      const puntos = palo === triunfo ? 40 : 20;
      cantes.push({ palo, puntos, texto: `¡${puntos} de ${palo}!` });
    }
  }
  return cantes;
}

// Calcula puntos de card values ganados + 10 extra por última baza + cantes
function calcularPuntosMano(cartasHumano, cartasIA, ultimaBazaGanador, cantesHumano, cantesIA) {
  const sumar = cartas => cartas.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  let ptHumano = sumar(cartasHumano) + cantesHumano;
  let ptIA     = sumar(cartasIA)     + cantesIA;

  if (ultimaBazaGanador === 'humano') ptHumano += 10;
  else ptIA += 10;

  const ganaMano = ptHumano > ptIA ? 'humano' : 'ia';
  return { ptHumano, ptIA, ganaMano };
}
