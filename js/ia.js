// ia.js — Inteligencia Artificial con memoria de cartas

// ─── Utilidades de memoria ────────────────────────────────────────────────────

// Clave única para comparar cartas
function claveC(c) { return `${c.palo}-${c.valor}`; }

// ¿Es esta carta la más alta posible de ganar en su línea?
// "segura" = no quedan cartas que puedan superarla (ni en mano rival ni en mazo)
function esSegura(carta, triunfo, manoIA, jugadas) {
  const vistas = new Set([
    ...manoIA.map(claveC),
    ...jugadas.map(claveC),
  ]);
  // Buscar si queda alguna carta no vista que gane a esta
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      const candidata = { palo, valor };
      if (vistas.has(claveC(candidata))) continue;
      if (nuevaGana(candidata, carta, triunfo, carta.palo)) return false;
    }
  }
  return true;
}

// Puntos de cartas en la baza actual (para decidir si merece la pena ganarla)
function puntosBazaActual(baza) {
  return baza.reduce((s, j) => s + puntosCartaFn(j.carta.valor), 0);
}

// ─── Apuesta ──────────────────────────────────────────────────────────────────

function decidirApuestaIA(mano, triunfo, apuestaRival) {
  const numTriunfos     = mano.filter(c => c.palo === triunfo).length;
  const asTriunfo       = mano.some(c => c.palo === triunfo && c.valor === 1);
  const tresTriunfo     = mano.some(c => c.palo === triunfo && c.valor === 3);
  const asesNoTriunfo   = mano.filter(c => c.palo !== triunfo && c.valor === 1).length;
  const tresesNoTriunfo = mano.filter(c => c.palo !== triunfo && c.valor === 3).length;

  let bazasEsperadas = 0;
  bazasEsperadas += numTriunfos * 0.85;
  bazasEsperadas += (asTriunfo   ? 0.15 : 0);
  bazasEsperadas += (tresTriunfo ? 0.10 : 0);
  bazasEsperadas += asesNoTriunfo   * 0.55;
  bazasEsperadas += tresesNoTriunfo * 0.40;

  let quiere;
  if      (bazasEsperadas >= 4.6) quiere = 'quintola';
  else if (bazasEsperadas >= 3.4) quiere = 'cuatrola';
  else                             quiere = 'paso';

  const ORDEN = { paso: 0, cuatrola: 1, quintola: 2 };
  const rivalNivel = apuestaRival ? ORDEN[apuestaRival] : -1;
  return ORDEN[quiere] > rivalNivel ? quiere : 'paso';
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

// jugadas: array de cartas {palo,valor} ya resueltas en bazas anteriores
// contrato: { jugador, tipo, valor }
function decidirCartaIA(mano, baza, triunfo, jugadas, bazasIA, bazasHumano, contrato) {
  jugadas = jugadas || [];
  const legales = mano.filter(c => esJugadaLegal(c, mano, baza, triunfo));

  // Contexto del contrato
  const yapostaCuatrola = contrato?.tipo === 'cuatrola';
  const yapostaQuintola = contrato?.tipo === 'quintola';
  const necesitaBazas   = (yapostaCuatrola || yapostaQuintola) && contrato?.jugador === 'ia';
  const debeBloquear    = (yapostaCuatrola || yapostaQuintola) && contrato?.jugador === 'humano';
  const bazasMeta       = yapostaQuintola ? 5 : 4;
  const bazasFaltanIA   = necesitaBazas ? Math.max(0, bazasMeta - bazasIA) : 0;

  if (baza.length === 0) {
    return elegirSalida(legales, triunfo, jugadas, mano, necesitaBazas, debeBloquear, bazasFaltanIA);
  } else {
    return elegirRespuesta(legales, baza, triunfo, jugadas, mano, necesitaBazas, debeBloquear);
  }
}

// ─── Salida (la IA lleva la baza) ─────────────────────────────────────────────

function elegirSalida(legales, triunfo, jugadas, manoIA, necesitaBazas, debeBloquear, bazasFaltanIA) {
  const seguras          = legales.filter(c => esSegura(c, triunfo, manoIA, jugadas));
  const segurasSinTriunfo = seguras.filter(c => c.palo !== triunfo);
  const segurasTriunfo    = seguras.filter(c => c.palo === triunfo);
  const misTriunfos       = legales.filter(c => c.palo === triunfo);

  // ── MODO AGRESIVO: tengo contrato que cumplir ────────────────────────────
  if (necesitaBazas && bazasFaltanIA > 0) {
    // Si quedan por ganar muchas bazas y tengo triunfos seguros: arrastrar
    if (segurasTriunfo.length > 0 && misTriunfos.length >= 2) {
      return cartaMasBaja(segurasTriunfo); // arrastrar con el triunfo más bajo seguro
    }
    // Salir con carta segura de palo (baza garantizada sin gastar triunfo)
    if (segurasSinTriunfo.length > 0) return cartaMasAlta(segurasSinTriunfo);
    // Sin seguras: salir con la carta más fuerte posible
    if (misTriunfos.length > 0) return cartaMasBaja(misTriunfos); // el triunfo más bajo
    return cartaMasAlta(legales.filter(c => c.valor === 1 || c.valor === 3).length > 0
      ? legales.filter(c => c.valor === 1 || c.valor === 3)
      : legales);
  }

  // ── MODO DEFENSIVO: bloquear el contrato del humano ──────────────────────
  if (debeBloquear) {
    // Ganar bazas para evitar que el rival llegue a 4/5
    if (segurasSinTriunfo.length > 0) return cartaMasBaja(segurasSinTriunfo);
    if (seguras.length > 0) return cartaMasBaja(seguras);
    // Guardar triunfos para responder; salir con la carta más inocua
    const sinTriunfoDebiles = legales.filter(c => c.palo !== triunfo && c.valor !== 1 && c.valor !== 3);
    if (sinTriunfoDebiles.length > 0) return cartaMasBaja(sinTriunfoDebiles);
    return cartaMenosValiosa(legales);
  }

  // ── MODO PASO: maximizar puntos de cartas ────────────────────────────────
  // Salir con carta segura sin triunfo (baza asegurada, guardo triunfos)
  if (segurasSinTriunfo.length > 0) return cartaMasAlta(segurasSinTriunfo);
  // Sin carta segura: salir con carta débil, no regalar puntos al rival
  const sinTriunfoDebiles = legales.filter(c => c.palo !== triunfo && c.valor !== 1 && c.valor !== 3);
  if (sinTriunfoDebiles.length > 0) return cartaMasBaja(sinTriunfoDebiles);
  return cartaMenosValiosa(legales);
}

// ─── Respuesta (el humano salió primero) ──────────────────────────────────────

function elegirRespuesta(legales, baza, triunfo, jugadas, manoIA, necesitaBazas, debeBloquear) {
  const paloSalida       = baza[0].carta.palo;
  const ganadorActual    = ganadorActualBaza(baza, triunfo);
  const ganadoras        = legales.filter(c => nuevaGana(c, ganadorActual.carta, triunfo, paloSalida));
  const puntosEnJuego    = puntosBazaActual(baza);
  const bazaValeLaPena   = puntosEnJuego >= 4; // As(11), 3(10), Rey(4)

  // ── Puede ganar ──────────────────────────────────────────────────────────
  if (ganadoras.length > 0) {

    // Contrato propio: ganar siempre
    if (necesitaBazas) return cartaMasBaja(ganadoras);

    // Contrato del rival: ganar siempre para bloquear
    if (debeBloquear) return cartaMasBaja(ganadoras);

    // Paso con baza valiosa: ganar con la carta más baja posible
    if (bazaValeLaPena) return cartaMasBaja(ganadoras);

    // Paso con baza sin valor: ganar solo si no cuesta nada preciado
    const ganadorasBaratas = ganadoras.filter(c => puntosCartaFn(c.valor) <= 2);
    if (ganadorasBaratas.length > 0) return cartaMasBaja(ganadorasBaratas);

    // Baza sin valor y solo ganaría con As/3: no gastar esa carta aquí
    // Caer al descarte
  }

  // ── No puede ganar (o decidió no gastar carta preciosa) ──────────────────
  // Descartar la carta menos valiosa; nunca tirar As ni 3 si se puede evitar
  const sinPreciosas = legales.filter(c => c.valor !== 1 && c.valor !== 3);
  if (sinPreciosas.length > 0) return cartaMenosValiosa(sinPreciosas);
  return cartaMenosValiosa(legales);
}

// ─── Helpers de ordenación ────────────────────────────────────────────────────

function cartaMasAlta(cartas) {
  return cartas.reduce((max, c) =>
    JERARQUIA.indexOf(c.valor) < JERARQUIA.indexOf(max.valor) ? c : max
  );
}

function cartaMasBaja(cartas) {
  return cartas.reduce((min, c) =>
    JERARQUIA.indexOf(c.valor) > JERARQUIA.indexOf(min.valor) ? c : min
  );
}

function cartaMenosValiosa(cartas) {
  return cartas.reduce((min, c) =>
    puntosCartaFn(c.valor) < puntosCartaFn(min.valor) ? c : min
  );
}
