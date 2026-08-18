import { CLIENT_EVENTS, GameStatus, SERVER_EVENTS } from '@party-draw/shared';
export function setupSocketHandlers(io, gameManager) {
    // Helper to start the round timer on the server
    const setupRoundTimer = (room) => {
        room.clearTimers();
        const durationMs = room.settings.roundDuration * 1000;
        const timer = setTimeout(() => {
            handleRoundEnd(room, 'TIME_UP');
        }, durationMs);
        // Save timer reference in the room
        room.timerHandle = timer;
    };
    // Helper to start countdown (3, 2, 1) before round starts
    const startCountdown = (room) => {
        let count = 3;
        io.to(room.joinCode).emit(SERVER_EVENTS.COUNTDOWN_TICK, { count });
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                io.to(room.joinCode).emit(SERVER_EVENTS.COUNTDOWN_TICK, { count });
            }
            else {
                clearInterval(interval);
                // Start the drawing round
                const { word, drawerId } = room.startDrawingRound();
                // Broadcast public state to all (TV & guessers)
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
                io.to(room.joinCode).emit(SERVER_EVENTS.ROUND_STARTED, {
                    round: room.currentRound,
                    drawerId,
                    duration: room.settings.roundDuration
                });
                // Send SECRET word exclusively to drawer socket
                for (const [sId, pId] of room.socketPlayerMap.entries()) {
                    if (pId === drawerId) {
                        const payload = {
                            word,
                            roundDuration: room.settings.roundDuration
                        };
                        io.to(sId).emit(SERVER_EVENTS.DRAW_WORD, payload);
                    }
                }
                // Start authoritative server round timer
                setupRoundTimer(room);
            }
        }, 1000);
        room.countdownHandle = interval;
    };
    // Helper to conclude a round and transition to round result
    const handleRoundEnd = (room, reason) => {
        const result = room.endRound(reason);
        const payload = {
            reason,
            result,
            nextStatus: GameStatus.ROUND_RESULT
        };
        io.to(room.joinCode).emit(SERVER_EVENTS.ROUND_ENDED, payload);
        io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
        // Auto-advance from ROUND_RESULT to SCOREBOARD after 5 seconds
        setTimeout(() => {
            if (room.status === GameStatus.ROUND_RESULT) {
                room.status = GameStatus.SCOREBOARD;
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
            }
        }, 5000);
    };
    io.on('connection', (socket) => {
        // 1. CREATE GAME (Usually from TV Host)
        socket.on(CLIENT_EVENTS.CREATE_GAME, (data = {}) => {
            const room = gameManager.createRoom(socket.id, data.settings);
            socket.join(room.joinCode);
            gameManager.bindSocketToRoom(socket.id, room.joinCode);
            socket.emit(SERVER_EVENTS.GAME_CREATED, {
                gameCode: room.joinCode,
                room: room.getPublicState()
            });
            socket.emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
        });
        // 2. JOIN GAME (From Mobile Phone)
        socket.on(CLIENT_EVENTS.JOIN_GAME, (data) => {
            const { gameCode, name, avatar, color, sessionId } = data;
            const room = gameManager.getRoom(gameCode);
            if (!room) {
                socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'Partida no encontrada. Verificá el código.' });
                return;
            }
            if (room.status !== GameStatus.WAITING) {
                // If game already started, check if this is an existing player reconnecting with sessionId
                let existingPlayer = false;
                for (const player of room.players.values()) {
                    if (sessionId && player.sessionId === sessionId) {
                        existingPlayer = true;
                        break;
                    }
                }
                if (!existingPlayer) {
                    socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'La partida ya comenzó. Esperá a la próxima.' });
                    return;
                }
            }
            if (room.players.size >= room.settings.maxPlayers && !room.socketPlayerMap.has(socket.id)) {
                socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'La sala está completa.' });
                return;
            }
            const player = room.addPlayer(socket.id, name, avatar || '🎨', color || '#FF3B30', sessionId || socket.id);
            socket.join(room.joinCode);
            gameManager.bindSocketToRoom(socket.id, room.joinCode);
            socket.emit(SERVER_EVENTS.JOIN_SUCCESS, {
                player,
                gameCode: room.joinCode,
                room: room.getPublicState()
            });
            // Notify everyone in the room
            io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_JOINED, { player });
            io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
        });
        // 3. RECONNECT
        socket.on(CLIENT_EVENTS.RECONNECT, (data) => {
            const { gameCode, playerId, sessionId } = data;
            const room = gameManager.getRoom(gameCode);
            if (!room) {
                socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'Partida no encontrada' });
                return;
            }
            const player = room.getPlayer(playerId);
            if (!player || player.sessionId !== sessionId) {
                socket.emit(SERVER_EVENTS.JOIN_ERROR, { message: 'Sesión no válida' });
                return;
            }
            player.connected = true;
            room.socketPlayerMap.set(socket.id, playerId);
            socket.join(room.joinCode);
            gameManager.bindSocketToRoom(socket.id, room.joinCode);
            socket.emit(SERVER_EVENTS.JOIN_SUCCESS, {
                player,
                gameCode: room.joinCode,
                room: room.getPublicState()
            });
            // Send active strokes history to catch up
            socket.emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
            // If this reconnecting player is the current drawer, re-send the secret word!
            if (room.status === GameStatus.DRAWING && room.currentDrawerId === playerId && room.currentWord) {
                socket.emit(SERVER_EVENTS.DRAW_WORD, {
                    word: room.currentWord,
                    roundDuration: room.settings.roundDuration
                });
            }
            io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_RECONNECTED, { player });
            io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
        });
        // 4. START GAME
        socket.on(CLIENT_EVENTS.START_GAME, () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room)
                return;
            const started = room.startGame();
            if (!started) {
                socket.emit(SERVER_EVENTS.ERROR, { message: 'Se necesitan al menos 2 jugadores para comenzar.' });
                return;
            }
            io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
            startCountdown(room);
        });
        // 5. DRAWING: STROKE POINT
        let currentStroke = null;
        socket.on(CLIENT_EVENTS.SEND_STROKE_POINT, (data) => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room || room.status !== GameStatus.DRAWING)
                return;
            const playerId = room.socketPlayerMap.get(socket.id);
            // ONLY the active drawer can send strokes
            if (playerId !== room.currentDrawerId)
                return;
            if (data.isNewStroke || !currentStroke) {
                currentStroke = {
                    id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    playerId: playerId,
                    points: [data.point],
                    color: data.color,
                    width: data.width,
                    isEraser: data.isEraser,
                    timestamp: Date.now()
                };
                room.addStroke(currentStroke);
            }
            else {
                currentStroke.points.push(data.point);
            }
            // Broadcast to all clients in the room except sender (who already rendered it locally)
            socket.to(room.joinCode).emit(SERVER_EVENTS.STROKE_RECEIVED, {
                point: data.point,
                color: data.color,
                width: data.width,
                isEraser: data.isEraser,
                isNewStroke: data.isNewStroke
            });
        });
        socket.on(CLIENT_EVENTS.SEND_STROKE_END, () => {
            currentStroke = null;
        });
        // 6. DRAWING: CLEAR CANVAS
        socket.on(CLIENT_EVENTS.CLEAR_CANVAS, () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room || room.status !== GameStatus.DRAWING)
                return;
            const playerId = room.socketPlayerMap.get(socket.id);
            if (playerId !== room.currentDrawerId)
                return;
            room.clearCanvas();
            currentStroke = null;
            io.to(room.joinCode).emit(SERVER_EVENTS.CANVAS_CLEARED);
        });
        // 7. DRAWING: UNDO STROKE
        socket.on(CLIENT_EVENTS.UNDO_STROKE, () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room || room.status !== GameStatus.DRAWING)
                return;
            const playerId = room.socketPlayerMap.get(socket.id);
            if (playerId !== room.currentDrawerId)
                return;
            room.undoLastStroke();
            io.to(room.joinCode).emit(SERVER_EVENTS.STROKE_UNDONE);
            // Send full updated strokes to re-render clean canvas
            io.to(room.joinCode).emit(SERVER_EVENTS.SYNC_CANVAS, { strokes: room.strokes });
        });
        // 8. GUESSING: SUBMIT GUESS
        socket.on(CLIENT_EVENTS.SUBMIT_GUESS, (data) => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room || room.status !== GameStatus.DRAWING)
                return;
            const playerId = room.socketPlayerMap.get(socket.id);
            if (!playerId)
                return;
            const player = room.getPlayer(playerId);
            if (!player)
                return;
            const { isCorrect, isClose, pointsAwarded, allGuessed } = room.processGuess(playerId, data.text);
            // Feedback exclusively to the guessing player
            socket.emit(SERVER_EVENTS.GUESS_FEEDBACK, {
                isCorrect,
                isClose,
                pointsAwarded,
                message: isCorrect
                    ? '¡CORRECTO! Adivinaste la palabra.'
                    : isClose
                        ? '¡Estás muy cerca!'
                        : 'Respuesta incorrecta'
            });
            if (isCorrect) {
                // Broadcast that this player guessed correctly (WITHOUT revealing the word!)
                const guessedPayload = {
                    playerId: player.id,
                    playerName: player.name,
                    pointsAwarded,
                    guessOrder: player.guessOrder || 1
                };
                io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_GUESSED, guessedPayload);
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
                // If everyone has guessed, end the round early!
                if (allGuessed) {
                    handleRoundEnd(room, 'ALL_GUESSED');
                }
            }
        });
        // 9. NEXT ROUND (Triggered by Host or Controller)
        socket.on(CLIENT_EVENTS.NEXT_ROUND, () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room || room.status !== GameStatus.SCOREBOARD)
                return;
            const { isGameOver } = room.advanceNextTurn();
            if (isGameOver) {
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_OVER, {
                    winner: room.getWinner(),
                    players: Array.from(room.players.values())
                });
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
            }
            else {
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
                startCountdown(room);
            }
        });
        // 10. PLAY AGAIN
        socket.on(CLIENT_EVENTS.PLAY_AGAIN, () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room)
                return;
            room.status = GameStatus.WAITING;
            room.currentRound = 0;
            room.strokes = [];
            room.lastRoundResult = null;
            for (const player of room.players.values()) {
                player.score = 0;
                player.guessedCurrentRound = false;
                player.currentRoundScore = 0;
            }
            io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
        });
        // 11. DISCONNECT
        socket.on('disconnect', () => {
            const room = gameManager.getRoomBySocket(socket.id);
            if (!room)
                return;
            const { player, newHostId } = room.removePlayer(socket.id);
            gameManager.unbindSocket(socket.id);
            if (player) {
                io.to(room.joinCode).emit(SERVER_EVENTS.PLAYER_LEFT, { playerId: player.id });
                if (newHostId) {
                    io.to(room.joinCode).emit(SERVER_EVENTS.HOST_CHANGED, { hostId: newHostId });
                }
                io.to(room.joinCode).emit(SERVER_EVENTS.GAME_STATE_UPDATE, room.getPublicState());
                // If active drawer disconnected during drawing phase
                if (room.status === GameStatus.DRAWING && room.currentDrawerId === player.id) {
                    // Give 8 seconds grace period for drawer to reconnect, otherwise skip turn
                    setTimeout(() => {
                        if (room.status === GameStatus.DRAWING && room.currentDrawerId === player.id) {
                            const drawer = room.getPlayer(player.id);
                            if (!drawer || !drawer.connected) {
                                handleRoundEnd(room, 'DRAWER_DISCONNECTED');
                            }
                        }
                    }, 8000);
                }
            }
        });
    });
}
