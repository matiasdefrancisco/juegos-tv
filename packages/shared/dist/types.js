export var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "WAITING";
    GameStatus["COUNTDOWN"] = "COUNTDOWN";
    GameStatus["DRAWING"] = "DRAWING";
    GameStatus["ROUND_RESULT"] = "ROUND_RESULT";
    GameStatus["SCOREBOARD"] = "SCOREBOARD";
    GameStatus["GAME_OVER"] = "GAME_OVER";
    GameStatus["CLOSED"] = "CLOSED";
})(GameStatus || (GameStatus = {}));
/** Cómo se agrupan los jugadores */
export var GameMode;
(function (GameMode) {
    GameMode["FREE_FOR_ALL"] = "FREE_FOR_ALL";
    GameMode["TEAMS"] = "TEAMS";
})(GameMode || (GameMode = {}));
/**
 * Cómo termina una ronda en modo "todos contra todos".
 * TIME: intentos libres, cierra al acertar todos o al agotarse el reloj.
 * RISK: un único intento por jugador, cierra cuando todos arriesgaron
 *       (o al agotarse el reloj, lo que pase primero).
 *
 * En modo equipos no aplica: ahí se juega por turnos y el límite lo pone
 * `attemptsPerTurn`.
 */
export var RoundMode;
(function (RoundMode) {
    RoundMode["TIME"] = "TIME";
    RoundMode["RISK"] = "RISK";
})(RoundMode || (RoundMode = {}));
export var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
})(Difficulty || (Difficulty = {}));
