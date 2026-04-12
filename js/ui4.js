// ui4.js — Renderizado de la interfaz para 4 jugadores
// Depende de: baraja.js (getNombreCarta), reglas4.js, G4 (main4.js)

// ─── Manos ────────────────────────────────────────────────────────────────────

/**
 * Renderiza la mano del jugador humano (Sur).
 * Las cartas legales tienen onclick; las ilegales se atenúan.
 */
function g4RenderManoHumano(mano, baza, triunfo, turno, bloqueado, onJugar) {
  const cont = document.getElementById('mano-sur');
  if (!cont) return;
  cont.innerHTML = '';

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
 * Renderiza las manos de los 3 bots (solo dorsos).
 */
function g4RenderManoBots() {
  ['norte', 'este', 'oeste'].forEach(pos => {
    const cont = document.getElementById(`mano-${pos}`);
    if (!cont) return;
    cont.innerHTML = '';

    G4.jugadores[pos].mano.forEach(() => {
      const img = document.createElement('img');
      img.src       = 'Baraja cartas españolas/back.PNG';
      img.className = 'carta carta-oculta';
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

// ─── Triunfo ──────────────────────────────────────────────────────────────────

function g4RenderTriunfo(triunfoCarta, triunfo) {
  const area  = document.getElementById('g4-triunfo-area');
  const img   = document.getElementById('g4-triunfo-carta');
  const label = document.getElementById('g4-triunfo-label');
  if (!area) return;

  if (triunfoCarta) {
    img.src         = triunfoCarta.imagen;
    img.title       = getNombreCarta(triunfoCarta);
    label.textContent = `Triunfo: ${triunfo}`;
    area.style.display = 'flex';
  } else {
    area.style.display = 'none';
  }
}

// ─── Marcador ─────────────────────────────────────────────────────────────────

function g4RenderMarcador() {
  const elA = document.getElementById('pts-equipo-a');
  const elB = document.getElementById('pts-equipo-b');
  if (elA) elA.textContent = G4.puntosA;
  if (elB) elB.textContent = G4.puntosB;
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
    el.textContent = '';
    el.className   = 'contrato-info';
    return;
  }

  const iconos = { paso: '·', cuatrola: '◆◆◆◆', quintola: '◆◆◆◆◆' };
  const quien  = contrato.equipo ? `Equipo ${contrato.equipo}` : '—';
  el.textContent = `${iconos[contrato.tipo]} ${contrato.tipo.toUpperCase()} (${quien}) · ${contrato.valor} pt`;
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

function g4RenderBotonCante(activo) {
  const btn = document.getElementById('g4-btn-canta');
  if (!btn) return;
  if (activo) {
    btn.classList.add('canta-activo');
    btn.classList.remove('canta-inactivo');
  } else {
    btn.classList.add('canta-inactivo');
    btn.classList.remove('canta-activo');
  }
}

// ─── Indicador de turno (puntito dorado) ─────────────────────────────────────

function g4ActualizarIndicadorTurno() {
  POSICIONES_4.forEach(pos => {
    const dot = document.getElementById(`turno-${pos}`);
    if (!dot) return;
    if (G4.turno === pos) {
      dot.classList.add('turno-activo');
    } else {
      dot.classList.remove('turno-activo');
    }
  });
}

// ─── Nombres e iniciales ──────────────────────────────────────────────────────

function g4ActualizarNombres() {
  POSICIONES_4.forEach(pos => {
    const jug     = G4.jugadores[pos];
    const elNombre  = document.getElementById(`nombre-${pos}`);
    const elInicial = document.getElementById(`inicial-${pos}`);
    if (elNombre)  elNombre.textContent  = jug.nombre;
    if (elInicial) elInicial.textContent = (jug.nombre || pos)[0].toUpperCase();
  });
}

// ─── Panel de apuestas ────────────────────────────────────────────────────────

function g4MostrarPanelApuesta() {
  const panel    = document.getElementById('g4-apuesta-panel');
  const triunfoEl = document.getElementById('g4-ap-triunfo');
  const log      = document.getElementById('g4-apuesta-log');
  const botones  = document.getElementById('g4-apuesta-botones');

  if (triunfoEl) triunfoEl.textContent = G4.triunfo ? G4.triunfo.toUpperCase() : '';
  if (log)    log.innerHTML    = '';
  if (botones) botones.style.display = 'flex';
  if (panel)  panel.style.display  = 'flex';
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
