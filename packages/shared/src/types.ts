export enum GameStatus {
  WAITING = 'WAITING',
  COUNTDOWN = 'COUNTDOWN',
  DRAWING = 'DRAWING',
  ROUND_RESULT = 'ROUND_RESULT',
  SCOREBOARD = 'SCOREBOARD',
  GAME_OVER = 'GAME_OVER',
  CLOSED = 'CLOSED'
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  avatar: string; // e.g. color or icon identifier
  color: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  joinedAt: number;
  guessedCurrentRound: boolean;
  currentRoundScore: number;
  guessOrder?: number;
}

export interface GameSettings {
  totalRounds: number; // 3, 5, 8, 10
  roundDuration: number; // 30, 60, 90 seconds
  maxPlayers: number; // 2..12
  categories: string[];
}

export interface Word {
  id: string;
  text: string;
  category: string;
  difficulty: 1 | 2 | 3;
  aliases?: string[];
}

export interface StrokePoint {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface Stroke {
  id: string;
  playerId: string;
  points: StrokePoint[];
  color: string;
  width: number; // normalized 0..1 relative to canvas
  isEraser: boolean;
  timestamp: number;
}

export interface GuessResult {
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: number;
}

export interface RoundResultSummary {
  word: string;
  category: string;
  drawerId: string;
  drawerName: string;
  drawerPoints: number;
  correctGuessers: Array<{
    playerId: string;
    playerName: string;
    points: number;
    timeTakenSeconds: number;
    order: number;
  }>;
}

export interface PublicGameState {
  id: string;
  joinCode: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  currentDrawerName?: string;
  roundStartedAt: number | null;
  roundEndsAt: number | null;
  wordCategory: string | null;
  wordLength: number | null;
  settings: GameSettings;
  createdAt: number;
  lastRoundResult?: RoundResultSummary | null;
  winner?: Player | null;
}
