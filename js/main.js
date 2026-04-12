// main.js — Controlador principal del juego

const META = 21; // puntos de partida para ganar
const VALOR_APUESTA = { paso: 1, cuatrola: 4, quintola: 5 };
const ORDEN_APUESTA = { paso: 0, cuatrola: 1, quintola: 2 };

const G = {
  // Puntuación de partida (primero en llegar a 21 gana)
  puntosHumano: 0,
  puntosIA: 0,

  // Estado de la mano
  manoHumano: [],
  manoIA: [],
  triunfo: null,
  triunfoCarta: null,

  // Apuesta de esta mano
  contrato: null, // { jugador: 'humano'|'ia'|null, tipo: 'paso'|'cuatrola'|'quintola', valor: 1|4|5 }

  // Baza en curso
  bazaActual: [],
  turno: 'humano',

  // Mazo de robo
  mazo: [],

  // Acumulados de la mano
  cartasGanadasHumano: [],
  cartasGanadasIA: [],
  bazasHumano: 0,
  bazasIA: 0,
  ultimaBazaGanador: null,
  cartasJugadas: [],   // memoria: todas las cartas resueltas en bazas anteriores
  historialHumano: [],
  historialIA: [],
  cantesHumano: 0,
  cantesIA: 0,
  cantesDeclaradosHumano: new Set(), // palos ya cantados esta mano
  cantesDeclaradosIA: new Set(),

  bloqueado: false,
};

// ─── Inicio de mano ───────────────────────────────────────────────────────────

function iniciarMano() {
  G.bloqueado = true; // bloqueado hasta que terminen las apuestas
  G.bazaActual = [];
  G.cartasGanadasHumano = [];
  G.cartasGanadasIA = [];
  G.bazasHumano = 0;
  G.bazasIA = 0;
  G.ultimaBazaGanador = null;
  G.cartasJugadas = [];
  G.historialHumano = [];
  G.historialIA = [];
  G.cantesHumano = 0;
  G.cantesIA = 0;
  G.cantesDeclaradosHumano = new Set();
  G.cantesDeclaradosIA = new Set();
  G.contrato = null;

  const baraja = crearBaraja();
  const reparto = repartir(baraja);

  G.manoHumano   = reparto.manoHumano;
  G.manoIA       = reparto.manoIA;
  G.triunfo      = reparto.triunfo;
  G.triunfoCarta = reparto.triunfoCarta;
  G.mazo         = reparto.mazo;

  renderTriunfo(G.triunfoCarta, G.triunfo);
  renderMazo(G.mazo.length);
  renderMarcador(G.puntosHumano, G.puntosIA);
  renderPuntosMano(0, 0, 0, 0);
  renderContrato(null);
  actualizarUI();

  // Mostrar panel de apuestas
  mostrarPanelApuesta(G.triunfo);
}

// ─── Apuestas ─────────────────────────────────────────────────────────────────

function humanoApuesta(tipo) {
  ocultarPanelApuesta();

  // IA responde: solo puede subir la apuesta del humano
  const respuestaIA = decidirApuestaIA(G.manoIA, G.triunfo, tipo);

  if (respuestaIA !== 'paso' && ORDEN_APUESTA[respuestaIA] > ORDEN_APUESTA[tipo]) {
    // IA sube
    G.contrato = { jugador: 'ia', tipo: respuestaIA, valor: VALOR_APUESTA[respuestaIA] };
    mostrarMensaje(`La IA sube a ${respuestaIA.toUpperCase()} (${VALOR_APUESTA[respuestaIA]} pts)`, 'malo');
  } else if (tipo !== 'paso') {
    // Apuesta del humano queda
    G.contrato = { jugador: 'humano', tipo, valor: VALOR_APUESTA[tipo] };
    mostrarMensaje(`Juegas a ${tipo.toUpperCase()} (${VALOR_APUESTA[tipo]} pts)`, 'turno');
  } else {
    // Ambos pasan
    G.contrato = { jugador: null, tipo: 'paso', valor: 1 };
    mostrarMensaje('Nadie apuesta · Paso (1 punto)', 'info');
  }

  renderContrato(G.contrato);
  setTimeout(iniciarJuego, 1200);
}

function iniciarJuego() {
  G.bloqueado = false;
  actualizarUI();
  ocultarMensaje();

  if (G.turno === 'humano') {
    mostrarMensaje('Tu turno', 'turno');
    actualizarBotonCante();
  } else {
    mostrarMensaje('IA sale...', 'info');
    renderBotonCante(false);
    setTimeout(turnoIA, 1200);
  }
}

// ─── Cante (botón siempre visible, solo actúa al salir) ──────────────────────

function humanoCanta() {
  // Solo válido cuando el humano lidera (baza vacía) y no está bloqueado
  if (G.bloqueado || G.turno !== 'humano' || G.bazaActual.length !== 0) return;

  const cantes = detectarCantesDisponibles(G.manoHumano, G.triunfo, G.cantesDeclaradosHumano);
  if (cantes.length === 0) return; // no hay cante disponible

  cantes.forEach(c => {
    G.cantesHumano += c.puntos;
    G.cantesDeclaradosHumano.add(c.palo);
  });

  const texto = cantes.map(c => `${c.puntos} de ${c.palo}`).join(' · ');
  mostrarMensaje(`¡Canta ${texto}!`, 'exito');

  const ptH = G.cartasGanadasHumano.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  const ptI = G.cartasGanadasIA.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  renderPuntosMano(ptH, ptI, G.cantesHumano, G.cantesIA);
  actualizarBotonCante();
}

// Actualiza el estado visual del botón de cante
function actualizarBotonCante() {
  const cantes = G.bazaActual.length === 0 && G.turno === 'humano' && !G.bloqueado
    ? detectarCantesDisponibles(G.manoHumano, G.triunfo, G.cantesDeclaradosHumano)
    : [];
  renderBotonCante(cantes.length > 0);
}

// ─── Turno humano ─────────────────────────────────────────────────────────────

function humanoJuega(carta) {
  if (G.bloqueado || G.turno !== 'humano') return;

  if (!esJugadaLegal(carta, G.manoHumano, G.bazaActual, G.triunfo)) {
    mostrarMensaje('Jugada no permitida (debes montar o fallar)', 'error');
    return;
  }

  G.manoHumano = G.manoHumano.filter(c => c !== carta);
  G.bazaActual.push({ jugador: 'humano', carta });
  G.bloqueado = true;
  actualizarUI();

  if (G.bazaActual.length === 2) {
    setTimeout(finalizarBaza, 900);
  } else {
    G.turno = 'ia';
    mostrarMensaje('IA pensando...', 'info');
    setTimeout(turnoIA, 1000);
  }
}

// ─── Turno IA ─────────────────────────────────────────────────────────────────

function turnoIA() {
  // IA auto-canta al salir si tiene par
  if (G.bazaActual.length === 0) {
    const cantes = detectarCantesDisponibles(G.manoIA, G.triunfo, G.cantesDeclaradosIA);
    if (cantes.length > 0) {
      cantes.forEach(c => {
        G.cantesIA += c.puntos;
        G.cantesDeclaradosIA.add(c.palo);
      });
      const texto = cantes.map(c => `${c.puntos} de ${c.palo}`).join(' · ');
      mostrarMensaje(`IA canta: ${texto}`, 'malo');
      const ptH = G.cartasGanadasHumano.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
      const ptI = G.cartasGanadasIA.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
      renderPuntosMano(ptH, ptI, G.cantesHumano, G.cantesIA);
      setTimeout(jugarCartaIA, 900);
      return;
    }
  }
  jugarCartaIA();
}

function jugarCartaIA() {
  const carta = decidirCartaIA(
    G.manoIA, G.bazaActual, G.triunfo,
    G.cartasJugadas, G.bazasIA, G.bazasHumano, G.contrato
  );
  G.manoIA = G.manoIA.filter(c => c !== carta);
  G.bazaActual.push({ jugador: 'ia', carta });
  actualizarUI();

  if (G.bazaActual.length === 2) {
    setTimeout(finalizarBaza, 900);
  } else {
    G.turno = 'humano';
    G.bloqueado = false;
    mostrarMensaje('Tu turno', 'turno');
    actualizarUI();
    actualizarBotonCante();
  }
}

// ─── Resolver baza ────────────────────────────────────────────────────────────

function finalizarBaza() {
  const ganador = resolverBaza(G.bazaActual, G.triunfo);
  const cartasBaza = G.bazaActual.map(j => j.carta);

  // Acumular en memoria: la IA ya sabe qué cartas han salido
  G.cartasJugadas.push(...cartasBaza);

  G.ultimaBazaGanador = ganador;

  if (ganador === 'humano') {
    G.cartasGanadasHumano.push(...cartasBaza);
    G.bazasHumano++;
    mostrarMensaje('¡Ganaste la baza!', 'exito');
  } else {
    G.cartasGanadasIA.push(...cartasBaza);
    G.bazasIA++;
    mostrarMensaje('La IA gana la baza', 'malo');
  }

  const ptH = G.cartasGanadasHumano.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  const ptI = G.cartasGanadasIA.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  renderPuntosMano(ptH, ptI, G.cantesHumano, G.cantesIA);

  setTimeout(() => {
    G.bazaActual = [];
    G.turno = ganador;

    // Robar del mazo si quedan cartas
    let mensajeRobo = '';
    if (G.mazo.length > 0) {
      const cartaGanador  = G.mazo.shift();
      const cartaPerdedor = G.mazo.shift();
      if (ganador === 'humano') {
        G.manoHumano.push(cartaGanador);
        if (cartaPerdedor) G.manoIA.push(cartaPerdedor);
        mensajeRobo = `Robas: ${getNombreCarta(cartaGanador)}`;
      } else {
        G.manoIA.push(cartaGanador);
        if (cartaPerdedor) G.manoHumano.push(cartaPerdedor);
        mensajeRobo = `Robas: ${getNombreCarta(cartaPerdedor)}`;
      }
      renderMazo(G.mazo.length);
    }

    if (G.manoHumano.length === 0) {
      finalizarMano();
    } else {
      G.bloqueado = G.turno === 'ia';
      actualizarUI();
      if (G.turno === 'humano') {
        mostrarMensaje(mensajeRobo || 'Tu turno', 'turno');
        actualizarBotonCante();
      } else {
        renderBotonCante(false);
        mostrarMensaje(mensajeRobo ? `IA gana · ${mensajeRobo}` : 'IA sale...', 'info');
        setTimeout(turnoIA, 1200);
      }
    }
  }, 1400);
}

// ─── Fin de mano ──────────────────────────────────────────────────────────────

function finalizarMano() {
  const { ptHumano, ptIA } = calcularPuntosMano(
    G.cartasGanadasHumano, G.cartasGanadasIA,
    G.ultimaBazaGanador,
    G.cantesHumano, G.cantesIA
  );

  // Determinar ganador según el contrato
  const c = G.contrato;
  let ptPartidaH = 0, ptPartidaI = 0;
  let cumplido = false;
  let textoContrato = '';

  if (c.tipo === 'paso') {
    // Gana quien tenga más puntos de cartas
    cumplido = ptHumano > ptIA;
    if (cumplido) { ptPartidaH = 1; textoContrato = '¡Ganas la mano! (+1 punto)'; }
    else          { ptPartidaI = 1; textoContrato = 'La IA gana la mano (+1 punto para ella)'; }

  } else if (c.tipo === 'cuatrola') {
    const bazasContratante = c.jugador === 'humano' ? G.bazasHumano : G.bazasIA;
    cumplido = bazasContratante >= 4;
    if (cumplido) {
      if (c.jugador === 'humano') { ptPartidaH = c.valor; textoContrato = `¡Cuatrola cumplida! +${c.valor} pts`; }
      else                        { ptPartidaI = c.valor; textoContrato = `La IA cumple su Cuatrola +${c.valor} pts`; }
    } else {
      if (c.jugador === 'humano') { ptPartidaI = c.valor; textoContrato = `No cumpliste la Cuatrola. IA +${c.valor} pts`; }
      else                        { ptPartidaH = c.valor; textoContrato = `¡La IA no cumple! Tú +${c.valor} pts`; }
    }

  } else { // quintola
    const bazasContratante = c.jugador === 'humano' ? G.bazasHumano : G.bazasIA;
    cumplido = bazasContratante === 5;
    if (cumplido) {
      if (c.jugador === 'humano') { ptPartidaH = c.valor; textoContrato = `¡Quintola! +${c.valor} pts`; }
      else                        { ptPartidaI = c.valor; textoContrato = `¡Quintola de la IA! +${c.valor} pts`; }
    } else {
      if (c.jugador === 'humano') { ptPartidaI = c.valor; textoContrato = `No cumpliste la Quintola. IA +${c.valor} pts`; }
      else                        { ptPartidaH = c.valor; textoContrato = `¡La IA no cumple! Tú +${c.valor} pts`; }
    }
  }

  G.puntosHumano += ptPartidaH;
  G.puntosIA     += ptPartidaI;
  renderMarcador(G.puntosHumano, G.puntosIA);

  const hayGanador = G.puntosHumano >= META || G.puntosIA >= META;

  // Desglose
  const ptCartasH = ptHumano - G.cantesHumano - (G.ultimaBazaGanador === 'humano' ? 10 : 0);
  const ptCartasI = ptIA     - G.cantesIA     - (G.ultimaBazaGanador === 'ia'     ? 10 : 0);

  let resumen = `<strong>Contrato: ${c.tipo.toUpperCase()}</strong> · Bazas: Tú ${G.bazasHumano} — IA ${G.bazasIA}<br>`;
  resumen += `Cartas: Tú ${ptCartasH} — IA ${ptCartasI}`;
  if (G.cantesHumano) resumen += ` · Cante tuyo: +${G.cantesHumano}`;
  if (G.cantesIA)     resumen += ` · Cante IA: +${G.cantesIA}`;
  resumen += `<br>Última baza: ${G.ultimaBazaGanador === 'humano' ? 'Tú' : 'IA'}<br>`;
  resumen += `<br><strong>${textoContrato}</strong><br>`;
  resumen += `Partida: Tú <strong>${G.puntosHumano}</strong> — IA <strong>${G.puntosIA}</strong> (meta: ${META})`;

  if (hayGanador) {
    finalizarPartida();
    return;
  }

  mostrarModal('Fin de mano', resumen, 'Siguiente mano', () => {
    ocultarModal();
    G.turno = 'humano';
    iniciarMano();
  });
}

// ─── Fin de partida ───────────────────────────────────────────────────────────

function finalizarPartida() {
  const titulo = G.puntosHumano >= META ? '¡HAS GANADO!' : 'La IA ha ganado';
  const cuerpo = `Puntos finales — Tú: <strong>${G.puntosHumano}</strong> | IA: <strong>${G.puntosIA}</strong>`;

  mostrarModal(titulo, cuerpo, 'Nueva partida', () => {
    ocultarModal();
    G.puntosHumano = 0;
    G.puntosIA = 0;
    G.turno = 'humano';
    iniciarMano();
  });
}

// ─── Renderizado general ──────────────────────────────────────────────────────

function actualizarUI() {
  renderManoIA(G.manoIA);
  renderManoHumano(G.manoHumano, G.bazaActual, G.triunfo, G.turno, G.bloqueado, humanoJuega);
  renderBaza(G.bazaActual);
}

// ─── Arranque ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  iniciarMano();
});
