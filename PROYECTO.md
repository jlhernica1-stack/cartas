# Juegos de Cartas Españolas

Aplicación web de juegos de cartas española, sin frameworks, ejecutable directamente en el navegador.

---

## Estructura de archivos

```
Proyecto cuatrola/
├── index.html                        ← Lobby principal
├── game.html                         ← Cuatrola (2 jugadores)
├── cinquillo.html                    ← Cinquillo (2 jugadores)
├── casino-vip-music-vip-...mp3       ← Música de fondo
├── Baraja cartas españolas/          ← 40 PNGs numerados (1-40) + back.PNG
├── css/
│   ├── styles.css                    ← Estilos compartidos (lobby + cuatrola)
│   └── cinquillo.css                 ← Estilos específicos del cinquillo
└── js/
    ├── audio.js                      ← Música de fondo compartida
    ├── baraja.js                     ← Mazo de 20 cartas (Cuatrola)
    ├── reglas.js                     ← Motor de reglas (Cuatrola)
    ├── ia.js                         ← IA con memoria (Cuatrola)
    ├── main.js                       ← Controlador principal (Cuatrola)
    ├── ui.js                         ← Renderizado UI (Cuatrola)
    ├── cq_baraja.js                  ← Mazo de 40 cartas (Cinquillo)
    ├── cq_ia.js                      ← IA (Cinquillo)
    ├── cq_main.js                    ← Controlador principal (Cinquillo)
    └── cq_ui.js                      ← Renderizado UI (Cinquillo)
```

---

## Imágenes de la baraja

40 PNGs numerados del 1 al 40. Organización por palo:

| Rango | Palo     | Imágenes |
|-------|----------|----------|
| 1–10  | Oros     | 1–10     |
| 11–20 | Copas    | 11–20    |
| 21–30 | Espadas  | 21–30    |
| 31–40 | Bastos   | 31–40    |

Dentro de cada palo, posición por valor:

| Posición | Carta   |
|----------|---------|
| 1        | As      |
| 2        | Dos     |
| 3        | Tres    |
| 4        | Cuatro  |
| 5        | Cinco   |
| 6        | Seis    |
| 7        | Siete   |
| 8        | Sota    |
| 9        | Caballo |
| 10       | Rey     |

Fórmula: `suitIndex * 10 + posición` → ej. As de copas = `1*10+1 = 11.PNG`

---

## Cuatrola

### Reglas implementadas

- **Mazo**: 20 cartas (As, 3, Sota, Caballo, Rey × 4 palos)
- **Reparto**: 5 cartas por jugador; la última carta de la IA define el triunfo
- **Mazo de robo**: las 10 cartas restantes se roban tras cada baza (ganador primero)
- **Meta**: 21 puntos de partida

**Jerarquía de cartas** (de mayor a menor): As · 3 · Rey · Caballo · Sota

**Puntos por carta**: As=11 · 3=10 · Rey=4 · Caballo=3 · Sota=2 · Última baza=+10

**Obligaciones al responder**:
1. Montar (ganar con el mismo palo) si se puede
2. Asistir (poner palo de salida) si no se puede montar
3. Fallar con triunfo si no se tiene el palo
4. Montar el fallo si el triunfo jugado puede superarse
5. Carta libre si no hay triunfo ni palo

### Cantes (20 y 40)

- Se declara cuando **te toca salir** (baza vacía) y tienes Rey + Caballo del mismo palo
- Botón **CANTA** siempre visible; activo (pulsa dorado) solo cuando hay cante disponible
- Triunfo = 40 puntos · Otro palo = 20 puntos
- La IA canta automáticamente al comenzar su turno de salida

### Apuestas

| Apuesta   | Condición             | Vale   |
|-----------|-----------------------|--------|
| Paso      | Más puntos de cartas  | 1 pt   |
| Cuatrola  | Ganar 4 ó 5 bazas     | 4 pts  |
| Quintola  | Ganar las 5 bazas     | 5 pts  |

- El humano apuesta primero; la IA solo puede subir la apuesta
- Si no se cumple el contrato, los puntos van al rival

### IA (Cuatrola)

La IA mantiene **memoria de todas las cartas jugadas** y toma decisiones basadas en:

**Al salir:**
- Modo agresivo (tiene contrato): arrastra con triunfos, luego juega cartas "seguras" (ninguna carta superior sigue en juego)
- Modo defensivo (rival tiene contrato): gana bazas para bloquear, guarda triunfos para responder
- Modo paso: sale con cartas seguras de palo; no gasta triunfos ni cartas preciosas (As/3) en salidas arriesgadas

**Al responder:**
- Siempre gana con la carta mínima necesaria (nunca usa el As para ganar una Sota)
- En modo paso con baza sin valor: no gasta As/3 para ganar algo que no vale nada
- Si no puede ganar: descarta lo menos valioso; nunca tira As ni 3 si puede evitarlo

**Una carta es "segura"** cuando no queda en el mazo ni en la mano rival ninguna que pueda superarla.

---

## Cinquillo

### Reglas implementadas

- **Mazo**: 40 cartas (todos los valores × 4 palos)
- **Reparto**: 20 cartas por jugador
- **Tablero**: 4 filas (palos) × 10 columnas (valores)
- **Meta**: el primero en vaciar su mano gana la ronda; gana 5 pts + cartas restantes del rival

**Orden de valores** (posición en el tablero):
As · 2 · 3 · 4 · **5** · 6 · 7 · Sota · Caballo · Rey

**Reglas de juego:**
1. Primera jugada obligatoria: **5 de oros**
2. Cualquier **5** abre su palo en el tablero
3. Las cartas extienden la secuencia desde el 5: hacia abajo (4,3,2,As) o hacia arriba (6,7,Sota,Caballo,Rey)
4. Si no se puede jugar ninguna carta, se pasa el turno

**Puntuación:**
- Ganador de ronda: +5 pts
- Bonus: +1 pt por cada carta que le quede al rival
- En caso de empate de cartas: gana quien menos cartas tenga al final

### IA (Cinquillo)

Prioridades de juego:
1. Jugar **cincos** primero (el que abre el palo más bloqueado para el rival)
2. Jugar **extremos** (As o Rey) cuando su palo ya está abierto
3. Jugar la carta del palo con más cartas en la mano (liberar el palo más cargado)

---

## Audio

- Archivo: `casino-vip-music-vip-casino-music-7-469284.mp3`
- Volumen: 28%, loop continuo
- Botón 🔊/🔇 en esquina superior derecha (ambos juegos)
- Preferencia guardada en `localStorage` (persiste entre sesiones)
- Arranca al primer gesto del usuario (política de autoplay del navegador)

---

## Tecnología

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks, sin dependencias)
- Compatible con móvil: `100dvh`, `touch-action: manipulation`, `env(safe-area-inset-*)`
- Hover solo en dispositivos con puntero: `@media (hover: hover)`

---

## Pendiente / Futuro

- [ ] **Cuatrola 4 jugadores**: 1 humano + 3 bots IA
- [ ] **Multijugador online** vía Firebase Realtime Database
- [ ] **La Ronda**: tercer juego de cartas española
- [ ] Estadísticas y historial de partidas
