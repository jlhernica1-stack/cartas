# 🃏 CUATROLA — Game Design Document
> Versión 1.0 | Stack: HTML + JavaScript + Firebase

---

## 1. Concepto

**Cuatrola** es un juego de cartas tradicional de Extremadura para 2 o 4 jugadores (en parejas). El objetivo es ser el primero en llegar a **25 puntos** ganando bazas con las cartas más altas del palo de triunfo o del palo de salida.

---

## 2. Reglas del juego

### 2.1 Baraja
- Baraja española de **40 cartas** (4 palos: oros, copas, espadas, bastos)
- Cada palo: 1, 2, 3, 4, 5, 6, 7, sota (10), caballo (11), rey (12)

### 2.2 Jerarquía de cartas (de mayor a menor)
```
1 > 3 > Rey(12) > Caballo(11) > Sota(10) > 7 > 6 > 5 > 4 > 2
```
> ⚠️ El 2 es la carta más baja, el 1 (as) la más alta.

### 2.3 Reparto
- 4 jugadores: **10 cartas** cada uno
- 2 jugadores: **10 cartas** cada uno (resto del mazo fuera)
- Se voltea la **última carta repartida** → define el **palo de triunfo**

### 2.4 Desarrollo de una mano
1. Sale el jugador a la izquierda del repartidor
2. Cada jugador juega **una carta**
3. Obligación de **seguir el palo** si se tiene
4. Si no se tiene el palo, se puede **fallar con triunfo** o **descartarse**
5. Gana la baza quien jugó la carta más alta del palo de salida, o el triunfo más alto si se falló

### 2.5 Puntuación
| Evento | Puntos |
|--------|--------|
| Ganar una baza | 1 punto |
| Ganar todas las bazas (cuatrola) | Puntos dobles |
| Llegar a 25 primero | Victoria |

### 2.6 Modalidad 2vs2 (parejas)
- Parejas sentadas en diagonal
- Los puntos se suman por pareja
- Se puede hacer señas (versión avanzada, opcional)

---

## 3. Arquitectura técnica

### 3.1 Stack recomendado
```
Frontend:   HTML5 + CSS3 + JavaScript vanilla
Backend:    Firebase Realtime Database
Auth:       Firebase Auth (Google o anónimo)
Hosting:    Firebase Hosting (tier gratuito)
```

### 3.2 Estructura de datos en Firebase
```json
{
  "partidas": {
    "partida_id": {
      "estado": "esperando | jugando | terminada",
      "jugadores": {
        "uid1": { "nombre": "Juan", "mano": [], "puntos": 0 },
        "uid2": { "nombre": "María", "mano": [], "puntos": 0 }
      },
      "mazo": [],
      "triunfo": "oros",
      "turno_actual": "uid1",
      "baza_actual": [],
      "bazas_ganadas": { "uid1": 0, "uid2": 0 },
      "historial": []
    }
  },
  "salas": {
    "codigo_sala": "partida_id"
  }
}
```

### 3.3 Estimación de lecturas por partida
| Evento | Lecturas (4 jugadores) |
|--------|----------------------|
| Carta jugada | 4 |
| Baza resuelta | 4 |
| Cambio de turno | 4 |
| Total por mano (10 bazas) | ~120 |
| Partida completa (2-3 manos) | ~300-400 |

> Firebase gratuito: 50.000 lecturas/día → ~125 partidas/día sin coste

---

## 4. Estructura del código

### 4.1 Archivos principales
```
/cuatrola
  index.html          ← Pantalla principal / lobby
  game.html           ← Pantalla de juego
  /css
    styles.css        ← Estilos generales
    cartas.css        ← Estilos de cartas y mesa
  /js
    main.js           ← Inicialización y routing
    baraja.js         ← Lógica de baraja y cartas
    reglas.js         ← Motor de reglas del juego
    firebase.js       ← Conexión y sincronización
    ia.js             ← IA para juego en solitario
    ui.js             ← Renderizado de cartas y mesa
  /assets
    /cartas           ← Imágenes de cartas (SVG recomendado)
    /sonidos          ← Efectos y ambiente
```

### 4.2 Módulo `baraja.js`
```javascript
const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
// Nota: 10=sota, 11=caballo, 12=rey

// Jerarquía para comparar cartas
const JERARQUIA = [1, 3, 12, 11, 10, 7, 6, 5, 4, 2];

function crearBaraja() {
  const baraja = [];
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      baraja.push({ palo, valor });
    }
  }
  return barajar(baraja);
}

function barajar(baraja) {
  // Fisher-Yates shuffle
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  return baraja;
}

function compararCartas(carta1, carta2, triunfo, paloSalida) {
  // Devuelve 1 si carta1 gana, -1 si carta2 gana
  const esTriunfo1 = carta1.palo === triunfo;
  const esTriunfo2 = carta2.palo === triunfo;

  if (esTriunfo1 && !esTriunfo2) return 1;
  if (!esTriunfo1 && esTriunfo2) return -1;
  if (carta1.palo !== paloSalida && carta2.palo === paloSalida) return -1;
  if (carta1.palo === paloSalida && carta2.palo !== paloSalida) return 1;

  const idx1 = JERARQUIA.indexOf(carta1.valor);
  const idx2 = JERARQUIA.indexOf(carta2.valor);
  return idx1 < idx2 ? 1 : -1;
}
```

### 4.3 Módulo `reglas.js`
```javascript
function esJugadaLegal(carta, manoJugador, paloSalida, triunfo) {
  if (!paloSalida) return true; // Primera carta de la baza, cualquiera vale

  const tienePaloSalida = manoJugador.some(c => c.palo === paloSalida);
  if (tienePaloSalida) {
    return carta.palo === paloSalida; // Obligado a seguir el palo
  }
  return true; // Si no tiene el palo, puede jugar cualquier carta
}

function resolverBaza(baza, triunfo) {
  // baza = [{ jugadorId, carta }, ...]
  const paloSalida = baza[0].carta.palo;
  let ganador = baza[0];

  for (let i = 1; i < baza.length; i++) {
    const resultado = compararCartas(baza[i].carta, ganador.carta, triunfo, paloSalida);
    if (resultado === 1) ganador = baza[i];
  }

  return ganador.jugadorId;
}

function calcularPuntosMano(bazasGanadas) {
  // Devuelve puntos por jugador/pareja
  // Cuatrola: un equipo gana las 10 bazas → puntos dobles
  const total = Object.values(bazasGanadas).reduce((a, b) => a + b, 0);
  const puntos = {};

  for (const [id, bazas] of Object.entries(bazasGanadas)) {
    puntos[id] = bazas === total ? bazas * 2 : bazas; // Cuatrola
  }

  return puntos;
}
```

### 4.4 Módulo `firebase.js`
```javascript
// Escuchar cambios de partida en tiempo real
function suscribirPartida(partidaId, callback) {
  const ref = db.ref(`partidas/${partidaId}`);
  ref.on('value', snapshot => {
    callback(snapshot.val());
  });
  return () => ref.off(); // Función de limpieza
}

// Jugar una carta (actualiza todo el estado en una sola escritura)
async function jugarCarta(partidaId, jugadorId, carta) {
  const ref = db.ref(`partidas/${partidaId}`);
  const snapshot = await ref.once('value');
  const estado = snapshot.val();

  // Validar turno
  if (estado.turno_actual !== jugadorId) return { error: 'No es tu turno' };

  // Añadir carta a la baza actual
  const nuevaBaza = [...(estado.baza_actual || []), { jugadorId, carta }];
  const nuevaMano = estado.jugadores[jugadorId].mano.filter(
    c => !(c.palo === carta.palo && c.valor === carta.valor)
  );

  // Actualizar estado completo en una sola operación
  await ref.update({
    baza_actual: nuevaBaza,
    [`jugadores/${jugadorId}/mano`]: nuevaMano,
    turno_actual: calcularSiguienteTurno(estado, jugadorId)
  });
}
```

---

## 5. IA (modo solitario)

### 5.1 Niveles
| Nivel | Comportamiento |
|-------|---------------|
| Fácil | Juega carta aleatoria legal |
| Normal | Sigue el palo, falla si no tiene, guarda triunfos |
| Difícil | Recuerda cartas jugadas, infiere mano rival |

### 5.2 Lógica IA Normal
```javascript
function decidirCartaIA(mano, baza, triunfo, cartasJugadas) {
  const paloSalida = baza.length > 0 ? baza[0].carta.palo : null;

  // Si sale primero: jugar carta media (no desperdiciar as ni 3)
  if (!paloSalida) {
    return cartaMedia(mano);
  }

  // Si tiene el palo: ganar si puede, sino descartarse bajo
  const cartasPalo = mano.filter(c => c.palo === paloSalida);
  if (cartasPalo.length > 0) {
    const ganadora = cartaQueGana(cartasPalo, baza, triunfo, paloSalida);
    return ganadora || cartasPalo[cartasPalo.length - 1]; // La más baja si no puede ganar
  }

  // Si no tiene el palo: fallar con triunfo solo si vale la pena
  const triunfos = mano.filter(c => c.palo === triunfo);
  if (triunfos.length > 0 && bazaValelapena(baza)) {
    return triunfos[triunfos.length - 1]; // El triunfo más bajo
  }

  // Descartarse con la carta más baja
  return cartaMasBaja(mano);
}
```

---

## 6. UI / UX

### 6.1 Pantallas
```
1. Inicio
   ├── Crear partida (genera código de sala)
   ├── Unirse (introduce código)
   └── Jugar vs IA

2. Sala de espera
   ├── Código de sala visible (para compartir)
   ├── Lista de jugadores conectados
   └── Botón "Empezar" (solo el creador)

3. Mesa de juego
   ├── Mano del jugador (abajo)
   ├── Manos de rivales (arriba/lados, boca abajo)
   ├── Centro: baza actual
   ├── Triunfo visible (esquina)
   └── Marcador de puntos

4. Fin de partida
   ├── Resultado
   ├── Historial de manos
   └── Revancha / Nuevo juego
```

### 6.2 Diseño de cartas
- Usar SVG para las cartas → escalables y ligeras
- Baraja española de dominio público disponible en Wikipedia/Wikimedia
- Tamaño táctil mínimo: **48x48px** para zona de toque

### 6.3 Animaciones clave
```css
/* Carta jugada → vuela al centro */
.carta-jugada {
  transition: transform 0.3s ease, opacity 0.3s;
}

/* Baza ganada → se recoge hacia el ganador */
.baza-recogida {
  animation: recoger 0.5s ease forwards;
}
```

---

## 7. Features por fases

### MVP (Fase 1) — Funcional básico
- [ ] Lógica completa del juego (reglas, puntuación)
- [ ] Juego local 1vs1 en el mismo dispositivo
- [ ] UI básica con cartas
- [ ] IA nivel fácil

### Fase 2 — Online
- [ ] Firebase Auth (anónimo / Google)
- [ ] Crear sala / unirse con código
- [ ] Multijugador 1vs1 online
- [ ] Chat con frases rápidas

### Fase 3 — Social
- [ ] Modo 2vs2 parejas
- [ ] Ranking por pueblos/ciudades
- [ ] Ligas semanales
- [ ] Estadísticas personales

### Fase 4 — Identidad extremeña
- [ ] Modo "bar" (sonido ambiente)
- [ ] Expresiones locales ("¡te la llevas!", "¡esa no era!")
- [ ] Avatares tipo paisanos
- [ ] Torneos locales

---

## 8. Monetización

| Modelo | Descripción |
|--------|-------------|
| Gratis con anuncios | Banner discreto fuera de la partida |
| Sin anuncios | Pago único 1,99€ |
| Personalización | Tapetes y dorsos de cartas (0,99€ c/u) |
| Liga Premium | Torneos con premios simbólicos |

---

## 9. Recursos útiles

- **Baraja española SVG gratuita:** https://commons.wikimedia.org/wiki/Category:SVG_Spanish-suited_playing_cards
- **Firebase JS SDK:** https://firebase.google.com/docs/web/setup
- **Sonidos de bar/ambiente:** https://freesound.org
- **Referencia reglas cuatrola:** https://cuatrola.es

---

## 10. Próximos pasos

1. **Implementar `baraja.js` + `reglas.js`** y testear en consola
2. **Crear UI básica** de mesa con cartas arrastrables
3. **Conectar Firebase** y probar sincronización con 2 pestañas
4. **Añadir IA** para modo solitario
5. **Pulir UI** con animaciones y sonidos
6. **Beta cerrada** con grupo de WhatsApp extremeño 😄

---

*Documento generado como punto de partida. Las reglas pueden variar según la localidad.*
