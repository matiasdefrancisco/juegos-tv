# 🎨 PARTY DRAW — Videojuego Party Game Multijugador

Videojuego casual multijugador estilo *party game* donde la pantalla principal (TV o PC) funciona como pizarra central y los celulares actúan como controles interactivos sin necesidad de instalar aplicaciones.

---

## 🚀 Inicio rápido en desarrollo

### 1. Requisitos
- Node.js 18 o superior
- npm 9 o superior

### 2. Instalación
```bash
npm install
```

### 3. Compilar el paquete compartido
`apps/web` y `apps/server` importan desde `packages/shared/dist`, así que este paso va **antes** de levantar nada.
```bash
npm run build -w @party-draw/shared
```

### 4. Levantar backend y frontend
```bash
npm run dev
```

O por separado:
- **Backend (Socket.IO + Express)**: `npm run dev -w @party-draw/server` → puerto 3001
- **Frontend (React + Vite)**: `npm run dev -w @party-draw/web` → puerto 5173

> Mientras trabajes sobre `packages/shared`, dejá corriendo `npm run dev -w @party-draw/shared` para que recompile solo.

---

## 📱 Probar con celulares en la misma red Wi-Fi

1. Abrí la app en la TV o PC usando **la IP de red de la computadora**, no `localhost`
   (ej: `http://192.168.0.10:5173`). El servidor imprime esa IP al arrancar.
   Con `localhost` el QR no le sirve a los celulares — el lobby avisa si estás en ese caso.
2. Seleccioná **CREAR PARTIDA (TV)**.
3. Configurá la partida con el botón **Configurar** (categorías, dificultad, modalidad).
4. Los jugadores escanean el QR o cargan el código de 4 caracteres.
5. Iniciá desde la TV o desde el celular del anfitrión.

---

## 🎮 Modos de juego

### Modalidad

| Modalidad | Cómo funciona |
|---|---|
| **Todos contra todos** | Cada jugador acumula su propio puntaje y todos adivinan a la vez. |
| **Equipos** | Pictionary clásico: se juega **por turnos**. Dibuja alguien de un equipo y **solo ese equipo adivina**; el resto observa. El puntaje es del equipo. |

En modo equipos cada jugador elige su equipo desde el celular, o el anfitrión los acomoda desde
la TV. Quien entra sin elegir cae automáticamente en el equipo con menos gente. La cantidad de
equipos (2 a 6) y de jugadores por equipo (1 a 8) se configura libremente.

### Modo equipos: el turno

El equipo que tiene el turno cuenta con el tiempo de la ronda y una cantidad de **intentos**
configurable (1 por defecto, como el Pictionary de mesa; también 3, 5 o sin límite).

La ronda cierra cuando pasa lo primero de estas tres cosas:
- el equipo **acierta** → suma puntos (con bonus extra si lo resolvió en el primer intento);
- el equipo **agota sus intentos** → no suma;
- se acaba el **tiempo**.

Después el turno pasa al equipo siguiente. Los jugadores del equipo rival ven en su celular una
pantalla de "estás observando" con el nombre del equipo que está jugando, y el input bloqueado.

### Carta "¡Juegan todos!"

Se activa en el lobby y sale **aleatoriamente** durante la partida (probabilidad configurable:
nunca / pocas veces / a veces / seguido). Cuando toca:

- dibuja una sola persona, pero **adivinan todos los equipos**;
- **el primero que acierta se lleva los puntos** de la ronda para su equipo, y la ronda cierra ahí;
- paga más que una ronda normal.

Se anuncia con una animación durante la cuenta regresiva, tanto en la TV como en los celulares, y
nunca sale dos rondas seguidas.

### Todos contra todos: cómo termina la ronda

| Modo | Comportamiento |
|---|---|
| **Por tiempo** | Intentos ilimitados. Cierra cuando aciertan todos **o** cuando se acaba el reloj. |
| **Por riesgo** | Un único intento por jugador, guardado sin revelar nada. Cierra cuando **todos** arriesgaron, y recién ahí se validan todas juntas. El reloj sigue como límite máximo. |

> Estos dos modos son exclusivos de "todos contra todos". En equipos el límite lo pone la
> cantidad de intentos del turno.

### Dificultad

Cada palabra del banco tiene un nivel (1 fácil / 2 medio / 3 difícil) y la dificultad elegida
determina de qué nivel salen, además de multiplicar el puntaje (×1, ×1.25, ×1.5).

### Categorías

Se eligen en el lobby, antes de empezar, y admiten selección múltiple. **La palabra siempre sale
de alguna de las categorías elegidas**: si se agotan las palabras sin usar, el sistema afloja el
nivel de dificultad y después recicla palabras, pero nunca se sale de las categorías marcadas.

La categoría **Películas** usa respuestas de varias palabras (*El Señor de los Anillos*, *Volver
al Futuro*). La validación contempla:
- respuestas de una o varias palabras,
- tildes y mayúsculas (`pingüino` = `PINGUINO`),
- artículos opcionales (`señor de los anillos` vale por *El Señor de los Anillos*),
- aliases por palabra,
- tolerancia a errores de tipeo proporcional al largo de la respuesta.

La pista en el celular muestra **una fila de guiones por palabra**, no una sola tira.

---

## 🏗️ Arquitectura del monorepo

```
/
├── package.json               # Workspaces de npm
├── packages/
│   └── shared/                # Contrato común entre cliente y servidor
│       ├── types.ts           # GameStatus, GameMode, RoundMode, Player, Team, PublicGameState
│       ├── events.ts          # CLIENT_EVENTS / SERVER_EVENTS y sus payloads
│       ├── constants.ts       # Banco de palabras, categorías, dificultades, puntaje y TIMINGS
│       └── utils.ts           # Normalización, respuestas multi-palabra, patrón de pistas
├── apps/
│   ├── server/                # Backend autoritativo Node.js + TypeScript + Socket.IO
│   │   ├── GameManager.ts     # Salas, vínculo socket↔sala y limpieza por inactividad
│   │   ├── GameRoom.ts        # Estados, equipos, turnos, timers y puntaje
│   │   ├── WordService.ts     # Selección de palabras por categoría y dificultad
│   │   ├── socketHandler.ts   # Eventos en tiempo real, permisos y anti-spoiler
│   │   └── firestore.ts       # Persistencia opcional (desactivada por defecto)
│   └── web/                   # Frontend React + Vite + Tailwind + Framer Motion
│       ├── views/             # Home, TVHostView, PlayerJoin, PlayerGame
│       ├── components/common/ # Screen, Modal, OptionGroup, GameSetupPanel, TeamBoard, Header
│       ├── components/tv/     # TVCanvas, TVLobby, TVHeader, TVRoundResult, TVScoreboard, TVGameOver
│       ├── components/mobile/ # MobileCanvas, MobileGuesser, MobileLobby, MobileResults
│       └── utils/             # canvasDraw, usePhaseCountdown, soundEffects
```

---

## 🖥️ Reglas de layout (importante al agregar pantallas)

Toda pantalla se arma con el componente `Screen`:

```tsx
<Screen header={<Header … />}>
  <ScreenContent width="md">…</ScreenContent>
</Screen>
```

- **Ninguna vista usa `h-screen` + `overflow-hidden`.** El contenedor usa `min-height: 100dvh`
  y el cuerpo scrollea cuando el contenido no entra. Así nada queda inaccesible en notebooks.
- Los **modales** (`Modal`) topan en `90dvh` y scrollean por dentro: encabezado y botones del pie
  quedan siempre visibles.
- Los textos grandes de TV usan clases fluidas (`.tv-title`, `.tv-display`, `.tv-countdown`) con
  `clamp()`, para que no tapen los controles en pantallas bajas.
- Las listas largas (jugadores, posiciones, respuestas) van dentro de `.scroll-area` con un
  `max-h-[Nvh]`, nunca con altura fija en píxeles.

---

## ⚡ Rendimiento y sincronización

- **Trazos por lotes**: el celular agrupa los puntos y los manda cada ~55 ms en vez de emitir
  punto por punto. Baja de ~60 mensajes por segundo a menos de 20.
- **Emisión `volatile`** de los trazos: si un cliente va lento, se descartan lotes viejos en vez
  de acumularlos en la cola. Es lo que evita que un celular con mala señal quede clavado.
- **Estados agrupados**: varias mutaciones seguidas (respuestas simultáneas, altas de jugadores)
  se resuelven en un solo `GAME_STATE_UPDATE` por sala.
- **Versionado de estado**: cada estado lleva un `version` incremental y el cliente descarta los
  que llegan fuera de orden.
- **Watchdog**: si el cliente pasa 12 s sin recibir estado durante una partida, pide un
  `REQUEST_SYNC`. También resincroniza al volver de segundo plano o al recuperar la red.
- **Contexto memoizado**: el value de `SocketContext` está memoizado para no re-renderizar todo
  el árbol en cada cambio.

---

## 🔒 Mecánicas clave

1. **Coordenadas normalizadas `[0..1]`**: los trazos viajan como porcentajes, así el dibujo se ve
   1:1 en cualquier resolución.
2. **Anti-spoiler estricto**: `DRAW_WORD` se emite **solo al socket del dibujante**. La TV y los
   adivinadores reciben nada más que la categoría y el patrón de letras.
3. **Anti fuerza bruta**: cooldown entre intentos y tope por ronda en modo tiempo; en modo riesgo
   directamente hay un solo intento.
4. **Permisos**: iniciar partida, cambiar configuración, avanzar turno y reiniciar quedan
   reservados al anfitrión o a la pantalla de TV. El servidor también valida de quién es el
   turno: un intento del equipo que está observando se rechaza con un motivo explícito
   (`NOT_YOUR_TURN`, `NO_ATTEMPTS_LEFT`, …) y no consume intentos.
5. **Resiliencia**:
   - Los jugadores reconectan con `sessionId` + `playerId` guardados en `localStorage`.
   - La **pantalla de TV** reconecta por código de sala (`ATTACH_TV`): recargarla no mata la
     partida, y si la sala ya no existe crea una nueva sola.
   - El anfitrión se reasigna automáticamente si el actual se va.
   - Si el dibujante se desconecta tiene unos segundos para volver antes de perder el turno.
   - Si el que se va era el último que faltaba responder, la ronda cierra igual en vez de quedar
     esperando para siempre.
6. **Todas las fases avanzan solas**, así que una TV sin mouse ni teclado completa la partida.
   Los botones sirven para adelantar, no son obligatorios.

---

## 🌐 Deploy

- **Frontend**: Firebase Hosting (proyecto `juegos-tv`)
  ```bash
  npm run build -w @party-draw/shared && npm run build -w @party-draw/web
  firebase deploy --only hosting
  ```
  La URL del backend se configura en `apps/web/.env.production` (`VITE_SERVER_URL`).

- **Backend**: Render / Railway / cualquier host de Node
  ```bash
  npm run build && npm start
  ```
  Variables: `PORT` y, opcionalmente, `ALLOWED_ORIGINS` para restringir CORS. Ver
  `apps/server/.env.example`.

> El estado de las partidas vive en memoria: si el servidor se reinicia, las salas activas se
> pierden. Los clientes lo detectan y se recuperan solos.
