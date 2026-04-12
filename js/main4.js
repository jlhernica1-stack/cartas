// main4.js — Controlador principal del juego Cuatrola 4 jugadores
// Depende de: baraja.js, reglas.js, ia.js, baraja4.js, reglas4.js, ia4.js, ui4.js

// ─── Constantes ───────────────────────────────────────────────────────────────

const META4          = 21;
const VALOR_AP4      = { paso: 1, cuatrola: 4, quintola: 5 };
const ORDEN_AP4      = { paso: 0, cuatrola: 1, quintola: 2 };

// ─── Estado global del juego ──────────────────────────────────────────────────

const G4 = {
  // Configuración de jugadores (cargada desde sessionStorage)
  jugadores: {
    sur:   { nombre: 'Jugador',   tipo: 'humano', mano: [] },
    norte: { nombre: 'Bot Norte', tipo: 'bot',    mano: [] },
    este:  { nombre: 'Bot Este',  tipo: 'bot',    mano: [] },
    oeste: { nombre: 'Bot Oeste', tipo: 'bot',    mano: [] },
  },

  // Puntuación de partida por equipo
  puntosA: 0,  // Sur + Norte
  puntosB: 0,  // Este + Oeste

  // Estado de la mano en curso
  triunfo:      null,
  triunfoCarta: null,
  bazaActual:   [],   // [{ jugador: pos, carta }, …]  (hasta 4 entradas)
  turno:        'sur',
  ordenTurno:   [...POSICIONES_4], // orden de juego para la baza activa

  // Contrato de la mano
  // { equipo: 'A'|'B'|null, tipo: 'paso'|'cuatrola'|'quintola', valor: 1|4|5 }
  contrato: null,

  // Acumulados de la mano
  cartasGanadasA:   [],
  cartasGanadasB:   [],
  bazasA:           0,
  bazasB:           0,
  ultimaBazaEquipo: null,    // 'A' o 'B'
  cartasJugadas:    [],      // todas las cartas resueltas en bazas anteriores
  cantesA:          0,
  cantesB:          0,
  cantesDeclarados: {
    sur: new Set(), norte: new Set(), este: new Set(), oeste: new Set(),
  },

  bloqueado: false,
};

// ─── Arranque ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Cargar configuración de jugadores desde sessionStorage
  try {
    const cfg = JSON.parse(sessionStorage.getItem('cuatrola4-config') || '{}');
    if (cfg.jugadores) {
      POSICIONES_4.forEach(pos => {
        if (cfg.jugadores[pos]) {
          G4.jugadores[pos].nombre = cfg.jugadores[pos].nombre || G4.jugadores[pos].nombre;
          G4.jugadores[pos].tipo   = cfg.jugadores[pos].tipo   || G4.jugadores[pos].tipo;
        }
      });
    }
  } catch (_) { /* sessionStorage vacío o inválido: usa defaults */ }

  g4ActualizarNombres();

  // Iniciar audio al primer gesto
  if (typeof audioGesto === 'function') {
    document.addEventListener('click',      audioGesto, { once: true });
    document.addEventListener('touchstart', audioGesto, { once: true });
  }

  iniciarMano4();
});

// ─── Inicio de mano ───────────────────────────────────────────────────────────

function iniciarMano4() {
  G4.bloqueado        = true;
  G4.bazaActual       = [];
  G4.cartasGanadasA   = [];
  G4.cartasGanadasB   = [];
  G4.bazasA           = 0;
  G4.bazasB           = 0;
  G4.ultimaBazaEquipo = null;
  G4.cartasJugadas    = [];
  G4.contrato         = null;
  G4.cantesA          = 0;
  G4.cantesB          = 0;
  POSICIONES_4.forEach(pos => G4.cantesDeclarados[pos] = new Set());

  // Sur siempre lidera la primera baza de la mano
  G4.turno      = 'sur';
  G4.ordenTurno = ordenBaza4('sur');

  // Repartir
  const reparto = repartir4(crearBaraja());
  POSICIONES_4.forEach(pos => G4.jugadores[pos].mano = reparto.manos[pos]);
  G4.triunfo      = reparto.triunfo;
  G4.triunfoCarta = reparto.triunfoCarta;

  // Actualizar UI inicial
  g4RenderTriunfo(G4.triunfoCarta, G4.triunfo);
  g4RenderMarcador();
  g4RenderPuntosMano();
  g4RenderContrato(null);
  g4ActualizarUI();

  // Abrir panel de apuestas para el humano
  g4MostrarPanelApuesta();
}

// ─── Apuestas ─────────────────────────────────────────────────────────────────

/**
 * El jugador humano elige su apuesta.
 * A continuación los 3 bots responden con un pequeño retardo cada uno.
 */
function g4HumanoApuesta(tipo) {
  // Ocultar botones para que el humano no pueda pulsar de nuevo
  const botones = document.getElementById('g4-apuesta-botones');
  if (botones) botones.style.display = 'none';

  // Mostrar la apuesta del humano en el log
  g4LogApuesta(G4.jugadores.sur.nombre, tipo);

  // Estado de la ronda de apuestas
  let mejorTipo   = tipo;
  let mejorEquipo = (tipo !== 'paso') ? 'A' : null;

  // Los bots apuestan en orden: Este → Norte → Oeste
  const botsOrden = ['este', 'norte', 'oeste'];
  let delay = 650;

  botsOrden.forEach(pos => {
    setTimeout(() => {
      const apuestaBot = decidirApuesta4(G4.jugadores[pos].mano, G4.triunfo, mejorTipo);

      g4LogApuesta(G4.jugadores[pos].nombre, apuestaBot);

      // ¿Este bot supera la mejor apuesta actual?
      if (apuestaBot !== 'paso' && ORDEN_AP4[apuestaBot] > ORDEN_AP4[mejorTipo]) {
        mejorTipo   = apuestaBot;
        mejorEquipo = EQUIPOS_4[pos];
      }

      // Tras el último bot, cerrar la fase de apuestas
      if (pos === 'oeste') {
        setTimeout(() => g4CerrarApuesta(mejorTipo, mejorEquipo), 900);
      }
    }, delay);
    delay += 650;
  });
}

/**
 * Determina el contrato final y arranca el juego.
 */
function g4CerrarApuesta(mejorTipo, mejorEquipo) {
  g4OcultarPanelApuesta();

  if (mejorTipo === 'paso' || !mejorEquipo) {
    G4.contrato = { equipo: null, tipo: 'paso', valor: 1 };
    g4Mensaje('Todos pasan — se juega a puntos de cartas', 'info');
  } else {
    G4.contrato = { equipo: mejorEquipo, tipo: mejorTipo, valor: VALOR_AP4[mejorTipo] };
    const eq = mejorEquipo === 'A'
      ? `${G4.jugadores.sur.nombre} & ${G4.jugadores.norte.nombre}`
      : `${G4.jugadores.este.nombre} & ${G4.jugadores.oeste.nombre}`;
    g4Mensaje(`Equipo ${mejorEquipo} (${eq}) juega a ${mejorTipo.toUpperCase()} (${VALOR_AP4[mejorTipo]} pts)`, 'turno');
  }

  g4RenderContrato(G4.contrato);

  setTimeout(() => {
    G4.bloqueado = false;
    g4OcultarMensaje();
    g4ActualizarUI();
    g4IniciarTurno();
  }, 1400);
}

// ─── Ciclo de turnos ──────────────────────────────────────────────────────────

/**
 * Inicia el turno del jugador activo (humano o bot).
 */
function g4IniciarTurno() {
  if (G4.bloqueado) return;

  g4ActualizarIndicadorTurno();

  if (G4.turno === 'sur') {
    g4Mensaje('Tu turno', 'turno');
    g4ActualizarBotonCante();
  } else {
    g4RenderBotonCante(false);
    g4Mensaje(`${G4.jugadores[G4.turno].nombre} pensando…`, 'info');
    setTimeout(g4TurnoBot, 1000);
  }
}

/**
 * Lógica completa del turno de un bot:
 * 1. Comprobar si puede cantar (al salir).
 * 2. Elegir carta y jugarla.
 */
function g4TurnoBot() {
  const pos = G4.turno;
  const jug = G4.jugadores[pos];

  // ¿Puede cantar al salir?
  if (G4.bazaActual.length === 0) {
    const cantes = detectarCantesJugador(jug.mano, G4.triunfo, G4.cantesDeclarados[pos]);
    if (cantes.length > 0) {
      cantes.forEach(c => {
        G4.cantesDeclarados[pos].add(c.palo);
        if (EQUIPOS_4[pos] === 'A') G4.cantesA += c.puntos;
        else                        G4.cantesB += c.puntos;
      });

      const txt   = cantes.map(c => c.texto).join(' · ');
      const esEquA = EQUIPOS_4[pos] === 'A';
      g4Mensaje(`${jug.nombre} canta: ${txt}`, esEquA ? 'exito' : 'malo');
      g4RenderPuntosMano();

      setTimeout(g4EjecutarJugadaBot, 950);
      return;
    }
  }

  g4EjecutarJugadaBot();
}

function g4EjecutarJugadaBot() {
  const pos  = G4.turno;
  const jug  = G4.jugadores[pos];

  const carta = decidirCarta4(
    pos, jug.mano, G4.bazaActual, G4.triunfo,
    G4.cartasJugadas, G4.bazasA, G4.bazasB, G4.contrato
  );

  g4JugarCartaEnPosicion(pos, carta);
}

// ─── Jugada del humano (click en carta) ───────────────────────────────────────

function g4HumanoJuega(carta) {
  if (G4.bloqueado || G4.turno !== 'sur') return;

  const mano = G4.jugadores.sur.mano;
  if (!esJugadaLegal4(carta, mano, G4.bazaActual, G4.triunfo)) {
    g4Mensaje('Jugada no permitida (debes montar o fallar)', 'error');
    return;
  }

  g4JugarCartaEnPosicion('sur', carta);
}

// ─── Ejecutar jugada (humano o bot) ──────────────────────────────────────────

function g4JugarCartaEnPosicion(pos, carta) {
  // Quitar la carta de la mano
  G4.jugadores[pos].mano = G4.jugadores[pos].mano.filter(c => c !== carta);

  // Añadir a la baza actual
  G4.bazaActual.push({ jugador: pos, carta });
  G4.bloqueado = true;

  g4ActualizarUI();

  if (G4.bazaActual.length === 4) {
    // Baza completa
    setTimeout(g4FinalizarBaza, 950);
  } else {
    // Avanzar al siguiente jugador en el orden de esta baza
    const idxActual = G4.ordenTurno.indexOf(pos);
    G4.turno     = G4.ordenTurno[(idxActual + 1) % G4.ordenTurno.length];
    G4.bloqueado = false; // el turno protege al humano; no bloqueamos el arranque del bot

    g4ActualizarUI();
    g4IniciarTurno();
  }
}

// ─── Cante del humano ─────────────────────────────────────────────────────────

function g4HumanoCanta() {
  if (G4.bloqueado || G4.turno !== 'sur' || G4.bazaActual.length !== 0) return;

  const cantes = detectarCantesJugador(
    G4.jugadores.sur.mano, G4.triunfo, G4.cantesDeclarados.sur
  );
  if (cantes.length === 0) return;

  cantes.forEach(c => {
    G4.cantesA += c.puntos;
    G4.cantesDeclarados.sur.add(c.palo);
  });

  const texto = cantes.map(c => c.texto).join(' · ');
  g4Mensaje(`¡Cantas ${texto}!`, 'exito');
  g4RenderPuntosMano();
  g4ActualizarBotonCante();
}

function g4ActualizarBotonCante() {
  const cantes = G4.bazaActual.length === 0 && G4.turno === 'sur' && !G4.bloqueado
    ? detectarCantesJugador(G4.jugadores.sur.mano, G4.triunfo, G4.cantesDeclarados.sur)
    : [];
  g4RenderBotonCante(cantes.length > 0);
}

// ─── Finalizar baza ───────────────────────────────────────────────────────────

function g4FinalizarBaza() {
  const posGanador = resolverBaza4(G4.bazaActual, G4.triunfo);
  const equipoGan  = EQUIPOS_4[posGanador];
  const cartasBaza = G4.bazaActual.map(j => j.carta);

  // Acumular cartas jugadas (memoria de la IA)
  G4.cartasJugadas.push(...cartasBaza);
  G4.ultimaBazaEquipo = equipoGan;

  if (equipoGan === 'A') {
    G4.cartasGanadasA.push(...cartasBaza);
    G4.bazasA++;
    const label = posGanador === 'sur'
      ? '¡Ganas la baza!'
      : `${G4.jugadores[posGanador].nombre} gana la baza (Equipo A)`;
    g4Mensaje(label, 'exito');
  } else {
    G4.cartasGanadasB.push(...cartasBaza);
    G4.bazasB++;
    g4Mensaje(`${G4.jugadores[posGanador].nombre} gana la baza (Equipo B)`, 'malo');
  }

  g4RenderPuntosMano();

  setTimeout(() => {
    G4.bazaActual = [];

    // El ganador lidera la siguiente baza
    G4.turno      = posGanador;
    G4.ordenTurno = ordenBaza4(posGanador);

    // ¿Se acabaron las cartas?
    if (G4.jugadores.sur.mano.length === 0) {
      g4FinalizarMano();
      return;
    }

    G4.bloqueado = false; // mismo motivo: no bloquear el arranque del turno del bot
    g4ActualizarUI();
    g4IniciarTurno();
  }, 1500);
}

// ─── Fin de mano ──────────────────────────────────────────────────────────────

function g4FinalizarMano() {
  const { ptA, ptB } = calcularPuntosEquipo(
    G4.cartasGanadasA, G4.cartasGanadasB,
    G4.ultimaBazaEquipo,
    G4.cantesA, G4.cantesB
  );

  const c = G4.contrato;
  let ptPartidaA = 0, ptPartidaB = 0, textoContrato = '';

  if (!c || c.tipo === 'paso') {
    // Gana quien tenga más puntos de cartas
    if (ptA > ptB) {
      ptPartidaA   = 1;
      textoContrato = 'Equipo A gana la mano (+1 punto)';
    } else if (ptB > ptA) {
      ptPartidaB   = 1;
      textoContrato = 'Equipo B gana la mano (+1 punto)';
    } else {
      textoContrato = 'Empate — sin puntos de partida';
    }
  } else {
    const bazasContratante = c.equipo === 'A' ? G4.bazasA : G4.bazasB;
    const cumplido = c.tipo === 'quintola'
      ? bazasContratante === 5
      : bazasContratante >= 4;

    if (cumplido) {
      if (c.equipo === 'A') { ptPartidaA = c.valor; textoContrato = `¡Equipo A cumple ${c.tipo}! +${c.valor} pts`; }
      else                  { ptPartidaB = c.valor; textoContrato = `¡Equipo B cumple ${c.tipo}! +${c.valor} pts`; }
    } else {
      if (c.equipo === 'A') { ptPartidaB = c.valor; textoContrato = `Equipo A no cumple — Equipo B +${c.valor} pts`; }
      else                  { ptPartidaA = c.valor; textoContrato = `Equipo B no cumple — Equipo A +${c.valor} pts`; }
    }
  }

  G4.puntosA += ptPartidaA;
  G4.puntosB += ptPartidaB;
  g4RenderMarcador();

  // ¿Hay ganador?
  if (G4.puntosA >= META4 || G4.puntosB >= META4) {
    g4FinalizarPartida();
    return;
  }

  // Desglose para el modal
  const ptCartasA = G4.cartasGanadasA.reduce((s, c) => s + puntosCartaFn(c.valor), 0);
  const ptCartasB = G4.cartasGanadasB.reduce((s, c) => s + puntosCartaFn(c.valor), 0);

  let resumen = `<strong>Bazas:</strong> A: ${G4.bazasA} · B: ${G4.bazasB}<br>`;
  resumen += `Cartas: A: ${ptCartasA} · B: ${ptCartasB}`;
  if (G4.cantesA) resumen += ` · Cante A: +${G4.cantesA}`;
  if (G4.cantesB) resumen += ` · Cante B: +${G4.cantesB}`;
  resumen += `<br>Última baza: Equipo ${G4.ultimaBazaEquipo} (+10 pts)<br><br>`;
  resumen += `<strong>${textoContrato}</strong><br>`;
  resumen += `Partida: A <strong>${G4.puntosA}</strong> — B <strong>${G4.puntosB}</strong> (meta: ${META4})`;

  g4Modal('Fin de mano', resumen, 'Siguiente mano', () => {
    g4OcultarModal();
    iniciarMano4();
  });
}

// ─── Fin de partida ───────────────────────────────────────────────────────────

function g4FinalizarPartida() {
  const ganadorEq = G4.puntosA >= META4 ? 'A' : 'B';
  const nombresA  = `${G4.jugadores.sur.nombre} & ${G4.jugadores.norte.nombre}`;
  const nombresB  = `${G4.jugadores.este.nombre} & ${G4.jugadores.oeste.nombre}`;
  const esA       = ganadorEq === 'A';

  const titulo = `¡Equipo ${ganadorEq} gana la partida!`;
  const cuerpo =
    `${esA ? '🏆 ' : ''}<strong>${nombresA}</strong>: ${G4.puntosA} pts<br>` +
    `${!esA ? '🏆 ' : ''}<strong>${nombresB}</strong>: ${G4.puntosB} pts`;

  g4Modal(titulo, cuerpo, 'Nueva partida', () => {
    g4OcultarModal();
    G4.puntosA = 0;
    G4.puntosB = 0;
    iniciarMano4();
  });
}

// ─── Render general ───────────────────────────────────────────────────────────

function g4ActualizarUI() {
  g4RenderManoHumano(
    G4.jugadores.sur.mano,
    G4.bazaActual,
    G4.triunfo,
    G4.turno,
    G4.bloqueado,
    g4HumanoJuega
  );
  g4RenderManoBots();
  g4RenderBaza(G4.bazaActual);
  g4ActualizarIndicadorTurno();
}
