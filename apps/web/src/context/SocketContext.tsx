import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from 'react';
import { io, Socket } from 'socket.io-client';
import {
  CLIENT_EVENTS,
  DrawWordPayload,
  GameSettings,
  GameStatus,
  GuessFeedbackPayload,
  Player,
  PlayerGuessedPayload,
  PublicGameState,
  SERVER_EVENTS,
  Stroke,
  StrokePoint,
  Team,
  TIMINGS,
  Word
} from '@party-draw/shared';
import { sounds } from '../utils/soundEffects';

const STORAGE_KEYS = {
  code: 'party_draw_code',
  playerId: 'party_draw_player_id',
  sessionId: 'party_draw_session_id',
  role: 'party_draw_role'
} as const;

type SessionRole = 'tv' | 'player';

/** Lote de puntos pendiente de enviar */
interface StrokeBuffer {
  points: StrokePoint[];
  color: string;
  width: number;
  isEraser: boolean;
  isNewStroke: boolean;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  gameState: PublicGameState | null;
  player: Player | null;
  team: Team | null;
  gameCode: string | null;
  secretWord: Word | null;
  activeStrokes: Stroke[];
  lastGuessFeedback: GuessFeedbackPayload | null;
  countdown: number | null;
  error: string | null;
  isHost: boolean;

  createGame: (settings?: Partial<GameSettings>) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  joinGame: (gameCode: string, name: string, avatar?: string, color?: string) => void;
  setTeam: (teamId: string, playerId?: string) => void;
  startGame: () => void;
  sendStrokePoint: (
    point: StrokePoint,
    color: string,
    width: number,
    isEraser: boolean,
    isNewStroke: boolean
  ) => void;
  sendStrokeEnd: () => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  submitGuess: (text: string) => void;
  nextRound: () => void;
  playAgain: () => void;
  clearError: () => void;
  resetSession: () => void;
  requestSync: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  const host = window.location.hostname || 'localhost';
  return `http://${host}:3001`;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [secretWord, setSecretWord] = useState<Word | null>(null);
  const [activeStrokes, setActiveStrokes] = useState<Stroke[]>([]);
  const [lastGuessFeedback, setLastGuessFeedback] = useState<GuessFeedbackPayload | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs para leer valores actuales dentro de handlers registrados una sola vez
  const socketRef = useRef<Socket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const gameCodeRef = useRef<string | null>(null);
  const prevPlayerCountRef = useRef<number>(0);
  const countdownTimeoutRef = useRef<number | null>(null);
  const lastVersionRef = useRef<number>(-1);
  const lastStateAtRef = useRef<number>(Date.now());

  // Buffer de trazos
  const strokeBufferRef = useRef<StrokeBuffer | null>(null);
  const flushTimerRef = useRef<number | null>(null);

  const resetSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.code);
    localStorage.removeItem(STORAGE_KEYS.playerId);
    localStorage.removeItem(STORAGE_KEYS.role);
    playerIdRef.current = null;
    gameCodeRef.current = null;
    lastVersionRef.current = -1;
    setGameCode(null);
    setPlayer(null);
    setGameState(null);
  }, []);

  // ------------------------------------------------------------------
  // Envío de trazos por lotes
  // ------------------------------------------------------------------

  const flushStrokeBuffer = useCallback(() => {
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const buffer = strokeBufferRef.current;
    const activeSocket = socketRef.current;
    const code = gameCodeRef.current;

    if (!buffer || buffer.points.length === 0 || !activeSocket || !code) return;

    activeSocket.emit(CLIENT_EVENTS.SEND_STROKE_CHUNK, {
      gameCode: code,
      points: buffer.points,
      color: buffer.color,
      width: buffer.width,
      isEraser: buffer.isEraser,
      isNewStroke: buffer.isNewStroke
    });

    // El trazo continúa: los lotes siguientes ya no son "nuevos"
    strokeBufferRef.current = {
      points: [],
      color: buffer.color,
      width: buffer.width,
      isEraser: buffer.isEraser,
      isNewStroke: false
    };
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(flushStrokeBuffer, TIMINGS.STROKE_FLUSH_MS);
  }, [flushStrokeBuffer]);

  /**
   * Acumula el punto y lo manda agrupado.
   * Enviar punto por punto generaba ~60 mensajes por segundo y era la causa
   * principal del retraso en celulares con señal floja.
   */
  const sendStrokePoint = useCallback(
    (point: StrokePoint, color: string, width: number, isEraser: boolean, isNewStroke: boolean) => {
      const buffer = strokeBufferRef.current;
      const toolChanged =
        !buffer || buffer.color !== color || buffer.width !== width || buffer.isEraser !== isEraser;

      if (isNewStroke || toolChanged) {
        // Lo pendiente del trazo anterior se manda antes de abrir el nuevo
        if (buffer && buffer.points.length > 0) flushStrokeBuffer();
        strokeBufferRef.current = { points: [point], color, width, isEraser, isNewStroke: true };
      } else {
        buffer.points.push(point);
      }

      scheduleFlush();
    },
    [flushStrokeBuffer, scheduleFlush]
  );

  const sendStrokeEnd = useCallback(() => {
    flushStrokeBuffer();
    strokeBufferRef.current = null;
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const activeSocket = socketRef.current;
    if (activeSocket && gameCodeRef.current) {
      activeSocket.emit(CLIENT_EVENTS.SEND_STROKE_END, { gameCode: gameCodeRef.current });
    }
  }, [flushStrokeBuffer]);

  const requestSync = useCallback(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !activeSocket.connected) return;
    activeSocket.emit(CLIENT_EVENTS.REQUEST_SYNC);
  }, []);

  // ------------------------------------------------------------------
  // Conexión
  // ------------------------------------------------------------------

  useEffect(() => {
    const newSocket = io(getServerUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      timeout: 12000
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
      lastStateAtRef.current = Date.now();

      const savedCode = localStorage.getItem(STORAGE_KEYS.code);
      const savedPlayerId = localStorage.getItem(STORAGE_KEYS.playerId);
      const savedSessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
      const role = localStorage.getItem(STORAGE_KEYS.role) as SessionRole | null;

      if (!savedCode) return;

      if (role === 'tv') {
        newSocket.emit(CLIENT_EVENTS.ATTACH_TV, { gameCode: savedCode });
      } else if (savedPlayerId && savedSessionId) {
        playerIdRef.current = savedPlayerId;
        newSocket.emit(CLIENT_EVENTS.RECONNECT, {
          gameCode: savedCode,
          playerId: savedPlayerId,
          sessionId: savedSessionId
        });
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      // Un trazo a medias no debe reenviarse al reconectar
      strokeBufferRef.current = null;
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    newSocket.on(SERVER_EVENTS.GAME_CREATED, (data: { gameCode: string; room: PublicGameState }) => {
      gameCodeRef.current = data.gameCode;
      lastVersionRef.current = -1;
      setGameCode(data.gameCode);
      setGameState(data.room);
      prevPlayerCountRef.current = data.room.players.length;
      lastStateAtRef.current = Date.now();
      localStorage.setItem(STORAGE_KEYS.code, data.gameCode);
      localStorage.setItem(STORAGE_KEYS.role, 'tv');
    });

    newSocket.on(
      SERVER_EVENTS.JOIN_SUCCESS,
      (data: { player: Player; gameCode: string; room: PublicGameState }) => {
        playerIdRef.current = data.player.id;
        gameCodeRef.current = data.gameCode;
        lastVersionRef.current = -1;
        setPlayer(data.player);
        setGameCode(data.gameCode);
        setGameState(data.room);
        prevPlayerCountRef.current = data.room.players.length;
        lastStateAtRef.current = Date.now();
        setError(null);
        localStorage.setItem(STORAGE_KEYS.code, data.gameCode);
        localStorage.setItem(STORAGE_KEYS.playerId, data.player.id);
        localStorage.setItem(STORAGE_KEYS.sessionId, data.player.sessionId);
        localStorage.setItem(STORAGE_KEYS.role, 'player');
      }
    );

    newSocket.on(SERVER_EVENTS.JOIN_ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on(SERVER_EVENTS.ROOM_NOT_FOUND, (data: { message: string }) => {
      const role = localStorage.getItem(STORAGE_KEYS.role) as SessionRole | null;
      localStorage.removeItem(STORAGE_KEYS.code);
      localStorage.removeItem(STORAGE_KEYS.playerId);
      playerIdRef.current = null;
      gameCodeRef.current = null;
      lastVersionRef.current = -1;
      setGameCode(null);
      setPlayer(null);
      setGameState(null);

      if (role === 'tv') {
        newSocket.emit(CLIENT_EVENTS.CREATE_GAME, {});
      } else {
        localStorage.removeItem(STORAGE_KEYS.role);
        setError(data.message);
      }
    });

    newSocket.on(SERVER_EVENTS.ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on(SERVER_EVENTS.GAME_STATE_UPDATE, (state: PublicGameState) => {
      lastStateAtRef.current = Date.now();

      // Descarta estados que llegan fuera de orden en redes con reintentos
      if (state.version < lastVersionRef.current) return;
      lastVersionRef.current = state.version;

      setGameState(state);

      // Mantiene sincronizado al jugador local (puntaje, si respondió, equipo)
      const myId = playerIdRef.current;
      if (myId) {
        const me = state.players.find((p) => p.id === myId);
        if (me) setPlayer(me);
      }

      if (state.players.length > prevPlayerCountRef.current && prevPlayerCountRef.current > 0) {
        sounds.playJoin();
      }
      prevPlayerCountRef.current = state.players.length;

      const iAmDrawer = !!myId && state.currentDrawerId === myId;
      if (state.status !== GameStatus.DRAWING || !iAmDrawer) {
        setSecretWord(null);
      }
    });

    newSocket.on(SERVER_EVENTS.COUNTDOWN_TICK, (data: { count: number }) => {
      setCountdown(data.count);
      sounds.playCountdownTick(data.count);

      if (countdownTimeoutRef.current) window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = window.setTimeout(() => setCountdown(null), 1500);
    });

    newSocket.on(SERVER_EVENTS.ROUND_STARTED, () => {
      if (countdownTimeoutRef.current) window.clearTimeout(countdownTimeoutRef.current);
      setCountdown(null);
      setActiveStrokes([]);
      setLastGuessFeedback(null);
      strokeBufferRef.current = null;
      sounds.playRoundStart();
    });

    newSocket.on(SERVER_EVENTS.DRAW_WORD, (data: DrawWordPayload) => {
      setSecretWord(data.word);
    });

    newSocket.on(SERVER_EVENTS.SYNC_CANVAS, (data: { strokes: Stroke[] }) => {
      setActiveStrokes(data.strokes || []);
    });

    newSocket.on(SERVER_EVENTS.CANVAS_CLEARED, () => {
      setActiveStrokes([]);
    });

    newSocket.on(SERVER_EVENTS.GUESS_FEEDBACK, (data: GuessFeedbackPayload) => {
      setLastGuessFeedback(data);
      if (data.throttled) return;

      if (data.pending) {
        sounds.playJoin();
      } else if (data.isCorrect) {
        sounds.playCorrectGuess();
      } else if (data.isClose) {
        sounds.playCloseGuess();
      } else {
        sounds.playWrongGuess();
      }
    });

    newSocket.on(SERVER_EVENTS.PLAYER_GUESSED, (data: PlayerGuessedPayload) => {
      if (data.playerId === playerIdRef.current) return;
      sounds.playCorrectGuess();
    });

    newSocket.on(SERVER_EVENTS.ROUND_ENDED, () => {
      sounds.playTimeUp();
    });

    newSocket.on(SERVER_EVENTS.GAME_OVER, () => {
      sounds.playWinner();
    });

    setSocket(newSocket);

    return () => {
      if (countdownTimeoutRef.current) window.clearTimeout(countdownTimeoutRef.current);
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ------------------------------------------------------------------
  // Watchdog de sincronización
  // ------------------------------------------------------------------

  useEffect(() => {
    /**
     * Si pasa demasiado tiempo sin recibir estado durante una partida activa,
     * se pide el estado completo. Cubre el caso de un cliente que quedó
     * "tildado" tras un corte breve sin que el socket llegara a caerse.
     */
    const interval = window.setInterval(() => {
      const activeSocket = socketRef.current;
      if (!activeSocket?.connected || !gameCodeRef.current) return;
      if (Date.now() - lastStateAtRef.current < TIMINGS.SYNC_WATCHDOG_MS) return;

      lastStateAtRef.current = Date.now();
      activeSocket.emit(CLIENT_EVENTS.REQUEST_SYNC);
    }, 4000);

    // Volver de segundo plano es el momento más probable de desincronización
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const activeSocket = socketRef.current;
      if (!activeSocket || !gameCodeRef.current) return;
      if (!activeSocket.connected) activeSocket.connect();
      else activeSocket.emit(CLIENT_EVENTS.REQUEST_SYNC);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleVisibility);
    };
  }, []);

  // ------------------------------------------------------------------
  // Acciones
  // ------------------------------------------------------------------

  const createGame = useCallback((settings?: Partial<GameSettings>) => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return;
    if (gameCodeRef.current) return; // evita salas duplicadas al re-montar
    localStorage.setItem(STORAGE_KEYS.role, 'tv');
    activeSocket.emit(CLIENT_EVENTS.CREATE_GAME, { settings });
  }, []);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    activeSocket.emit(CLIENT_EVENTS.UPDATE_SETTINGS, {
      gameCode: gameCodeRef.current,
      settings
    });
  }, []);

  const joinGame = useCallback(
    (code: string, name: string, avatar?: string, color?: string) => {
      const activeSocket = socketRef.current;
      if (!activeSocket) return;

      let sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
      if (!sessionId) {
        sessionId = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
      }

      activeSocket.emit(CLIENT_EVENTS.JOIN_GAME, {
        gameCode: code.toUpperCase().trim(),
        name,
        avatar,
        color,
        sessionId
      });
    },
    []
  );

  const setTeam = useCallback((teamId: string, targetPlayerId?: string) => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    activeSocket.emit(CLIENT_EVENTS.SET_TEAM, {
      gameCode: gameCodeRef.current,
      teamId,
      playerId: targetPlayerId
    });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.START_GAME);
  }, []);

  const clearCanvas = useCallback(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    strokeBufferRef.current = null;
    setActiveStrokes([]);
    activeSocket.emit(CLIENT_EVENTS.CLEAR_CANVAS, { gameCode: gameCodeRef.current });
  }, []);

  const undoStroke = useCallback(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    strokeBufferRef.current = null;
    activeSocket.emit(CLIENT_EVENTS.UNDO_STROKE, { gameCode: gameCodeRef.current });
  }, []);

  const submitGuess = useCallback((text: string) => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    activeSocket.emit(CLIENT_EVENTS.SUBMIT_GUESS, { gameCode: gameCodeRef.current, text });
  }, []);

  const nextRound = useCallback(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    activeSocket.emit(CLIENT_EVENTS.NEXT_ROUND, { gameCode: gameCodeRef.current });
  }, []);

  const playAgain = useCallback(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !gameCodeRef.current) return;
    activeSocket.emit(CLIENT_EVENTS.PLAY_AGAIN, { gameCode: gameCodeRef.current });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isHost = !!player && !!gameState && gameState.hostId === player.id;
  const team = useMemo(
    () => gameState?.teams.find((t) => t.id === player?.teamId) ?? null,
    [gameState, player?.teamId]
  );

  // El value se memoiza: sin esto, cada render del provider re-renderizaba
  // todo el árbol de la partida aunque no hubiera cambiado nada.
  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      connected,
      gameState,
      player,
      team,
      gameCode,
      secretWord,
      activeStrokes,
      lastGuessFeedback,
      countdown,
      error,
      isHost,
      createGame,
      updateSettings,
      joinGame,
      setTeam,
      startGame,
      sendStrokePoint,
      sendStrokeEnd,
      clearCanvas,
      undoStroke,
      submitGuess,
      nextRound,
      playAgain,
      clearError,
      resetSession,
      requestSync
    }),
    [
      socket,
      connected,
      gameState,
      player,
      team,
      gameCode,
      secretWord,
      activeStrokes,
      lastGuessFeedback,
      countdown,
      error,
      isHost,
      createGame,
      updateSettings,
      joinGame,
      setTeam,
      startGame,
      sendStrokePoint,
      sendStrokeEnd,
      clearCanvas,
      undoStroke,
      submitGuess,
      nextRound,
      playAgain,
      clearError,
      resetSession,
      requestSync
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
