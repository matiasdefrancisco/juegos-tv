export enum GameStatus {
  WAITING = 'WAITING',
  COUNTDOWN = 'COUNTDOWN',
  DRAWING = 'DRAWING',
  ROUND_RESULT = 'ROUND_RESULT',
  SCOREBOARD = 'SCOREBOARD',
  GAME_OVER = 'GAME_OVER',
  CLOSED = 'CLOSED'
}

/** Cómo se agrupan los jugadores */
export enum GameMode {
  FREE_FOR_ALL = 'FREE_FOR_ALL',
  TEAMS = 'TEAMS'
}

/**
 * Cómo termina una ronda en modo "todos contra todos".
 * TIME: intentos libres, cierra al acertar todos o al agotarse el reloj.
 * RISK: un único intento por jugador, cierra cuando todos arriesgaron
 *       (o al agotarse el reloj, lo que pase primero).
 *
 * En modo equipos no aplica: ahí se juega por turnos y el límite lo pone
 * `attemptsPerTurn`.
 */
export enum RoundMode {
  TIME = 'TIME',
  RISK = 'RISK'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

/** Nivel intrínseco de cada palabra del banco */
export type WordLevel = 1 | 2 | 3;

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  joinedAt: number;
  guessedCurrentRound: boolean;
  currentRoundScore: number;
  guessOrder?: number;
  /** Equipo al que pertenece (solo en modo TEAMS) */
  teamId?: string;
  /** Ya usó su intento en modo RISK */
  hasAnswered: boolean;
}

/** Motivo por el que un jugador no puede responder en este momento */
export type AnswerBlockReason =
  | 'DRAWER'
  | 'NOT_YOUR_TURN'
  | 'ALREADY_ANSWERED'
  | 'TEAM_ANSWERED'
  | 'NO_ATTEMPTS_LEFT';

export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
  score: number;
  currentRoundScore: number;
  /** El equipo ya cerró su participación en la ronda actual */
  hasAnswered: boolean;
  /** Intentos consumidos en el turno actual */
  attemptsUsed: number;
}

export interface GameSettings {
  totalRounds: number;
  roundDuration: number;
  maxPlayers: number;
  /** Categorías habilitadas; nunca puede quedar vacío */
  categories: string[];
  difficulty: Difficulty;
  mode: GameMode;
  /** Solo aplica en modo FREE_FOR_ALL */
  roundMode: RoundMode;
  /** Solo aplica en modo TEAMS */
  teamCount: number;
  maxPlayersPerTeam: number;
  /** Intentos que tiene el equipo en su turno. 0 = ilimitados hasta que se acabe el tiempo */
  attemptsPerTurn: number;
  /** Habilita la carta especial "¡Juegan todos!" */
  allPlayEnabled: boolean;
  /** Probabilidad (0-100) de que una ronda sea "¡Juegan todos!" */
  allPlayChance: number;
}

export interface Word {
  id: string;
  text: string;
  category: string;
  difficulty: WordLevel;
  aliases?: string[];
}

export interface StrokePoint {
  x: number; // normalizado 0..1
  y: number; // normalizado 0..1
}

export interface Stroke {
  id: string;
  playerId: string;
  points: StrokePoint[];
  color: string;
  width: number; // normalizado respecto del lado menor del lienzo
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

/** Respuesta enviada por un equipo (modo TEAMS) */
export interface TeamAnswer {
  teamId: string;
  teamName: string;
  teamColor: string;
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  isClose: boolean;
  points: number;
  submittedAt: number;
}

export interface RoundResultSummary {
  word: string;
  category: string;
  difficulty: WordLevel;
  drawerId: string;
  drawerName: string;
  drawerTeamId?: string;
  drawerPoints: number;
  /** La ronda fue una carta "¡Juegan todos!" */
  wasAllPlay: boolean;
  /** Equipo que tenía el turno (null en carta abierta o en todos contra todos) */
  turnTeamId?: string | null;
  turnTeamName?: string | null;
  correctGuessers: Array<{
    playerId: string;
    playerName: string;
    points: number;
    timeTakenSeconds: number;
    order: number;
  }>;
  /** Respuestas por equipo, en orden de envío (modo TEAMS) */
  teamAnswers: TeamAnswer[];
}

export interface PublicGameState {
  id: string;
  joinCode: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  currentDrawerName?: string;
  currentDrawerTeamId?: string | null;
  /** Equipo con el turno activo: solo él puede responder (salvo carta abierta) */
  currentTeamId: string | null;
  /** La ronda actual (o la que está por empezar) es "¡Juegan todos!" */
  isAllPlayRound: boolean;
  /** Intentos que le quedan al equipo en turno; null si son ilimitados */
  attemptsLeft: number | null;
  roundStartedAt: number | null;
  roundEndsAt: number | null;
  /** Momento en que la fase actual (ROUND_RESULT / SCOREBOARD) avanza sola */
  phaseEndsAt: number | null;
  wordCategory: string | null;
  /** Longitud de cada palabra de la respuesta, ej. "Volver al Futuro" -> [6, 2, 6] */
  wordPattern: number[] | null;
  settings: GameSettings;
  createdAt: number;
  lastRoundResult?: RoundResultSummary | null;
  winner?: Player | null;
  winnerTeam?: Team | null;
  /** Contador incremental: permite descartar estados que llegan fuera de orden */
  version: number;
}
