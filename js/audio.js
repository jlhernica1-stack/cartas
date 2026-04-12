// audio.js — Música de fondo compartida entre todos los juegos

const AUDIO = {
  elemento: null,
  iniciado: false,
};

function audioInit() {
  if (AUDIO.elemento) return;

  AUDIO.elemento = new Audio('casino-vip-music-vip-casino-music-7-469284.mp3');
  AUDIO.elemento.loop   = true;
  AUDIO.elemento.volume = 0.28;

  // Recuperar preferencia guardada
  const silenciado = localStorage.getItem('musica_silenciada') === 'true';
  AUDIO.elemento.muted = silenciado;
  actualizarIconoAudio();
}

function audioArrancar() {
  audioInit();
  if (!AUDIO.iniciado && !AUDIO.elemento.muted) {
    AUDIO.elemento.play().catch(() => {
      // El navegador bloqueó el autoplay — se iniciará al primer clic del usuario
    });
    AUDIO.iniciado = true;
  }
}

// Llamar al primer gesto del usuario (garantiza que el navegador deja reproducir)
function audioGesto() {
  audioInit();
  if (!AUDIO.iniciado) {
    AUDIO.elemento.play().catch(() => {});
    AUDIO.iniciado = true;
  }
}

function audioToggle() {
  audioInit();
  audioGesto(); // primer gesto si aún no había sonado
  AUDIO.elemento.muted = !AUDIO.elemento.muted;
  localStorage.setItem('musica_silenciada', AUDIO.elemento.muted);
  actualizarIconoAudio();
}

function actualizarIconoAudio() {
  const btn = document.getElementById('btn-audio');
  if (!btn) return;
  btn.textContent = AUDIO.elemento && !AUDIO.elemento.muted ? '🔊' : '🔇';
  btn.title = AUDIO.elemento && !AUDIO.elemento.muted ? 'Silenciar música' : 'Activar música';
}

// Arrancar en cuanto el usuario toca cualquier cosa en la página
document.addEventListener('click',     audioGesto, { once: true });
document.addEventListener('touchstart', audioGesto, { once: true });

// Intentar arrancar también al cargar (funciona en algunos navegadores)
document.addEventListener('DOMContentLoaded', audioArrancar);
