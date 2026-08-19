import { GameSettings, PublicGameState, RoundResultSummary, StrokePoint, Word } from './types.js';
export declare enum CLIENT_EVENTS {
    CREATE_GAME = "CREATE_GAME",
    JOIN_GAME = "JOIN_GAME",
    RECONNECT = "RECONNECT",
    /** La pantalla de TV se re-vincula a una sala existente tras recargar o perder conexión */
    ATTACH_TV = "ATTACH_TV",
    /** Pedido explícito de estado completo: red de seguridad contra desincronización */
    REQUEST_SYNC = "REQUEST_SYNC",
    LEAVE_GAME = "LEAVE_GAME",
    START_GAME = "START_GAME",
    UPDATE_SETTINGS = "UPDATE_SETTINGS",
    KICK_PLAYER = "KICK_PLAYER",
    /** Cambio manual de equipo desde el celular o la TV */
    SET_TEAM = "SET_TEAM",
    SEND_STROKE_CHUNK = "SEND_STROKE_CHUNK",
    SEND_STROKE_END = "SEND_STROKE_END",
    CLEAR_CANVAS = "CLEAR_CANVAS",
    UNDO_STROKE = "UNDO_STROKE",
    SUBMIT_GUESS = "SUBMIT_GUESS",
    NEXT_ROUND = "NEXT_ROUND",
    PLAY_AGAIN = "PLAY_AGAIN"
}
export declare enum SERVER_EVENTS {
    GAME_CREATED = "GAME_CREATED",
    JOIN_SUCCESS = "JOIN_SUCCESS",
    JOIN_ERROR = "JOIN_ERROR",
    /** La sala guardada ya no existe en el servidor */
    ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
    GAME_STATE_UPDATE = "GAME_STATE_UPDATE",
    /** Palabra secreta: se envía SOLO al socket del dibujante */
    DRAW_WORD = "DRAW_WORD",
    STROKE_RECEIVED = "STROKE_RECEIVED",
    CANVAS_CLEARED = "CANVAS_CLEARED",
    STROKE_UNDONE = "STROKE_UNDONE",
    SYNC_CANVAS = "SYNC_CANVAS",
    GUESS_FEEDBACK = "GUESS_FEEDBACK",
    PLAYER_GUESSED = "PLAYER_GUESSED",
    /** Un equipo arriesgó (sin revelar si acertó, hasta el cierre de ronda) */
    TEAM_ANSWERED = "TEAM_ANSWERED",
    COUNTDOWN_TICK = "COUNTDOWN_TICK",
    ROUND_STARTED = "ROUND_STARTED",
    ROUND_ENDED = "ROUND_ENDED",
    SCORE_UPDATED = "SCORE_UPDATED",
    GAME_OVER = "GAME_OVER",
    PLAYER_JOINED = "PLAYER_JOINED",
    PLAYER_LEFT = "PLAYER_LEFT",
    PLAYER_RECONNECTED = "PLAYER_RECONNECTED",
    HOST_CHANGED = "HOST_CHANGED",
    ERROR = "ERROR"
}
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
export interface AttachTvPayload {
    gameCode: string;
}
export interface SetTeamPayload {
    gameCode: string;
    teamId: string;
    /** Si se omite, se mueve a sí mismo */
    playerId?: string;
}
/**
 * Lote de puntos de un trazo. Enviar en lotes en vez de punto por punto
 * baja mucho la cantidad de mensajes por segundo en redes lentas.
 */
export interface SendStrokeChunkPayload {
    gameCode: string;
    points: StrokePoint[];
    color: string;
    width: number;
    isEraser: boolean;
    /** true solo en el primer lote de cada trazo */
    isNewStroke: boolean;
}
export interface SubmitGuessPayload {
    gameCode: string;
    text: string;
}
export interface DrawWordPayload {
    word: Word;
    roundDuration: number;
}
export interface StrokeReceivedPayload {
    points: StrokePoint[];
    color: string;
    width: number;
    isEraser: boolean;
    isNewStroke: boolean;
}
export interface GuessFeedbackPayload {
    isCorrect: boolean;
    isClose: boolean;
    pointsAwarded: number;
    message: string;
    /** El intento no se evaluó por exceso de envíos */
    throttled?: boolean;
    /** En modo RISK: la respuesta quedó registrada y se revela al cerrar la ronda */
    pending?: boolean;
    /** Intentos que le quedan al equipo tras este envío */
    attemptsLeft?: number | null;
}
export interface PlayerGuessedPayload {
    playerId: string;
    playerName: string;
    pointsAwarded: number;
    guessOrder: number;
}
export interface TeamAnsweredPayload {
    teamId: string;
    teamName: string;
    teamColor: string;
    playerName: string;
    answeredCount: number;
    totalTeams: number;
}
export interface RoundEndedPayload {
    reason: 'ALL_GUESSED' | 'ALL_ANSWERED' | 'TEAM_SOLVED' | 'ATTEMPTS_EXHAUSTED' | 'TIME_UP' | 'DRAWER_DISCONNECTED';
    result: RoundResultSummary;
    nextStatus: string;
}
export interface GameOverPayload {
    winner: PublicGameState['winner'];
    winnerTeam: PublicGameState['winnerTeam'];
    players: PublicGameState['players'];
    teams: PublicGameState['teams'];
}
//# sourceMappingURL=events.d.ts.map