import { GameSettings, PublicGameState, Stroke, Word, RoundResultSummary } from './types.js';

export enum CLIENT_EVENTS {
  CREATE_GAME = 'CREATE_GAME',
  JOIN_GAME = 'JOIN_GAME',
  RECONNECT = 'RECONNECT',
  LEAVE_GAME = 'LEAVE_GAME',
  START_GAME = 'START_GAME',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  KICK_PLAYER = 'KICK_PLAYER',
  
  // Drawing events
  SEND_STROKE_POINT = 'SEND_STROKE_POINT',
  SEND_STROKE_END = 'SEND_STROKE_END',
  CLEAR_CANVAS = 'CLEAR_CANVAS',
  UNDO_STROKE = 'UNDO_STROKE',
  
  // Guessing
  SUBMIT_GUESS = 'SUBMIT_GUESS',
  
  // Host control
  NEXT_ROUND = 'NEXT_ROUND',
  PLAY_AGAIN = 'PLAY_AGAIN',
}

export enum SERVER_EVENTS {
  GAME_CREATED = 'GAME_CREATED',
  JOIN_SUCCESS = 'JOIN_SUCCESS',
  JOIN_ERROR = 'JOIN_ERROR',
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  
  // Secret word event sent ONLY to drawer
  DRAW_WORD = 'DRAW_WORD',
  
  // Drawing broadcast to TV & other players
  STROKE_RECEIVED = 'STROKE_RECEIVED',
  CANVAS_CLEARED = 'CANVAS_CLEARED',
  STROKE_UNDONE = 'STROKE_UNDONE',
  SYNC_CANVAS = 'SYNC_CANVAS', // Full strokes list for late join / reconnect
  
  // Guesses
  GUESS_FEEDBACK = 'GUESS_FEEDBACK', // To individual guesser (e.g., "¡Correcto!", "¡Casi!", "Incorrecto")
  PLAYER_GUESSED = 'PLAYER_GUESSED', // Broadcast to all: "Player X guessed correctly" (without showing the word)
  
  // Round lifecycle
  COUNTDOWN_TICK = 'COUNTDOWN_TICK',
  ROUND_STARTED = 'ROUND_STARTED',
  ROUND_ENDED = 'ROUND_ENDED',
  SCORE_UPDATED = 'SCORE_UPDATED',
  GAME_OVER = 'GAME_OVER',
  
  // Notifications
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  HOST_CHANGED = 'HOST_CHANGED',
  ERROR = 'ERROR'
}

// Client Payloads
export interface CreateGamePayload {
  settings?: Partial<GameSettings>;
}

export interface JoinGamePayload {
  gameCode: string;
  name: string;
  avatar?: string;
  color?: string;
  sessionId?: string;
}

export interface ReconnectPayload {
  gameCode: string;
  playerId: string;
  sessionId: string;
}

export interface SendStrokePointPayload {
  gameCode: string;
  point: { x: number; y: number };
  color: string;
  width: number;
  isEraser: boolean;
  isNewStroke: boolean;
}

export interface SendStrokeEndPayload {
  gameCode: string;
}

export interface SubmitGuessPayload {
  gameCode: string;
  text: string;
}

// Server Payloads
export interface DrawWordPayload {
  word: Word;
  roundDuration: number;
}

export interface GuessFeedbackPayload {
  isCorrect: boolean;
  isClose: boolean;
  pointsAwarded: number;
  message: string;
}

export interface PlayerGuessedPayload {
  playerId: string;
  playerName: string;
  pointsAwarded: number;
  guessOrder: number;
}

export interface RoundEndedPayload {
  reason: 'ALL_GUESSED' | 'TIME_UP' | 'DRAWER_DISCONNECTED';
  result: RoundResultSummary;
  nextStatus: string;
}
