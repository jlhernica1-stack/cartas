// cq_ui.js — UI para Cinquillo

const PALO_ICONO = { oros: '🟡', copas: '🔴', espadas: '⚔️', bastos: '🌿' };

// ─── Tablero ──────────────────────────────────────────────────────────────────

function cqRenderTablero(mesa, manoHumano) {
  CQ_PALOS.forEach(palo => {
    const row = document.getElementById(`row-${palo}`);
    if (!row) return;
    row.innerHTML = '';

    CQ_VALORES.forEach(valor => {
      const slot = document.createElement('div');
      slot.className = 'cq-slot';
      if (valor === 5) slot.classList.add('cq-slot-centro');

      if (mesa[palo].has(valor)) {
        // Carta jugada en el tablero
        const img = document.createElement('img');
        img.src = cqGetImagen(palo, valor);
        img.className = 'cq-carta-mesa';
        img.title = `${CQ_NOMBRES[valor]} de ${palo}`;
        slot.classList.add('jugada');
        slot.appendChild(img);
      }

      row.appendChild(slot);
    });
  });
}

// ─── Mano IA ──────────────────────────────────────────────────────────────────

function cqRenderManoIA(mano) {
  const el = document.getElementById('cq-mano-ia');
  if (!el) return;
  el.innerHTML = '';
  // Mostrar dorsos (todos, el contenedor tiene scroll)
  for (let i = 0; i < mano.length; i++) {
    const img = document.createElement('img');
    img.src = 'Baraja cartas españolas/back.PNG';
    img.className = 'cq-carta-mano cq-carta-oculta';
    el.appendChild(img);
  }
  document.getElementById('cq-num-ia').textContent = mano.length;
}

// ─── Mano jugador ─────────────────────────────────────────────────────────────

function cqRenderManoHumano(mano, mesa, bloqueado, onJugar) {
  const el = document.getElementById('cq-mano-humano');
  if (!el) return;
  el.innerHTML = '';

  // Ordenar: primero por palo, luego por rango
  const ordenada = [...mano].sort((a, b) => {
    const pi = CQ_PALOS.indexOf(a.palo) - CQ_PALOS.indexOf(b.palo);
    return pi !== 0 ? pi : cqRank(a.valor) - cqRank(b.valor);
  });

  ordenada.forEach(carta => {
    const legal = !bloqueado && cqEsLegal(carta, mesa);
    const img = document.createElement('img');
    img.src = carta.imagen;
    img.className = 'cq-carta-mano' + (legal ? ' cq-jugable' : ' cq-no-legal');
    img.title = cqGetNombre(carta);
    if (legal) img.addEventListener('click', () => onJugar(carta));
    el.appendChild(img);
  });

  document.getElementById('cq-num-humano').textContent = mano.length;
}

// ─── Marcador ─────────────────────────────────────────────────────────────────

function cqRenderMarcador(ptH, ptIA, meta) {
  document.getElementById('cq-pts-humano').textContent = ptH;
  document.getElementById('cq-pts-ia').textContent = ptIA;
  document.getElementById('cq-meta').textContent = `Meta: ${meta} pts`;
}

// ─── Mensaje ──────────────────────────────────────────────────────────────────

function cqMensaje(txt, tipo = 'info') {
  const el = document.getElementById('cq-mensaje');
  if (!el) return;
  el.textContent = txt;
  el.className = `cq-mensaje mensaje-${tipo}`;
  el.style.display = 'block';
}

function cqOcultarMensaje() {
  const el = document.getElementById('cq-mensaje');
  if (el) el.style.display = 'none';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function cqModal(titulo, texto, btnTxt, onBtn) {
  document.getElementById('cq-modal-titulo').textContent = titulo;
  document.getElementById('cq-modal-texto').innerHTML = texto;
  const btn = document.getElementById('cq-modal-btn');
  btn.textContent = btnTxt;
  btn.onclick = onBtn;
  document.getElementById('cq-modal').style.display = 'flex';
}

function cqCerrarModal() {
  document.getElementById('cq-modal').style.display = 'none';
}
