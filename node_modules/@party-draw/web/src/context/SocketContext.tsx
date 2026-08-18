import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  RoundEndedPayload,
  SERVER_EVENTS,
  Stroke,
  StrokePoint,
  Word
} from '@party-draw/shared';
import { sounds } from '../utils/soundEffects';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  gameState: PublicGameState | null;
  player: Player | null;
  gameCode: string | null;
  secretWord: Word | null;
  activeStrokes: Stroke[];
  lastGuessFeedback: GuessFeedbackPayload | null;
  countdown: number | null;
  error: string | null;
  
  createGame: (settings?: Partial<GameSettings>) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  joinGame: (gameCode: string, name: string, avatar?: string, color?: string) => void;
  startGame: () => void;
  sendStrokePoint: (point: StrokePoint, color: string, width: number, isEraser: boolean, isNewStroke: boolean) => void;
  sendStrokeEnd: () => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  submitGuess: (text: string) => void;
  nextRound: () => void;
  playAgain: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // If running in browser, connect to same hostname at port 3001
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

  const prevPlayerCountRef = useRef<number>(0);

  useEffect(() => {
    const serverUrl = getServerUrl();
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('⚡ Connected to Party Draw socket server:', newSocket.id);

      // Attempt auto-reconnect if session exists in localStorage
      const savedCode = localStorage.getItem('party_draw_code');
      const savedPlayerId = localStorage.getItem('party_draw_player_id');
      const savedSessionId = localStorage.getItem('party_draw_session_id');

      if (savedCode && savedPlayerId && savedSessionId) {
        newSocket.emit(CLIENT_EVENTS.RECONNECT, {
          gameCode: savedCode,
          playerId: savedPlayerId,
          sessionId: savedSessionId
        });
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on(SERVER_EVENTS.GAME_CREATED, (data: { gameCode: string; room: PublicGameState }) => {
      setGameCode(data.gameCode);
      setGameState(data.room);
      localStorage.setItem('party_draw_code', data.gameCode);
    });

    newSocket.on(SERVER_EVENTS.JOIN_SUCCESS, (data: { player: Player; gameCode: string; room: PublicGameState }) => {
      setPlayer(data.player);
      setGameCode(data.gameCode);
      setGameState(data.room);
      localStorage.setItem('party_draw_code', data.gameCode);
      localStorage.setItem('party_draw_player_id', data.player.id);
      localStorage.setItem('party_draw_session_id', data.player.sessionId);
    });

    newSocket.on(SERVER_EVENTS.JOIN_ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on(SERVER_EVENTS.ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on(SERVER_EVENTS.GAME_STATE_UPDATE, (state: PublicGameState) => {
      setGameState(state);

      // Trigger join chime if player count increased
      if (state.players.length > prevPlayerCountRef.current && prevPlayerCountRef.current > 0) {
        sounds.playJoin();
      }
      prevPlayerCountRef.current = state.players.length;

      // Clear secret word and feedback when round is over or reset
      if (state.status !== GameStatus.DRAWING) {
        setSecretWord(null);
      }
      if (state.status === GameStatus.DRAWING && state.currentDrawerId !== player?.id) {
        setSecretWord(null);
      }
    });

    newSocket.on(SERVER_EVENTS.COUNTDOWN_TICK, (data: { count: number }) => {
      setCountdown(data.count);
      sounds.playCountdownTick(data.count);
      if (data.count === 1) {
        setTimeout(() => setCountdown(null), 1000);
      }
    });

    newSocket.on(SERVER_EVENTS.ROUND_STARTED, () => {
      setActiveStrokes([]);
      setLastGuessFeedback(null);
      sounds.playRoundStart();
    });

    newSocket.on(SERVER_EVENTS.DRAW_WORD, (data: DrawWordPayload) => {
      setSecretWord(data.word);
    });

    newSocket.on(SERVER_EVENTS.SYNC_CANVAS, (data: { strokes: Stroke[] }) => {
      setActiveStrokes(data.strokes);
    });

    newSocket.on(SERVER_EVENTS.CANVAS_CLEARED, () => {
      setActiveStrokes([]);
    });

    newSocket.on(SERVER_EVENTS.GUESS_FEEDBACK, (data: GuessFeedbackPayload) => {
      setLastGuessFeedback(data);
      if (data.isCorrect) {
        sounds.playCorrectGuess();
      } else if (data.isClose) {
        sounds.playCloseGuess();
      } else {
        sounds.playWrongGuess();
      }
    });

    newSocket.on(SERVER_EVENTS.PLAYER_GUESSED, (data: PlayerGuessedPayload) => {
      // If we are watching, play correct guess sound
      sounds.playCorrectGuess();
    });

    newSocket.on(SERVER_EVENTS.ROUND_ENDED, (data: RoundEndedPayload) => {
      sounds.playTimeUp();
    });

    newSocket.on(SERVER_EVENTS.GAME_OVER, () => {
      sounds.playWinner();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createGame = useCallback((settings?: Partial<GameSettings>) => {
    if (!socket) return;
    socket.emit(CLIENT_EVENTS.CREATE_GAME, { settings });
  }, [socket]);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.UPDATE_SETTINGS, { gameCode, settings });
  }, [socket, gameCode]);

  const joinGame = useCallback((code: string, name: string, avatar?: string, color?: string) => {
    if (!socket) return;
    let sessionId = localStorage.getItem('party_draw_session_id');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('party_draw_session_id', sessionId);
    }
    socket.emit(CLIENT_EVENTS.JOIN_GAME, {
      gameCode: code.toUpperCase().trim(),
      name,
      avatar,
      color,
      sessionId
    });
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit(CLIENT_EVENTS.START_GAME);
  }, [socket]);

  const sendStrokePoint = useCallback((
    point: StrokePoint,
    color: string,
    width: number,
    isEraser: boolean,
    isNewStroke: boolean
  ) => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.SEND_STROKE_POINT, {
      gameCode,
      point,
      color,
      width,
      isEraser,
      isNewStroke
    });
  }, [socket, gameCode]);

  const sendStrokeEnd = useCallback(() => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.SEND_STROKE_END, { gameCode });
  }, [socket, gameCode]);

  const clearCanvas = useCallback(() => {
    if (!socket || !gameCode) return;
    setActiveStrokes([]);
    socket.emit(CLIENT_EVENTS.CLEAR_CANVAS, { gameCode });
  }, [socket, gameCode]);

  const undoStroke = useCallback(() => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.UNDO_STROKE, { gameCode });
  }, [socket, gameCode]);

  const submitGuess = useCallback((text: string) => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.SUBMIT_GUESS, { gameCode, text });
  }, [socket, gameCode]);

  const nextRound = useCallback(() => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.NEXT_ROUND, { gameCode });
  }, [socket, gameCode]);

  const playAgain = useCallback(() => {
    if (!socket || !gameCode) return;
    socket.emit(CLIENT_EVENTS.PLAY_AGAIN, { gameCode });
  }, [socket, gameCode]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        gameState,
        player,
        gameCode,
        secretWord,
        activeStrokes,
        lastGuessFeedback,
        countdown,
        error,
        createGame,
        updateSettings,
        joinGame,
        startGame,
        sendStrokePoint,
        sendStrokeEnd,
        clearCanvas,
        undoStroke,
        submitGuess,
        nextRound,
        playAgain,
        clearError
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
