import { Server, Socket } from 'socket.io';
import {
  AttachTvPayload,
  CLIENT_EVENTS,
  CreateGamePayload,
  DrawWordPayload,
  GameOverPayload,
  GameSettings,
  GameStatus,
  GuessFeedbackPayload,
  JoinGamePayload,
  PlayerGuessedPayload,
  ReconnectPayload,
  RoundEndedPayload,
  SendStrokeChunkPayload,
  SERVER_EVENTS,
  SetTeamPayload,
  StrokePoint,
  StrokeReceivedPayload,
  SubmitGuessPayload,
  TeamAnsweredPayload,
  TIMINGS
} from '@party-draw/shared';
import { AnswerBlockReason } from '@party-draw/shared';
import { GameManager } from './GameManager.js';
import { GameRoom, RoundEndReason } from './GameRoom.js';

/** Máximo de puntos aceptados en un solo lote, como red de seguridad */
const MAX_POINTS_PER_CHUNK = 120;
/** Los estados se agrupan en esta ventana para no saturar en respuestas simultáneas */
const STATE_COALESCE_MS = 80;

/** Por qué se rechazó un intento, en lenguaje de jugador */
const BLOCK_MESSAGES: Record<AnswerBlockReason, string> = {
  DRAWER: 'Estás dibujando: no podés adivinar tu propia palabra',
  NOT_YOUR_TURN: 'Es el turno del otro equipo. ¡Mirá y esperá el tuyo!',
  ALREADY_ANSWERED: 'Ya usaste tu respuesta en esta ronda',
  TEAM_ANSWERED: 'Tu equipo ya cerró su turno en esta ronda',
  NO_ATTEMPTS_LEFT: 'Tu equipo se quedó sin intentos'
};

export function setupSocketHandlers(io: Server, gameManager: GameManager): void {
  /** Emisiones de estado pendientes por sala, para agruparlas */
  const pendingStateEmits = new Map<string, NodeJS.Timeout>();

  function flushState(room: GameRoom): void {
    const pending = pendingStateEmits.get(room.joinCode);
    if (pending) {
      clearTimeout(pending);
      pendingStateEmits.delete(room.joinCode);
    }
    room.nextVersion();
    io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
  }

  /**
   * Estado agrupado: varias mutaciones seguidas (aciertos simultáneos, altas de
   * jugadores) se resuelven en un solo mensaje por sala.
   */
  function emitState(room: GameRoom): void {
    if (pendingStateEmits.has(room.joinCode)) return;

    const handle = setTimeout(() => {
      pendingStateEmits.delete(room.joinCode);
      room.nextVersion();
      io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
    }, STATE_COALESCE_MS);

    pendingStateEmits.set(room.joinCode, handle);
  }

  function sendWordToDrawer(room: GameRoom, drawerId: string): void {
    if (!room.currentWord) return;
    const payload: DrawWordPayload = {
      word: room.currentWord,
      roundDuration: room.settings.roundDuration
    };

    for (const [socketId, playerId] of room.socketPlayerMap.entries()) {
      if (playerId === drawerId) {
        io.to(socketId).emit(SERVER_EVENTS.DRAW_WORD, payload);
      }
    }
  }

  function setupRoundTimer(room: GameRoom): void {
    const durationMs = room.settings.roundDuration * 1000;
    room.setRoundTimer(
      setTimeout(() => {
        handleRoundEnd(room, 'TIME_UP');
      }, durationMs)
    );
  }

  function startCountdown(room: GameRoom): void {
    let count = TIMINGS.COUNTDOWN_SECONDS;
    io.to(room.joinCode).emit(SERVER_EVENTS.COUNTDOWN_TICK, { count });

    room.setCountdownTimer(
      setInterval(() => {
        count--;

        if (count > 0) {
          io.to(room.joinCode).emit(SERVER_EVENTS.COUNTDOWN_TICK, { count });
          return;
        }

        room.clearTimers();

        // El dibujante se fue durante la cuenta regresiva: se saltea su turno
        const nextDrawer = room.currentDrawerId ? room.getPlayer(room.currentDrawerId) : undefined;
        if (!nextDrawer || !nextDrawer.connected) {
          room.status = GameStatus.SCOREBOARD;
          advanceTurn(room);
          return;
        }

        const { drawerId } = room.startDrawingRound();

        flushState(room);
        io.to(room.joinCode).emit(SERVER_EVENTS.ROUND_STARTED, {
          round: room.currentRound,
          drawerId,
          duration: room.settings.roundDuration,
          roundMode: room.settings.roundMode
        });

        sendWordToDrawer(room, drawerId);
        setupRoundTimer(room);
      }, 1000)
    );
  }

  /** Cierra la ronda. Protegido contra doble ejecución. */
  function handleRoundEnd(room: GameRoom, reason: RoundEndReason): void {
    if (room.status !== GameStatus.DRAWING) return;

    const result = room.endRound(reason);
    const payload: RoundEndedPayload = {
      reason,
      result,
      nextStatus: GameStatus.ROUND_RESULT
    };

    io.to(room.joinCode).emit(SERVER_EVENTS.ROUND_ENDED, payload);
    flushState(room);

    room.setPhaseTimer(
      setTimeout(() => {
        showScoreboard(room);
      }, TIMINGS.ROUND_RESULT_MS)
    );
  }

  function showScoreboard(room: GameRoom): void {
    if (room.status !== GameStatus.ROUND_RESULT) return;

    room.status = GameStatus.SCOREBOARD;
    room.phaseEndsAt = Date.now() + TIMINGS.SCOREBOARD_MS;
    flushState(room);

    room.setPhaseTimer(
      setTimeout(() => {
        advanceTurn(room);
      }, TIMINGS.SCOREBOARD_MS)
    );
  }

  function advanceTurn(room: GameRoom): void {
    if (room.status !== GameStatus.SCOREBOARD) return;
    room.clearTimers();

    const { isGameOver } = room.advanceNextTurn();

    if (isGameOver) {
      const payload: GameOverPayload = {
        winner: room.getWinner(),
        winnerTeam: room.getWinnerTeam(),
        players: Array.from(room.players.values()),
        teams: Array.from(room.teams.values())
      };
      io.to(room.joinCode).emit(SERVER_EVENTS.GAME_OVER, payload);
      flushState(room);
      return;
    }

    flushState(room);
    startCountdown(room);
  }

  io.on('connection', (socket: Socket) => {
    /** Trazo abierto de este socket: se corta con undo, clear o fin de trazo */
    let strokeOpen = false;

    // ------------------------------------------------------------------
    // Alta y reconexión
    // ------------------------------------------------------------------

    socket.on(CLIENT_EVENTS.CREATE_GAME, (data: CreateGamePayload = {}) => {
      const room = gameManager.createRoom(data.settings);
      room.attachTvSocket(socket.id);
      socket.join(room.joinCode);
      gameManager.bindSocketToRoom(socket.id, room.joinCode);

      room.nextVersion();
      socket.emit(SERVER_EVENTS.GAME_CREATED, {
        gameCode: room.joinCode,
        room: room.getPublicState()
      });
      socket.emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
    });

    socket.on(CLIENT_EVENTS.ATTACH_TV, (data: AttachTvPayload) => {
      const room = gameManager.getRoom(data?.gameCode);

      if (!room) {
        socket.emit(SERVER_EVENTS.ROOM_NOT_FOUND, {
          message: 'La sala ya no existe. Creá una partida nueva.'
        });
        return;
      }

      room.attachTvSocket(socket.id);
      socket.join(room.joinCode);
      gameManager.bindSocketToRoom(socket.id, room.joinCode);

      socket.emit(SERVER_EVENTS.GAME_CREATED, {
        gameCode: room.joinCode,
        room: room.getPublicState()
      });
      socket.emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
      socket.emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
    });

    /**
     * Resincronización a pedido: si un cliente sospecha que quedó atrasado
     * (watchdog, vuelta del segundo plano) pide el estado completo.
     */
    socket.on(CLIENT_EVENTS.REQUEST_SYNC, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) {
        socket.emit(SERVER_EVENTS.ROOM_NOT_FOUND, { message: 'La sala ya no existe.' });
        return;
      }

      socket.emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
      socket.emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());

      const playerId = room.socketPlayerMap.get(socket.id);
      if (playerId && room.status === GameStatus.DRAWING && room.currentDrawerId === playerId) {
        sendWordToDrawer(room, playerId);
      }
    });

    socket.on(CLIENT_EVENTS.JOIN_GAME, (data: JoinGamePayload) => {
      const { gameCode, name, avatar, color, sessionId } = data || ({} as JoinGamePayload);
      const room = gameManager.getRoom(gameCode);

      if (!room) {
        socket.emit(SERVER_EVENTS.JOIN_ERROR, {
          message: 'Partida no encontrada. Verificá el código.'
        });
        return;
      }

      const isReturningPlayer =
        !!sessionId && Array.from(room.players.values()).some((p) => p.sessionId === sessionId);

      if (room.status !== GameStatus.WAITING && !isReturningPlayer) {
        socket.emit(SERVER_EVENTS.JOIN_ERROR, {
          message: 'La partida ya comenzó. Esperá a la próxima.'
        });
        return;
      }

      if (!isReturningPlayer && room.getConnectedPlayers().length >= room.settings.maxPlayers) {
        socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'La sala está completa.' });
        return;
      }

      const player = room.addPlayer(
        socket.id,
        name,
        avatar || '🎨',
        color || '#FF3B30',
        sessionId || socket.id
      );

      socket.join(room.joinCode);
      gameManager.bindSocketToRoom(socket.id, room.joinCode);

      socket.emit(SERVER_EVENTS.JOIN_SUCCESS, {
        player,
        gameCode: room.joinCode,
        room: room.getPublicState()
      });

      if (isReturningPlayer) {
        socket.emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
        if (room.status === GameStatus.DRAWING && room.currentDrawerId === player.id) {
          sendWordToDrawer(room, player.id);
        }
      }

      io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_JOINED, { player });
      emitState(room);
    });

    socket.on(CLIENT_EVENTS.RECONNECT, (data: ReconnectPayload) => {
      const { gameCode, playerId, sessionId } = data || ({} as ReconnectPayload);
      const room = gameManager.getRoom(gameCode);

      if (!room) {
        socket.emit(SERVER_EVENTS.ROOM_NOT_FOUND, { message: 'Partida no encontrada' });
        return;
      }

      const player = room.getPlayer(playerId);
      if (!player || player.sessionId !== sessionId) {
        socket.emit(SERVER_EVENTS.ROOM_NOT_FOUND, { message: 'Sesión no válida' });
        return;
      }

      player.connected = true;
      room.rebindSocket(socket.id, playerId);
      room.syncTeams();
      room.ensureHost();
      room.touch();
      socket.join(room.joinCode);
      gameManager.bindSocketToRoom(socket.id, room.joinCode);

      socket.emit(SERVER_EVENTS.JOIN_SUCCESS, {
        player,
        gameCode: room.joinCode,
        room: room.getPublicState()
      });
      socket.emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });

      if (room.status === GameStatus.DRAWING && room.currentDrawerId === playerId) {
        sendWordToDrawer(room, playerId);
      }

      io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_RECONNECTED, { player });
      emitState(room);
    });

    // ------------------------------------------------------------------
    // Configuración y equipos
    // ------------------------------------------------------------------

    socket.on(
      CLIENT_EVENTS.UPDATE_SETTINGS,
      (data: { gameCode: string; settings: Partial<GameSettings> }) => {
        const room = gameManager.getRoomBySocket(socket.id);
        if (!room || !room.canControl(socket.id)) return;
        if (room.status !== GameStatus.WAITING) return;

        room.updateSettings(data?.settings || {});
        flushState(room);
      }
    );

    socket.on(CLIENT_EVENTS.SET_TEAM, (data: SetTeamPayload) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || !data?.teamId) return;

      const requesterId = room.socketPlayerMap.get(socket.id);
      const targetId = data.playerId || requesterId;
      if (!targetId) return;

      // Cada uno se mueve solo; el anfitrión y la TV pueden mover a cualquiera
      const isSelf = targetId === requesterId;
      if (!isSelf && !room.canControl(socket.id)) return;

      const moved = room.setPlayerTeam(targetId, data.teamId);
      if (!moved) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Ese equipo está completo.' });
        return;
      }

      flushState(room);
    });

    socket.on(CLIENT_EVENTS.START_GAME, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return;

      if (!room.canControl(socket.id)) {
        socket.emit(SERVER_EVENTS.ERROR, {
          message: 'Solo el anfitrión puede iniciar la partida.'
        });
        return;
      }

      if (room.status !== GameStatus.WAITING) return;

      if (!room.startGame()) {
        socket.emit(SERVER_EVENTS.ERROR, {
          message: room.isTeamMode
            ? 'Hacen falta al menos 2 equipos con jugadores.'
            : 'Se necesitan al menos 2 jugadores para comenzar.'
        });
        return;
      }

      flushState(room);
      startCountdown(room);
    });

    // ------------------------------------------------------------------
    // Dibujo
    // ------------------------------------------------------------------

    socket.on(CLIENT_EVENTS.SEND_STROKE_CHUNK, (data: SendStrokeChunkPayload) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || room.status !== GameStatus.DRAWING) return;

      const playerId = room.socketPlayerMap.get(socket.id);
      if (!playerId || playerId !== room.currentDrawerId) return;
      if (!data || !Array.isArray(data.points) || data.points.length === 0) return;

      const points = sanitizePoints(data.points);
      if (points.length === 0) return;

      const isNewStroke = !!data.isNewStroke || !strokeOpen;
      strokeOpen = true;

      room.appendStrokePoints(
        playerId,
        points,
        data.color,
        data.width,
        !!data.isEraser,
        isNewStroke
      );

      const payload: StrokeReceivedPayload = {
        points,
        color: data.color,
        width: data.width,
        isEraser: !!data.isEraser,
        isNewStroke
      };

      // volatile: si un cliente va lento, se descartan lotes viejos en vez de
      // acumularlos. Evita que un celular con mala señal quede clavado.
      socket.volatile.to(room.joinCode).emit(SERVER_EVENTS.STROKE_RECEIVED, payload);
    });

    socket.on(CLIENT_EVENTS.SEND_STROKE_END, () => {
      strokeOpen = false;
    });

    socket.on(CLIENT_EVENTS.CLEAR_CANVAS, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || room.status !== GameStatus.DRAWING) return;

      const playerId = room.socketPlayerMap.get(socket.id);
      if (!playerId || playerId !== room.currentDrawerId) return;

      room.clearCanvas();
      strokeOpen = false;
      io.to(room.joinCode).emit(SERVER_EVENTS.CANVAS_CLEARED);
    });

    socket.on(CLIENT_EVENTS.UNDO_STROKE, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || room.status !== GameStatus.DRAWING) return;

      const playerId = room.socketPlayerMap.get(socket.id);
      if (!playerId || playerId !== room.currentDrawerId) return;

      room.undoLastStroke();
      strokeOpen = false;

      io.to(room.joinCode).emit(SERVER_EVENTS.STROKE_UNDONE);
      io.to(room.joinCode).emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
    });

    // ------------------------------------------------------------------
    // Respuestas
    // ------------------------------------------------------------------

    socket.on(CLIENT_EVENTS.SUBMIT_GUESS, (data: SubmitGuessPayload) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || room.status !== GameStatus.DRAWING) return;

      const playerId = room.socketPlayerMap.get(socket.id);
      if (!playerId) return;

      const player = room.getPlayer(playerId);
      if (!player) return;

      const text = typeof data?.text === 'string' ? data.text.slice(0, 80) : '';
      if (!text.trim()) return;

      const result = room.processGuess(playerId, text);

      // El intento no se contó: se explica por qué sin revelar nada de la palabra
      if (result.blocked) {
        socket.emit(SERVER_EVENTS.GUESS_FEEDBACK, {
          isCorrect: false,
          isClose: false,
          pointsAwarded: 0,
          attemptsLeft: result.attemptsLeft,
          message: BLOCK_MESSAGES[result.blocked]
        } satisfies GuessFeedbackPayload);
        return;
      }

      const feedback: GuessFeedbackPayload = {
        isCorrect: result.isCorrect,
        isClose: result.isClose,
        pointsAwarded: result.pointsAwarded,
        throttled: result.throttled,
        pending: result.pending,
        attemptsLeft: result.attemptsLeft,
        message: result.throttled
          ? 'Esperá un segundo antes de volver a intentar'
          : result.pending
          ? '¡Respuesta enviada! Se revela cuando respondan todos.'
          : result.isCorrect
          ? '¡CORRECTO! Adivinaste la palabra.'
          : result.isClose
          ? '¡Estás muy cerca!'
          : result.attemptsLeft === 0
          ? 'Se acabaron los intentos de tu equipo'
          : result.attemptsLeft != null
          ? `Incorrecto. Les quedan ${result.attemptsLeft} intento${result.attemptsLeft === 1 ? '' : 's'}`
          : 'Respuesta incorrecta'
      };

      socket.emit(SERVER_EVENTS.GUESS_FEEDBACK, feedback);

      // Aviso a la sala de que alguien ya usó su turno, sin revelar el resultado
      if (result.pending || (room.isTeamMode && !result.isCorrect)) {
        const team = result.teamId ? room.teams.get(result.teamId) : undefined;
        if (team) {
          const respondingTeams = room.getActiveTeams();
          io.to(room.joinCode).emit(SERVER_EVENTS.TEAM_ANSWERED, {
            teamId: team.id,
            teamName: team.name,
            teamColor: team.color,
            playerName: player.name,
            answeredCount: respondingTeams.filter((t) => t.hasAnswered).length,
            totalTeams: respondingTeams.length
          } satisfies TeamAnsweredPayload);
        }
      }

      if (result.isCorrect) {
        io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_GUESSED, {
          playerId: player.id,
          playerName: player.name,
          pointsAwarded: result.pointsAwarded,
          guessOrder: player.guessOrder || 1
        } satisfies PlayerGuessedPayload);
      }

      emitState(room);

      if (result.roundShouldEnd) {
        handleRoundEnd(room, result.endReason ?? 'ALL_GUESSED');
      }
    });

    // ------------------------------------------------------------------
    // Control de partida
    // ------------------------------------------------------------------

    socket.on(CLIENT_EVENTS.NEXT_ROUND, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || !room.canControl(socket.id)) return;

      if (room.status === GameStatus.ROUND_RESULT) {
        showScoreboard(room);
        return;
      }

      advanceTurn(room);
    });

    socket.on(CLIENT_EVENTS.PLAY_AGAIN, () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || !room.canControl(socket.id)) return;

      room.resetForNewGame();
      flushState(room);
    });

    // ------------------------------------------------------------------
    // Baja
    // ------------------------------------------------------------------

    socket.on('disconnect', () => {
      const room = gameManager.getRoomBySocket(socket.id);
      gameManager.unbindSocket(socket.id);
      strokeOpen = false;
      if (!room) return;

      const wasTvScreen = room.tvSocketIds.has(socket.id);
      const wasDrawing = room.status === GameStatus.DRAWING;
      const { player, newHostId } = room.removePlayer(socket.id);

      if (wasTvScreen && !player) return;
      if (!player) return;

      io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_LEFT, { playerId: player.id });
      if (newHostId) {
        io.to(room.joinCode).emit(SERVER_EVENTS.HOST_CHANGED, { hostId: newHostId });
      }
      emitState(room);

      if (!wasDrawing) return;

      // Sin gente suficiente no tiene sentido seguir la ronda
      if (room.getConnectedPlayers().length < 2) {
        handleRoundEnd(room, 'DRAWER_DISCONNECTED');
        return;
      }

      // Si ya no queda nadie que pueda responder, la ronda cierra en vez de
      // quedarse esperando a alguien que se fue
      const responders = room.getRespondingPlayers();
      if (responders.length === 0) {
        handleRoundEnd(room, 'TIME_UP');
        return;
      }

      const allDone = responders.every((p) =>
        room.isRiskMode ? p.hasAnswered : p.guessedCurrentRound
      );
      if (allDone) {
        handleRoundEnd(room, room.isRiskMode ? 'ALL_ANSWERED' : 'ALL_GUESSED');
        return;
      }

      if (room.currentDrawerId === player.id) {
        setTimeout(() => {
          if (room.status !== GameStatus.DRAWING || room.currentDrawerId !== player.id) return;
          const drawer = room.getPlayer(player.id);
          if (!drawer || !drawer.connected) {
            handleRoundEnd(room, 'DRAWER_DISCONNECTED');
          }
        }, TIMINGS.DRAWER_DISCONNECT_GRACE_MS);
      }
    });
  });
}

/** Filtra puntos inválidos y recorta lotes desmedidos */
function sanitizePoints(points: StrokePoint[]): StrokePoint[] {
  const clean: StrokePoint[] = [];

  for (const point of points.slice(0, MAX_POINTS_PER_CHUNK)) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') continue;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    clean.push({
      x: Math.min(1, Math.max(0, point.x)),
      y: Math.min(1, Math.max(0, point.y))
    });
  }

  return clean;
}
