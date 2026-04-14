// ui4.js — Renderizado de la interfaz para 4 jugadores
// Depende de: baraja.js (getNombreCarta), reglas4.js, G4 (main4.js)

// ─── Manos ────────────────────────────────────────────────────────────────────

/**
 * Renderiza la mano del jugador humano (Sur).
 * Las cartas legales tienen onclick; las ilegales se atenúan.
 */
function g4RenderManoHumano(mano, baza, triunfo, turno, bloqueado, onJugar) {
  const cont  = document.getElementById('mano-sur');
  const panel = document.getElementById('g4-sur');
  if (!cont) return;
  cont.innerHTML = '';

  const surSentado = (G4.parSentado === 'sur');
  if (panel) panel.classList.toggle('g4-panel-sentado', surSentado);

  if (surSentado) {
    const lbl = document.createElement('span');
    lbl.className   = 'g4-sentado-label';
    lbl.textContent = 'No juegas esta mano';
    cont.appendChild(lbl);
    return;
  }

  mano.forEach(carta => {
    const legal = !bloqueado && turno === 'sur'
      && esJugadaLegal4(carta, mano, baza, triunfo);

    const img = document.createElement('img');
    img.src       = carta.imagen;
    img.className = 'carta' + (legal ? ' carta-jugable' : ' carta-no-legal');
    img.title     = getNombreCarta(carta);
    if (legal) img.addEventListener('click', () => onJugar(carta));
    cont.appendChild(img);
  });
}

/**
 * Renderiza las manos de los 3 bots.
 * El repartidor muestra su carta de triunfo boca arriba.
 * El parSentado se muestra atenuado con etiqueta "No juega".
 */
function g4RenderManoBots() {
  ['norte', 'este', 'oeste'].forEach(pos => {
    const panel = document.getElementById(`g4-${pos}`);
    const cont  = document.getElementById(`mano-${pos}`);
    if (!cont) return;

    const sentado = (pos === G4.parSentado);

    // Marcar el panel visualmente si el jugador está sentado
    if (panel) panel.classList.toggle('g4-panel-sentado', sentado);

    cont.innerHTML = '';

    if (sentado) {
      // No muestra cartas — solo una etiqueta
      const lbl = document.createElement('span');
      lbl.className   = 'g4-sentado-label';
      lbl.textContent = 'No juega';
      cont.appendChild(lbl);
      return;
    }

    G4.jugadores[pos].mano.forEach(carta => {
      const img = document.createElement('img');
      const esTriunfo = (pos === G4.repartidor && carta === G4.triunfoCarta);
      img.src       = esTriunfo ? carta.imagen : 'Baraja cartas españolas/back.PNG';
      img.className = 'carta carta-oculta' + (esTriunfo ? ' carta-triunfo-rep' : '');
      if (esTriunfo) img.title = getNombreCarta(carta);
      cont.appendChild(img);
    });
  });
}

// ─── Baza ─────────────────────────────────────────────────────────────────────

/**
 * Renderiza la baza actual en la disposición en cruz (Norte arriba,
 * Sur abajo, Oeste izquierda, Este derecha).
 */
function g4RenderBaza(baza) {
  // Limpiar slots
  ['sur', 'norte', 'este', 'oeste'].forEach(pos => {
    const slot = document.getElementById(`g4-baza-${pos}`);
    if (slot) slot.innerHTML = '';
  });

  baza.forEach(({ jugador, carta }) => {
    const slot = document.getElementById(`g4-baza-${jugador}`);
    if (!slot) return;

    const img = document.createElement('img');
    img.src       = carta.imagen;
    img.className = 'carta';
    img.title     = getNombreCarta(carta);
    slot.appendChild(img);
  });
}

// ─── Pinta: se muestra en el área de contrato cuando no hay apuesta aún ───────

function g4RenderPintaBar(_triunfo) {
  // Muestra la pinta en el área de contrato (estado inicial antes de apostar)
  g4RenderContrato(null);
}

// ─── Marcador ─────────────────────────────────────────────────────────────────

function g4RenderMarcador() {
  const elA    = document.getElementById('pts-equipo-a');
  const elB    = document.getElementById('pts-equipo-b');
  const elMeta = document.querySelector('.g4-marcador-meta');

  const enMano = (G4.bazasA + G4.bazasB) > 0;

  if (enMano) {
    // Durante la mano: mostrar bazas ganadas
    if (elA)    elA.textContent    = G4.bazasA;
    if (elB)    elB.textContent    = G4.bazasB;
    if (elMeta) elMeta.textContent = '/5';
  } else {
    // Entre manos: mostrar puntos de partida
    if (elA)    elA.textContent    = G4.puntosA;
    if (elB)    elB.textContent    = G4.puntosB;
    if (elMeta) elMeta.textContent = '/21';
  }
}

function g4RenderPuntosMano() {
  const el = document.getElementById('g4-puntos-mano');
  if (!el) return;

  const ptA = G4.cartasGanadasA.reduce((s, c) => s + puntosCartaFn(c.valor), 0) + G4.cantesA;
  const ptB = G4.cartasGanadasB.reduce((s, c) => s + puntosCartaFn(c.valor), 0) + G4.cantesB;

  let txt = `Esta mano — A: ${ptA} · B: ${ptB}`;
  if (G4.cantesA) txt += ` (cante A: +${G4.cantesA})`;
  if (G4.cantesB) txt += ` (cante B: +${G4.cantesB})`;
  el.textContent = txt;
}

function g4RenderContrato(contrato) {
  const el = document.getElementById('g4-contrato-info');
  if (!el) return;

  if (!contrato) {
    el.textContent = G4.triunfo ? `Pinta: ${G4.triunfo}` : '';
    el.className   = 'contrato-info';
    return;
  }

  const iconos = { paso: '·', solo: '◆', cuatrola: '◆◆◆◆', quintola: '◆◆◆◆◆' };
  const quien  = contrato.equipo ? `Equipo ${contrato.equipo}` : '—';
  el.textContent = `${iconos[contrato.tipo] ?? '◆'} ${contrato.tipo.toUpperCase()} (${quien}) · ${contrato.valor} pt`;
  el.className   = `contrato-info contrato-${contrato.tipo}`;
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

function g4Mensaje(texto, tipo = 'info') {
  const el = document.getElementById('g4-mensaje');
  if (!el) return;
  el.textContent = texto;
  el.className   = `mensaje mensaje-${tipo}`;
  el.style.display = 'block';
}

function g4OcultarMensaje() {
  const el = document.getElementById('g4-mensaje');
  if (el) el.style.display = 'none';
}

// ─── Botón CANTA ─────────────────────────────────────────────────────────────

/**
 * Actualiza el botón CANTA con la etiqueta del cante disponible.
 * @param {object|null} cante  - El cante a declarar ({ puntos, palo }) o null si no hay
 */
function g4RenderBotonCante(cante) {
  const btn = document.getElementById('g4-btn-canta');
  if (!btn) return;
  if (cante) {
    btn.textContent = cante.puntos === 40 ? 'CANTA 40' : `CANTA 20 ${cante.palo}`;
    btn.classList.add('canta-activo');
    btn.classList.remove('canta-inactivo');
  } else {
    btn.textContent = 'CANTA';
    btn.classList.add('canta-inactivo');
    btn.classList.remove('canta-activo');
  }
}

// ─── Indicador de turno (puntito dorado) ─────────────────────────────────────

function g4ActualizarIndicadorTurno() {
  // Dots en los paneles de jugador
  POSICIONES_4.forEach(pos => {
    const dot = document.getElementById(`turno-${pos}`);
    if (!dot) return;
    dot.classList.toggle('turno-activo', G4.turno === pos);
  });

  // Label de turno en la barra inferior
  const label = document.getElementById('g4-turno-nombre-bar');
  const dot   = document.getElementById('g4-turno-dot-bar');
  if (label) {
    label.textContent = G4.turno === 'sur'
      ? 'Tu turno'
      : G4.jugadores[G4.turno].nombre;
  }
  if (dot) {
    dot.classList.toggle('turno-activo', true); // siempre visible
  }
}

// ─── Nombres e iniciales ──────────────────────────────────────────────────────

function g4ActualizarNombres() {
  POSICIONES_4.forEach(pos => {
    const jug       = G4.jugadores[pos];
    const elNombre  = document.getElementById(`nombre-${pos}`);
    const elInicial = document.getElementById(`inicial-${pos}`);
    const elImg     = document.getElementById(`img-avatar-${pos}`);
    if (elNombre)  elNombre.textContent  = jug.nombre;
    if (jug.avatar && elImg) {
      elImg.src          = jug.avatar;
      elImg.style.display = 'block';
      if (elInicial) elInicial.style.display = 'none';
    } else {
      if (elImg)     elImg.style.display     = 'none';
      if (elInicial) elInicial.style.display = '';
      if (elInicial) elInicial.textContent   = (jug.nombre || pos)[0].toUpperCase();
    }
  });
}

// ─── Panel de apuestas ────────────────────────────────────────────────────────

function g4MostrarPanelApuesta() {
  const panel      = document.getElementById('g4-apuesta-panel');
  const triunfoEl  = document.getElementById('g4-ap-triunfo');
  const triunfoImg = document.getElementById('g4-ap-triunfo-img');
  const log        = document.getElementById('g4-apuesta-log');
  const botones    = document.getElementById('g4-apuesta-botones');

  if (triunfoEl)  triunfoEl.textContent = G4.triunfo ? G4.triunfo.toUpperCase() : '';
  if (triunfoImg && G4.triunfoCarta) {
    triunfoImg.src = G4.triunfoCarta.imagen;
    triunfoImg.alt = getNombreCarta(G4.triunfoCarta);
  }
  if (log)     log.innerHTML         = '';
  if (botones) botones.style.display = 'flex';
  if (panel)   panel.style.display   = 'flex';
}

function g4OcultarPanelApuesta() {
  const panel = document.getElementById('g4-apuesta-panel');
  if (panel) panel.style.display = 'none';
}

/**
 * Añade una línea al log de apuestas que muestra qué apostó cada bot.
 */
function g4LogApuesta(nombre, tipo) {
  const log = document.getElementById('g4-apuesta-log');
  if (!log) return;

  const iconos = { paso: '·', cuatrola: '◆◆◆◆', quintola: '◆◆◆◆◆' };
  const div = document.createElement('div');
  div.className = `g4-apuesta-log-item g4-log-${tipo}`;
  div.textContent = `${nombre}: ${tipo.toUpperCase()} ${iconos[tipo]}`;
  log.appendChild(div);
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function g4Modal(titulo, texto, btnTexto, onBtn) {
  const modal = document.getElementById('g4-modal');
  document.getElementById('g4-modal-titulo').textContent = titulo;
  document.getElementById('g4-modal-texto').innerHTML    = texto;
  const btn = document.getElementById('g4-modal-btn');
  btn.textContent = btnTexto;
  btn.onclick     = onBtn;
  modal.style.display = 'flex';
}

function g4OcultarModal() {
  document.getElementById('g4-modal').style.display = 'none';
}
