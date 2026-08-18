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
