# 🎨 PARTY DRAW — Videojuego Party Game Multijugador

Videojuego casual multijugador estilo *party game* donde la pantalla principal (TV o PC) funciona como pizarra central y los celulares actúan como controles interactivos sin necesidad de instalar aplicaciones.

---

## 🚀 Inicio Rápido en Desarrollo

### 1. Requisitos
- Node.js (versión 18 o superior)
- npm (versión 9 o superior)

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Compilar el Paquete Compartido
```bash
npm run build -w @party-draw/shared
```

### 4. Iniciar Servidor Backend y Cliente Web
Para ejecutar ambos en paralelo:
```bash
npm run dev
```

O en terminales separadas:
- **Backend (Socket.IO + Express)**: `npm run dev -w @party-draw/server` (puerto 3001)
- **Frontend (React + Vite)**: `npm run dev -w @party-draw/web` (puerto 5173 con `--host` para red local)

---

## 📱 Cómo Probar con Celulares en la Misma Red Wi-Fi

1. Abrí la aplicación en tu TV o navegador de PC: `http://localhost:5173`
2. Seleccioná **"CREAR PARTIDA (TV)"**.
3. La pantalla generará un código de 4 letras/números y un **código QR interactivo**.
4. Conectá tu teléfono a la misma red Wi-Fi y escaneá el QR con la cámara del celular.
5. Ingresá tu nombre, elegí tu avatar y color.
6. ¡Iniciá la partida desde la TV o desde el celular del anfitrión!

---

## 🏗️ Arquitectura del Monorepo

```
/
├── package.json               # Workspaces de npm
├── packages/
│   └── shared/                # Modelos, eventos WebSocket, constantes y banco de palabras
│       ├── types.ts           # GameStatus, Player, Stroke, Word, RoundResultSummary
│       ├── events.ts          # Contrato de eventos CLIENT_EVENTS y SERVER_EVENTS
│       ├── constants.ts       # Banco inicial de 120+ palabras en español y reglas de puntos
│       └── utils.ts           # Normalización de acentos, códigos de sala y Levenshtein
├── apps/
│   ├── server/                # Backend autoritativo Node.js + TypeScript + Socket.IO
│   │   ├── GameManager.ts     # Administración de salas y ciclo de vida en memoria
│   │   ├── GameRoom.ts        # Máquina de estados, turnos, timer y cálculo de puntos
│   │   ├── WordService.ts     # Selección de palabras y validación de aliases/tildes
│   │   ├── socketHandler.ts   # Enrutamiento de eventos realtime y seguridad anti-spoiler
│   │   └── firestore.ts       # Módulo para persistencia y estadísticas con Firebase
│   └── web/                   # Frontend React + Vite + Tailwind + Framer Motion
│       ├── views/
│       │   ├── Home.tsx       # Selección de TV Host o Jugador Celular
│       │   ├── TVHostView.tsx # Pantalla principal para TV con orquestación completa
│       │   ├── PlayerJoin.tsx # Ingreso móvil con validación y selector de avatar
│       │   └── PlayerGame.tsx # Controlador táctil adaptable (Dibujante vs Adivinador)
│       ├── components/
│       │   ├── tv/            # TVCanvas, TVLobby, TVHeader, TVRoundResult, TVScoreboard, TVGameOver
│       │   └── mobile/        # MobileCanvas (touch-action: none), MobileGuesser, MobileLobby, MobileResults
│       └── utils/
│           └── soundEffects.ts # Efectos de audio procedurales con Web Audio API
```

---

## 🔒 Mecánicas Clave y Seguridad

1. **Coordenadas Normalizadas `[0..1]`**: Los trazos táctiles del celular se transmiten como porcentajes independientes de la resolución de pantalla, logrando una renderización 1:1 proporcional en la TV.
2. **Anti-Spoiler Estricto**: Durante el turno de dibujo, la palabra secreta (`DRAW_WORD`) se envía **exclusivamente al socket del dibujante**. Ni la TV ni los adivinadores conocen la palabra hasta el final de la ronda.
3. **Normalización Inteligente de Respuestas**: Reconoce variaciones con o sin tilde (ej: `pingüino` = `pinguino`), mayúsculas y aliases configurados en el banco de palabras.
4. **Resiliencia ante Desconexiones**: Persistencia de sesión (`sessionId` y `playerId`) en `localStorage` con reincorporación fluida a la partida y sincronización de trazos activos (`SYNC_CANVAS`).
5. **Efectos de Sonido Integrados**: Sintetizador con Web Audio API que no requiere descargas de archivos externos y funciona sin latencia.
