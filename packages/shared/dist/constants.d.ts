import { Difficulty, GameSettings, Word, WordLevel } from './types.js';
export interface CategoryMeta {
    id: string;
    label: string;
    emoji: string;
    /** Las respuestas pueden tener varias palabras (títulos, frases) */
    multiWord?: boolean;
}
export declare const CATEGORIES: CategoryMeta[];
export declare const CATEGORY_IDS: string[];
export declare function getCategoryMeta(id: string): CategoryMeta | undefined;
export declare function getCategoryLabel(id: string | null | undefined): string;
export interface DifficultyMeta {
    id: Difficulty;
    label: string;
    emoji: string;
    description: string;
    /** Niveles del banco que entran, en orden de preferencia */
    levels: WordLevel[];
    /** Multiplicador aplicado al puntaje base */
    scoreMultiplier: number;
}
export declare const DIFFICULTIES: DifficultyMeta[];
export declare function getDifficultyMeta(id: Difficulty): DifficultyMeta;
export interface TeamPreset {
    name: string;
    color: string;
    emoji: string;
}
export declare const TEAM_PRESETS: TeamPreset[];
export declare const TEAM_LIMITS: {
    MIN_TEAMS: number;
    MAX_TEAMS: number;
    MIN_PER_TEAM: number;
    MAX_PER_TEAM: number;
};
/** Intentos que tiene el equipo en su turno. 0 = ilimitados mientras dure el tiempo. */
export declare const ATTEMPTS_OPTIONS: Array<{
    value: number;
    label: string;
    hint: string;
}>;
/** Probabilidad de que salga la carta "¡Juegan todos!" */
export declare const ALL_PLAY_OPTIONS: Array<{
    value: number;
    label: string;
    hint: string;
}>;
export declare const DEFAULT_GAME_SETTINGS: GameSettings;
export declare const ROUND_DURATION_OPTIONS: number[];
export declare const TOTAL_ROUNDS_OPTIONS: number[];
export declare const MAX_PLAYERS_OPTIONS: number[];
export declare const SCORING_RULES: {
    FIRST_GUESS: number;
    SECOND_GUESS: number;
    THIRD_GUESS: number;
    OTHER_GUESS: number;
    DRAWER_BONUS_PER_GUESS: number;
    /** Bonus extra según el tiempo que sobró */
    SPEED_BONUS_MAX: number;
    /** Modo riesgo: acertar con un único intento vale más */
    RISK_CORRECT: number;
    RISK_CLOSE: number;
    /** Equipo que acierta en su turno */
    TEAM_CORRECT: number;
    TEAM_FIRST_BONUS: number;
    /** Premio por resolverla en el primer intento del turno */
    FIRST_ATTEMPT_BONUS: number;
    /** Carta "¡Juegan todos!": solo cobra el primero que acierta, y paga más */
    ALL_PLAY_CORRECT: number;
};
/**
 * Tiempos del ciclo de partida. Todas las fases avanzan solas para que una TV
 * sin mouse ni teclado pueda completar una partida entera sin intervención.
 */
export declare const TIMINGS: {
    COUNTDOWN_SECONDS: number;
    ROUND_RESULT_MS: number;
    SCOREBOARD_MS: number;
    DRAWER_DISCONNECT_GRACE_MS: number;
    GUESS_COOLDOWN_MS: number;
    MAX_GUESSES_PER_ROUND: number;
    /** Cada cuánto el cliente agrupa y envía los puntos del trazo */
    STROKE_FLUSH_MS: number;
    /** Si no llega ningún estado en este lapso, el cliente pide resincronizar */
    SYNC_WATCHDOG_MS: number;
};
export declare const PLAYER_COLORS: string[];
export declare const DRAWING_PALETTE: string[];
export declare const INITIAL_WORD_BANK: Word[];
//# sourceMappingURL=constants.d.ts.map