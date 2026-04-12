// cq_main.js — Controlador del Cinquillo

const CQ_META = 20; // puntos para ganar la partida

const CQ = {
  puntosHumano: 0,
  puntosIA: 0,

  manoHumano: [],
  manoIA: [],

  mesa: null, // { oros: Set, copas: Set, espadas: Set, bastos: Set }

  turno: null,     // 'humano' | 'ia'
  bloqueado: false,
  pasesConsecutivos: 0, // para detectar bloqueo total
};

function cqMesaVacia() {
  return {
    oros: new Set(), copas: new Set(),
    espadas: new Set(), bastos: new Set()
  };
}

// ─── Inicio de ronda ──────────────────────────────────────────────────────────

function cqIniciarRonda() {
  CQ.bloqueado = false;
  CQ.pasesConsecutivos = 0;
  CQ.mesa = cqMesaVacia();

  const baraja = cqCrearBaraja();
  const reparto = cqRepartir(baraja);
  CQ.manoHumano = reparto.manoHumano;
  CQ.manoIA     = reparto.manoIA;

  // Sale quien tenga el 5 de oros
  const humanoTiene5Oros = CQ.manoHumano.some(c => c.valor === 5 && c.palo === 'oros');
  CQ.turno = humanoTiene5Oros ? 'humano' : 'ia';

  cqRenderMarcador(CQ.puntosHumano, CQ.puntosIA, CQ_META);
  cqActualizarUI();

  if (CQ.turno === 'humano') {
    cqMensaje('¡Tú tienes el 5 de oros! Empieza tú.', 'turno');
  } else {
    cqMensaje('La IA tiene el 5 de oros. Sale ella.', 'info');
    setTimeout(cqTurnoIA, 1200);
  }
}

// ─── Turno humano ─────────────────────────────────────────────────────────────

function cqHumanoJuega(carta) {
  if (CQ.bloqueado || CQ.turno !== 'humano') return;

  if (!cqEsLegal(carta, CQ.mesa)) {
    cqMensaje('Esa carta no es legal ahora', 'error');
    return;
  }

  cqJugarCarta('humano', carta);
}

// ─── Turno IA ─────────────────────────────────────────────────────────────────

function cqTurnoIA() {
  const carta = cqDecidirCarta(CQ.manoIA, CQ.mesa);

  if (!carta) {
    // IA pasa
    CQ.pasesConsecutivos++;
    cqMensaje('La IA pasa.', 'malo');

    if (cqBloqueoTotal()) {
      setTimeout(cqFinRonda, 1000);
    } else {
      CQ.turno = 'humano';
      CQ.bloqueado = false;
      setTimeout(() => {
        cqMensaje('Tu turno', 'turno');
        cqActualizarUI();
      }, 900);
    }
    return;
  }

  CQ.pasesConsecutivos = 0;
  setTimeout(() => {
    cqJugarCarta('ia', carta);
  }, 800);
}

// ─── Jugar carta ─────────────────────────────────────────────────────────────

function cqJugarCarta(jugador, carta) {
  CQ.pasesConsecutivos = 0;

  // Colocar en mesa
  CQ.mesa[carta.palo].add(carta.valor);

  // Quitar de la mano
  if (jugador === 'humano') {
    CQ.manoHumano = CQ.manoHumano.filter(c => c !== carta);
  } else {
    CQ.manoIA = CQ.manoIA.filter(c => c !== carta);
  }

  cqActualizarUI();

  // ¿Alguien se quedó sin cartas?
  if (CQ.manoHumano.length === 0 || CQ.manoIA.length === 0) {
    setTimeout(cqFinRonda, 600);
    return;
  }

  // Cambiar turno
  CQ.turno = jugador === 'humano' ? 'ia' : 'humano';

  if (CQ.turno === 'humano') {
    const legales = cqCartasLegales(CQ.manoHumano, CQ.mesa);
    if (legales.length === 0) {
      // Humano pasa automáticamente
      CQ.pasesConsecutivos++;
      cqMensaje('Sin movimiento, pasas.', 'malo');

      if (cqBloqueoTotal()) {
        setTimeout(cqFinRonda, 1000);
      } else {
        CQ.turno = 'ia';
        setTimeout(cqTurnoIA, 1100);
      }
    } else {
      CQ.bloqueado = false;
      cqMensaje('Tu turno', 'turno');
      cqActualizarUI(); // re-renderizar con el turno y bloqueado ya actualizados
    }
  } else {
    cqMensaje('IA pensando...', 'info');
    CQ.bloqueado = true;
    setTimeout(cqTurnoIA, 900);
  }
}

// ─── Bloqueo total ────────────────────────────────────────────────────────────

function cqBloqueoTotal() {
  // Bloqueo si ninguno puede jugar
  const hLegales = cqCartasLegales(CQ.manoHumano, CQ.mesa).length;
  const iLegales = cqCartasLegales(CQ.manoIA, CQ.mesa).length;
  return hLegales === 0 && iLegales === 0;
}

// ─── Fin de ronda ─────────────────────────────────────────────────────────────

function cqFinRonda() {
  let ganador, ptsRonda, titulo, resumen;

  if (CQ.manoHumano.length === 0) {
    ganador = 'humano';
    ptsRonda = 5 + CQ.manoIA.length;
    CQ.puntosHumano += ptsRonda;
    titulo = '¡Ganaste la ronda!';
    resumen = `Te quedaste sin cartas.<br>+5 pts base + ${CQ.manoIA.length} cartas de la IA = <strong>+${ptsRonda} pts</strong>`;
  } else if (CQ.manoIA.length === 0) {
    ganador = 'ia';
    ptsRonda = 5 + CQ.manoHumano.length;
    CQ.puntosIA += ptsRonda;
    titulo = 'La IA gana la ronda';
    resumen = `La IA se quedó sin cartas.<br>+5 pts base + ${CQ.manoHumano.length} cartas tuyas = <strong>+${ptsRonda} pts para la IA</strong>`;
  } else {
    // Bloqueo: gana quien tenga menos cartas
    if (CQ.manoHumano.length <= CQ.manoIA.length) {
      ganador = 'humano';
      ptsRonda = CQ.manoIA.length - CQ.manoHumano.length + 5;
      CQ.puntosHumano += ptsRonda;
      titulo = 'Bloqueo — ¡Ganas por menos cartas!';
    } else {
      ganador = 'ia';
      ptsRonda = CQ.manoHumano.length - CQ.manoIA.length + 5;
      CQ.puntosIA += ptsRonda;
      titulo = 'Bloqueo — La IA gana';
    }
    resumen = `Bloqueo total. Tú: ${CQ.manoHumano.length} cartas · IA: ${CQ.manoIA.length} cartas<br><strong>+${ptsRonda} pts</strong>`;
  }

  cqRenderMarcador(CQ.puntosHumano, CQ.puntosIA, CQ_META);

  if (CQ.puntosHumano >= CQ_META || CQ.puntosIA >= CQ_META) {
    cqFinPartida();
    return;
  }

  resumen += `<br><br>Partida: Tú <strong>${CQ.puntosHumano}</strong> — IA <strong>${CQ.puntosIA}</strong> (meta: ${CQ_META})`;
  cqModal(titulo, resumen, 'Siguiente ronda', () => {
    cqCerrarModal();
    CQ.turno = ganador === 'humano' ? 'ia' : 'humano'; // pierde el que ganó (en algunas variantes); aquí rota
    cqIniciarRonda();
  });
}

function cqFinPartida() {
  const titulo  = CQ.puntosHumano >= CQ_META ? '¡HAS GANADO LA PARTIDA!' : 'La IA gana la partida';
  const cuerpo  = `Puntos finales — Tú: <strong>${CQ.puntosHumano}</strong> | IA: <strong>${CQ.puntosIA}</strong>`;
  cqModal(titulo, cuerpo, 'Nueva partida', () => {
    cqCerrarModal();
    CQ.puntosHumano = 0;
    CQ.puntosIA = 0;
    cqIniciarRonda();
  });
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function cqActualizarUI() {
  cqRenderTablero(CQ.mesa, CQ.manoHumano);
  cqRenderManoIA(CQ.manoIA);
  cqRenderManoHumano(CQ.manoHumano, CQ.mesa, CQ.bloqueado || CQ.turno !== 'humano', cqHumanoJuega);
}

// ─── Arranque ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', cqIniciarRonda);
