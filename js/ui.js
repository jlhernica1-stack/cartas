// ui.js — Renderizado de la interfaz

// ─── Manos ────────────────────────────────────────────────────────────────────

function renderManoIA(mano) {
  const contenedor = document.getElementById('mano-ia');
  contenedor.innerHTML = '';
  mano.forEach(() => {
    const img = document.createElement('img');
    img.src = 'Baraja cartas españolas/back.PNG';
    img.className = 'carta carta-oculta';
    contenedor.appendChild(img);
  });
}

function renderManoHumano(mano, baza, triunfo, turno, bloqueado, onJugar) {
  const contenedor = document.getElementById('mano-humano');
  contenedor.innerHTML = '';
  mano.forEach(carta => {
    const legal = !bloqueado && turno === 'humano' && esJugadaLegal(carta, mano, baza, triunfo);
    const img = document.createElement('img');
    img.src = carta.imagen;
    img.className = 'carta carta-humano' + (legal ? ' carta-jugable' : ' carta-no-legal');
    img.title = getNombreCarta(carta);
    if (legal) img.addEventListener('click', () => onJugar(carta));
    contenedor.appendChild(img);
  });
}

// ─── Baza ─────────────────────────────────────────────────────────────────────

function renderBaza(baza) {
  const contenedor = document.getElementById('baza-area');
  contenedor.innerHTML = '';
  baza.forEach(({ jugador, carta }) => {
    const div = document.createElement('div');
    div.className = `carta-baza carta-baza-${jugador}`;
    const img = document.createElement('img');
    img.src = carta.imagen;
    img.className = 'carta';
    img.title = getNombreCarta(carta);
    const label = document.createElement('span');
    label.className = 'baza-label';
    label.textContent = jugador === 'humano' ? 'Tú' : 'IA';
    div.appendChild(img);
    div.appendChild(label);
    contenedor.appendChild(div);
  });
}

// ─── Triunfo ──────────────────────────────────────────────────────────────────

function renderTriunfo(triunfoCarta, triunfo) {
  const area  = document.getElementById('triunfo-area');
  const img   = document.getElementById('triunfo-carta');
  const label = document.getElementById('triunfo-label');
  if (triunfoCarta) {
    img.src = triunfoCarta.imagen;
    img.title = getNombreCarta(triunfoCarta);
    label.textContent = `Triunfo: ${triunfo}`;
    area.style.display = 'flex';
  } else {
    area.style.display = 'none';
  }
}

function renderMazo(numCartas) {
  const el = document.getElementById('mazo-contador');
  if (!el) return;
  if (numCartas > 0) {
    el.textContent = `Mazo: ${numCartas}`;
    el.style.display = 'inline-block';
  } else {
    el.textContent = 'Mazo agotado';
    el.style.display = 'inline-block';
  }
}

// ─── Marcador ─────────────────────────────────────────────────────────────────

function renderMarcador(puntosHumano, puntosIA) {
  ['puntos-humano', 'puntos-humano-marcador'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = puntosHumano;
  });
  ['puntos-ia', 'puntos-ia-marcador'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = puntosIA;
  });
}

function renderPuntosMano(ptHumano, ptIA, cantesH, cantesI) {
  const el = document.getElementById('puntos-mano');
  if (!el) return;
  let txt = `Esta mano — cartas: Tú ${ptHumano} · IA ${ptIA}`;
  if (cantesH) txt += ` · cante +${cantesH}`;
  if (cantesI) txt += ` · cante IA +${cantesI}`;
  el.textContent = txt;
}

function renderContrato(contrato) {
  const el = document.getElementById('contrato-info');
  if (!el) return;
  if (!contrato) { el.textContent = ''; el.className = 'contrato-info'; return; }

  const iconos = { paso: '·', cuatrola: '◆◆◆◆', quintola: '◆◆◆◆◆' };
  const quien  = contrato.jugador === 'humano' ? 'Tú' :
                 contrato.jugador === 'ia'     ? 'IA' : '—';

  el.textContent = `${iconos[contrato.tipo]} ${contrato.tipo.toUpperCase()} (${quien}) · ${contrato.valor} pt`;
  el.className   = `contrato-info contrato-${contrato.tipo}`;
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

function mostrarMensaje(texto, tipo = 'info') {
  const el = document.getElementById('mensaje-estado');
  el.textContent = texto;
  el.className = `mensaje mensaje-${tipo}`;
  el.style.display = 'block';
}

function ocultarMensaje() {
  document.getElementById('mensaje-estado').style.display = 'none';
}

// ─── Botón de cante (siempre visible, activo solo cuando corresponde) ─────────

function renderBotonCante(activo) {
  const btn = document.getElementById('btn-canta-persistente');
  if (!btn) return;
  if (activo) {
    btn.classList.add('canta-activo');
    btn.classList.remove('canta-inactivo');
  } else {
    btn.classList.add('canta-inactivo');
    btn.classList.remove('canta-activo');
  }
}

// ─── Panel de apuestas ────────────────────────────────────────────────────────

function mostrarPanelApuesta(triunfo) {
  const panel = document.getElementById('apuesta-panel');
  const info  = document.getElementById('ap-triunfo');
  if (info) info.textContent = triunfo ? triunfo.toUpperCase() : '';
  if (panel) panel.style.display = 'flex';
}

function ocultarPanelApuesta() {
  const panel = document.getElementById('apuesta-panel');
  if (panel) panel.style.display = 'none';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function mostrarModal(titulo, texto, btnTexto, onBtn) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-texto').innerHTML = texto;
  const btn = document.getElementById('modal-btn');
  btn.textContent = btnTexto;
  btn.onclick = onBtn;
  document.getElementById('modal').style.display = 'flex';
}

function ocultarModal() {
  document.getElementById('modal').style.display = 'none';
}
