// audio.js — Música de fondo compartida entre todos los juegos

const AUDIO = {
  elemento: null,
  reproduciendo: false,   // true SOLO después de que play() se resuelve con éxito
};

function audioInit() {
  if (AUDIO.elemento) return;

  AUDIO.elemento = new Audio('casino-vip-music-vip-casino-music-7-469284.mp3');
  AUDIO.elemento.loop   = true;
  AUDIO.elemento.volume = 0.28;

  // Si el audio se pausa por cualquier motivo, resetear el flag
  AUDIO.elemento.addEventListener('pause', () => { AUDIO.reproduciendo = false; });

  // Recuperar preferencia guardada
  const silenciado = localStorage.getItem('musica_silenciada') === 'true';
  AUDIO.elemento.muted = silenciado;
  actualizarIconoAudio();
}

function _intentarPlay() {
  AUDIO.elemento.play().then(() => {
    AUDIO.reproduciendo = true;
  }).catch(() => {
    // Bloqueado por la política de autoplay — se reintentará al primer gesto
  });
}

function audioArrancar() {
  audioInit();
  if (!AUDIO.elemento.muted && !AUDIO.reproduciendo) {
    _intentarPlay();
  }
}

// Llamar al primer gesto del usuario para desbloquear el audio en iOS/Safari
function audioGesto() {
  audioInit();
  if (!AUDIO.elemento.muted && !AUDIO.reproduciendo) {
    _intentarPlay();
  }
}

function audioToggle() {
  audioInit();
  AUDIO.elemento.muted = !AUDIO.elemento.muted;
  localStorage.setItem('musica_silenciada', AUDIO.elemento.muted);

  // Si el usuario acaba de activar el sonido, este click ES el gesto → arrancar
  if (!AUDIO.elemento.muted && !AUDIO.reproduciendo) {
    _intentarPlay();
  }

  actualizarIconoAudio();
}

function actualizarIconoAudio() {
  const btn = document.getElementById('btn-audio');
  if (!btn) return;
  btn.textContent = AUDIO.elemento && !AUDIO.elemento.muted ? '🔊' : '🔇';
  btn.title = AUDIO.elemento && !AUDIO.elemento.muted ? 'Silenciar música' : 'Activar música';
}

// Primer gesto del usuario (iOS necesita esto para desbloquear el AudioContext)
document.addEventListener('click',      audioGesto, { once: true });
document.addEventListener('touchstart', audioGesto, { once: true });

// Intento en escritorio (puede funcionar sin gesto en Chrome/Firefox)
document.addEventListener('DOMContentLoaded', audioArrancar);
