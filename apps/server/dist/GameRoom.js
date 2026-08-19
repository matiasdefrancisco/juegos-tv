import { DEFAULT_GAME_SETTINGS, Difficulty, GameMode, GameStatus, getDifficultyMeta, getWordPattern, RoundMode, SCORING_RULES, TEAM_LIMITS, TEAM_PRESETS, TIMINGS, sanitizePlayerName } from '@party-draw/shared';
export class GameRoom {
    wordService;
    id;
    joinCode;
    hostId;
    status = GameStatus.WAITING;
    players = new Map();
    teams = new Map();
    socketPlayerMap = new Map();
    tvSocketIds = new Set();
    currentRound = 0;
    totalRounds;
    currentDrawerIndex = -1;
    currentDrawerId = null;
    currentWord = null;
    /** La ronda en curso (o la que viene) es carta "¡Juegan todos!" */
    isAllPlayRound = false;
    roundStartedAt = null;
    roundEndsAt = null;
    phaseEndsAt = null;
    settings;
    createdAt = Date.now();
    lastActivityAt = Date.now();
    strokes = [];
    lastRoundResult = null;
    version = 0;
    usedWordIds = new Set();
    drawerQueue = [];
    timerHandle = null;
    countdownHandle = null;
    phaseHandle = null;
    guessMeta = new Map();
    pendingAnswers = [];
    correctGuessersThisRound = [];
    constructor(id, joinCode, hostId, wordService, settings) {
        this.wordService = wordService;
        this.id = id;
        this.joinCode = joinCode;
        this.hostId = hostId;
        this.settings = this.normalizeSettings({ ...DEFAULT_GAME_SETTINGS, ...settings });
        this.totalRounds = this.settings.totalRounds;
        this.syncTeams();
    }
    // ------------------------------------------------------------------
    // Configuración
    // ------------------------------------------------------------------
    normalizeSettings(raw) {
        const categories = Array.isArray(raw.categories) && raw.categories.length > 0
            ? raw.categories
            : DEFAULT_GAME_SETTINGS.categories;
        const mode = Object.values(GameMode).includes(raw.mode) ? raw.mode : GameMode.FREE_FOR_ALL;
        const teamCount = clamp(Math.round(raw.teamCount), TEAM_LIMITS.MIN_TEAMS, TEAM_LIMITS.MAX_TEAMS);
        const maxPlayersPerTeam = clamp(Math.round(raw.maxPlayersPerTeam), TEAM_LIMITS.MIN_PER_TEAM, TEAM_LIMITS.MAX_PER_TEAM);
        // En equipos el cupo real lo define la grilla de equipos
        const maxPlayers = mode === GameMode.TEAMS
            ? teamCount * maxPlayersPerTeam
            : clamp(Math.round(raw.maxPlayers), 2, 24);
        const allPlayChance = clamp(Math.round(raw.allPlayChance ?? 0), 0, 100);
        return {
            totalRounds: clamp(Math.round(raw.totalRounds), 1, 12),
            roundDuration: clamp(Math.round(raw.roundDuration), 15, 300),
            maxPlayers,
            categories: Array.from(new Set(categories)),
            difficulty: Object.values(Difficulty).includes(raw.difficulty)
                ? raw.difficulty
                : Difficulty.EASY,
            mode,
            roundMode: Object.values(RoundMode).includes(raw.roundMode) ? raw.roundMode : RoundMode.TIME,
            teamCount,
            maxPlayersPerTeam,
            attemptsPerTurn: clamp(Math.round(raw.attemptsPerTurn ?? 1), 0, 10),
            allPlayEnabled: !!raw.allPlayEnabled && allPlayChance > 0,
            allPlayChance
        };
    }
    updateSettings(newSettings) {
        if (this.status !== GameStatus.WAITING)
            return;
        this.settings = this.normalizeSettings({ ...this.settings, ...newSettings });
        this.totalRounds = this.settings.totalRounds;
        this.syncTeams();
        this.touch();
    }
    get isTeamMode() {
        return this.settings.mode === GameMode.TEAMS;
    }
    /** Riesgo solo existe en todos contra todos; en equipos manda attemptsPerTurn */
    get isRiskMode() {
        return !this.isTeamMode && this.settings.roundMode === RoundMode.RISK;
    }
    /** Equipo dueño del turno actual. En carta abierta no hay turno exclusivo. */
    get currentTeamId() {
        if (!this.isTeamMode || this.isAllPlayRound)
            return null;
        const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
        return drawer?.teamId ?? null;
    }
    // ------------------------------------------------------------------
    // Equipos
    // ------------------------------------------------------------------
    syncTeams() {
        if (!this.isTeamMode) {
            this.teams.clear();
            for (const player of this.players.values())
                player.teamId = undefined;
            return;
        }
        const desired = this.settings.teamCount;
        for (let i = 0; i < desired; i++) {
            const teamId = `team_${i + 1}`;
            if (!this.teams.has(teamId)) {
                const preset = TEAM_PRESETS[i % TEAM_PRESETS.length];
                this.teams.set(teamId, {
                    id: teamId,
                    name: preset.name,
                    color: preset.color,
                    emoji: preset.emoji,
                    score: 0,
                    currentRoundScore: 0,
                    hasAnswered: false,
                    attemptsUsed: 0
                });
            }
        }
        for (const teamId of Array.from(this.teams.keys())) {
            const index = Number(teamId.replace('team_', ''));
            if (index > desired) {
                this.teams.delete(teamId);
                for (const player of this.players.values()) {
                    if (player.teamId === teamId)
                        player.teamId = undefined;
                }
            }
        }
        for (const player of this.players.values()) {
            if (!player.teamId || !this.teams.has(player.teamId)) {
                player.teamId = this.pickSmallestTeamId();
            }
        }
    }
    pickSmallestTeamId() {
        const counts = new Map();
        for (const teamId of this.teams.keys())
            counts.set(teamId, 0);
        for (const player of this.players.values()) {
            if (player.teamId && counts.has(player.teamId)) {
                counts.set(player.teamId, (counts.get(player.teamId) || 0) + 1);
            }
        }
        const withRoom = Array.from(counts.entries()).filter(([, count]) => count < this.settings.maxPlayersPerTeam);
        const pool = withRoom.length > 0 ? withRoom : Array.from(counts.entries());
        return pool.sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'team_1';
    }
    getTeamMembers(teamId, onlyConnected = true) {
        return Array.from(this.players.values()).filter((p) => p.teamId === teamId && (!onlyConnected || p.connected));
    }
    setPlayerTeam(playerId, teamId) {
        if (!this.isTeamMode || this.status !== GameStatus.WAITING)
            return false;
        const player = this.players.get(playerId);
        const team = this.teams.get(teamId);
        if (!player || !team)
            return false;
        if (player.teamId === teamId)
            return true;
        if (this.getTeamMembers(teamId, false).length >= this.settings.maxPlayersPerTeam) {
            return false;
        }
        player.teamId = teamId;
        this.touch();
        return true;
    }
    getActiveTeams() {
        return Array.from(this.teams.values()).filter((team) => this.getTeamMembers(team.id).length > 0);
    }
    /** Intentos que le quedan al equipo en turno; null si son ilimitados */
    getAttemptsLeft() {
        if (!this.isTeamMode || this.isAllPlayRound)
            return null;
        if (this.settings.attemptsPerTurn <= 0)
            return null;
        const teamId = this.currentTeamId;
        const team = teamId ? this.teams.get(teamId) : undefined;
        if (!team)
            return null;
        return Math.max(0, this.settings.attemptsPerTurn - team.attemptsUsed);
    }
    // ------------------------------------------------------------------
    // Jugadores
    // ------------------------------------------------------------------
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    getPlayerBySocket(socketId) {
        const playerId = this.socketPlayerMap.get(socketId);
        return playerId ? this.players.get(playerId) : undefined;
    }
    getConnectedPlayers() {
        return Array.from(this.players.values()).filter((p) => p.connected);
    }
    touch() {
        this.lastActivityAt = Date.now();
    }
    nextVersion() {
        this.version++;
        return this.version;
    }
    canControl(socketId) {
        if (this.tvSocketIds.has(socketId))
            return true;
        const playerId = this.socketPlayerMap.get(socketId);
        return !!playerId && playerId === this.hostId;
    }
    attachTvSocket(socketId) {
        this.tvSocketIds.add(socketId);
        this.touch();
    }
    addPlayer(socketId, name, avatar, color, sessionId) {
        const sanitizedName = sanitizePlayerName(name);
        this.touch();
        for (const [id, existing] of this.players.entries()) {
            if (existing.sessionId === sessionId) {
                existing.connected = true;
                existing.name = sanitizedName;
                existing.avatar = avatar || existing.avatar;
                existing.color = color || existing.color;
                this.rebindSocket(socketId, id);
                this.syncTeams();
                this.ensureHost();
                return existing;
            }
        }
        const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
        const newPlayer = {
            id: playerId,
            sessionId,
            name: sanitizedName,
            avatar: avatar || '🎨',
            color: color || '#FF3B30',
            score: 0,
            connected: true,
            isHost: false,
            joinedAt: Date.now(),
            guessedCurrentRound: false,
            currentRoundScore: 0,
            hasAnswered: false
        };
        this.players.set(playerId, newPlayer);
        this.rebindSocket(socketId, playerId);
        this.syncTeams();
        this.ensureHost();
        return newPlayer;
    }
    rebindSocket(socketId, playerId) {
        for (const [sId, pId] of this.socketPlayerMap.entries()) {
            if (pId === playerId && sId !== socketId) {
                this.socketPlayerMap.delete(sId);
            }
        }
        this.socketPlayerMap.set(socketId, playerId);
    }
    ensureHost() {
        const current = this.hostId ? this.players.get(this.hostId) : undefined;
        if (current && current.connected) {
            current.isHost = true;
            return undefined;
        }
        const candidate = this.getConnectedPlayers().sort((a, b) => a.joinedAt - b.joinedAt)[0];
        for (const player of this.players.values()) {
            player.isHost = !!candidate && player.id === candidate.id;
        }
        if (!candidate) {
            this.hostId = '';
            return undefined;
        }
        const changed = this.hostId !== candidate.id;
        this.hostId = candidate.id;
        return changed ? candidate.id : undefined;
    }
    removePlayer(socketId) {
        this.tvSocketIds.delete(socketId);
        const playerId = this.socketPlayerMap.get(socketId);
        if (!playerId)
            return { player: undefined };
        const player = this.players.get(playerId);
        if (player)
            player.connected = false;
        this.socketPlayerMap.delete(socketId);
        const newHostId = this.ensureHost();
        return { player, newHostId };
    }
    // ------------------------------------------------------------------
    // Ciclo de partida
    // ------------------------------------------------------------------
    startGame() {
        const connectedPlayers = this.getConnectedPlayers();
        if (connectedPlayers.length < 2)
            return false;
        if (this.isTeamMode) {
            this.syncTeams();
            if (this.getActiveTeams().length < 2)
                return false;
        }
        this.clearTimers();
        this.status = GameStatus.COUNTDOWN;
        this.currentRound = 1;
        this.phaseEndsAt = null;
        // La primera ronda siempre arranca clásica, por turnos
        this.isAllPlayRound = false;
        this.drawerQueue = this.buildDrawerQueue();
        this.currentDrawerIndex = 0;
        this.currentDrawerId = this.drawerQueue[0] ?? null;
        this.touch();
        return !!this.currentDrawerId;
    }
    /**
     * Orden de dibujantes. En equipos se intercala un jugador de cada equipo,
     * de manera que el turno rote parejo entre los equipos.
     */
    buildDrawerQueue() {
        const connected = this.getConnectedPlayers();
        if (!this.isTeamMode) {
            return shuffle(connected.map((p) => p.id));
        }
        const byTeam = this.getActiveTeams().map((team) => shuffle(this.getTeamMembers(team.id).map((p) => p.id)));
        const queue = [];
        const longest = Math.max(0, ...byTeam.map((list) => list.length));
        for (let i = 0; i < longest; i++) {
            for (const list of byTeam) {
                if (list[i])
                    queue.push(list[i]);
            }
        }
        return queue;
    }
    /**
     * Sortea la carta "¡Juegan todos!" para la próxima ronda.
     * Nunca sale dos veces seguidas, para que no pierda la gracia.
     */
    rollAllPlay() {
        if (!this.isTeamMode)
            return false;
        if (!this.settings.allPlayEnabled || this.settings.allPlayChance <= 0)
            return false;
        if (this.getActiveTeams().length < 2)
            return false;
        if (this.isAllPlayRound)
            return false;
        return Math.random() * 100 < this.settings.allPlayChance;
    }
    resetForNewGame() {
        this.clearTimers();
        this.status = GameStatus.WAITING;
        this.currentRound = 0;
        this.currentDrawerIndex = -1;
        this.currentDrawerId = null;
        this.currentWord = null;
        this.isAllPlayRound = false;
        this.roundStartedAt = null;
        this.roundEndsAt = null;
        this.phaseEndsAt = null;
        this.strokes = [];
        this.lastRoundResult = null;
        this.drawerQueue = [];
        this.usedWordIds.clear();
        this.guessMeta.clear();
        this.pendingAnswers = [];
        this.correctGuessersThisRound = [];
        for (const player of this.players.values()) {
            player.score = 0;
            player.guessedCurrentRound = false;
            player.currentRoundScore = 0;
            player.guessOrder = undefined;
            player.hasAnswered = false;
        }
        for (const team of this.teams.values()) {
            team.score = 0;
            team.currentRoundScore = 0;
            team.hasAnswered = false;
            team.attemptsUsed = 0;
        }
        this.ensureHost();
        this.touch();
    }
    startDrawingRound() {
        this.clearTimers();
        this.status = GameStatus.DRAWING;
        this.strokes = [];
        this.correctGuessersThisRound = [];
        this.pendingAnswers = [];
        this.guessMeta.clear();
        this.phaseEndsAt = null;
        for (const player of this.players.values()) {
            player.guessedCurrentRound = false;
            player.currentRoundScore = 0;
            player.guessOrder = undefined;
            player.hasAnswered = false;
        }
        for (const team of this.teams.values()) {
            team.currentRoundScore = 0;
            team.hasAnswered = false;
            team.attemptsUsed = 0;
        }
        this.currentDrawerId = this.drawerQueue[this.currentDrawerIndex];
        const { word } = this.wordService.getRandomWord(this.settings.categories, this.settings.difficulty, this.usedWordIds);
        this.currentWord = word;
        this.usedWordIds.add(word.id);
        const now = Date.now();
        this.roundStartedAt = now;
        this.roundEndsAt = now + this.settings.roundDuration * 1000;
        this.touch();
        return { word, drawerId: this.currentDrawerId };
    }
    // ------------------------------------------------------------------
    // Respuestas
    // ------------------------------------------------------------------
    getRespondingPlayers() {
        const others = this.getConnectedPlayers().filter((p) => p.id !== this.currentDrawerId);
        if (!this.isTeamMode || this.isAllPlayRound)
            return others;
        // Por turnos: solo responde el equipo del dibujante
        return others.filter((p) => p.teamId === this.currentTeamId);
    }
    /** ¿Puede este jugador enviar una respuesta ahora mismo? */
    getBlockReason(playerId) {
        if (playerId === this.currentDrawerId)
            return 'DRAWER';
        const player = this.players.get(playerId);
        if (!player)
            return 'NOT_YOUR_TURN';
        if (player.guessedCurrentRound)
            return 'ALREADY_ANSWERED';
        if (!this.isTeamMode) {
            return this.isRiskMode && player.hasAnswered ? 'ALREADY_ANSWERED' : null;
        }
        // Carta abierta: juegan todos menos el que dibuja
        if (this.isAllPlayRound)
            return null;
        if (player.teamId !== this.currentTeamId)
            return 'NOT_YOUR_TURN';
        const team = player.teamId ? this.teams.get(player.teamId) : undefined;
        if (!team)
            return 'NOT_YOUR_TURN';
        if (team.hasAnswered)
            return 'TEAM_ANSWERED';
        const limit = this.settings.attemptsPerTurn;
        if (limit > 0 && team.attemptsUsed >= limit)
            return 'NO_ATTEMPTS_LEFT';
        return null;
    }
    /**
     * Registra un intento.
     *
     * - Todos contra todos + tiempo: intentos libres, evaluación inmediata.
     * - Todos contra todos + riesgo: un intento, se revela al cerrar la ronda.
     * - Equipos: por turnos. Solo responde el equipo del dibujante, con un tope
     *   de intentos; el resto observa. En carta "¡Juegan todos!" responde
     *   cualquiera y el primero que acierta se lleva los puntos.
     */
    processGuess(playerId, guessText) {
        const base = {
            isCorrect: false,
            isClose: false,
            pointsAwarded: 0,
            roundShouldEnd: false,
            throttled: false,
            pending: false,
            attemptsLeft: this.getAttemptsLeft()
        };
        const word = this.currentWord;
        const roundStartedAt = this.roundStartedAt;
        if (this.status !== GameStatus.DRAWING || !word || !roundStartedAt || !this.roundEndsAt) {
            return base;
        }
        const blocked = this.getBlockReason(playerId);
        if (blocked)
            return { ...base, blocked };
        const player = this.players.get(playerId);
        if (!player)
            return base;
        const team = player.teamId ? this.teams.get(player.teamId) : undefined;
        const now = Date.now();
        // Anti fuerza bruta donde hay reintentos
        const hasRetries = !this.isRiskMode && !(this.isTeamMode && this.settings.attemptsPerTurn === 1);
        if (hasRetries) {
            const meta = this.guessMeta.get(playerId) ?? { lastAt: 0, count: 0 };
            if (now - meta.lastAt < TIMINGS.GUESS_COOLDOWN_MS ||
                meta.count >= TIMINGS.MAX_GUESSES_PER_ROUND) {
                return { ...base, throttled: true };
            }
            this.guessMeta.set(playerId, { lastAt: now, count: meta.count + 1 });
        }
        // ---- Todos contra todos + riesgo: se guarda y se resuelve al final ----
        if (this.isRiskMode) {
            player.hasAnswered = true;
            this.pendingAnswers.push({
                playerId: player.id,
                playerName: player.name,
                text: guessText,
                submittedAt: now
            });
            this.touch();
            const allAnswered = this.getRespondingPlayers().every((p) => p.hasAnswered);
            return {
                ...base,
                pending: true,
                roundShouldEnd: allAnswered,
                endReason: allAnswered ? 'ALL_ANSWERED' : undefined
            };
        }
        // ---- Equipos ----
        if (this.isTeamMode) {
            return this.processTeamGuess(player, team, guessText, word, roundStartedAt, now, base);
        }
        // ---- Todos contra todos + tiempo ----
        const isCorrect = this.wordService.isCorrectGuess(guessText, word);
        if (!isCorrect) {
            return { ...base, isClose: this.wordService.isCloseGuess(guessText, word) };
        }
        player.guessedCurrentRound = true;
        player.hasAnswered = true;
        const order = this.correctGuessersThisRound.length + 1;
        player.guessOrder = order;
        const points = this.awardSoloPoints(player, order, now);
        this.registerCorrectGuess(player, points, roundStartedAt, now, order);
        this.rewardDrawer();
        this.touch();
        const allGuessed = this.getRespondingPlayers().every((p) => p.guessedCurrentRound);
        return {
            ...base,
            isCorrect: true,
            pointsAwarded: points,
            roundShouldEnd: allGuessed,
            endReason: allGuessed ? 'ALL_GUESSED' : undefined
        };
    }
    /** Reglas de equipos: turno exclusivo con tope de intentos, o carta abierta */
    processTeamGuess(player, team, guessText, word, roundStartedAt, now, base) {
        const isCorrect = this.wordService.isCorrectGuess(guessText, word);
        const isClose = !isCorrect && this.wordService.isCloseGuess(guessText, word);
        this.pendingAnswers.push({
            playerId: player.id,
            playerName: player.name,
            teamId: team?.id,
            text: guessText,
            submittedAt: now
        });
        // ---- Carta "¡Juegan todos!": gana el primero que acierta ----
        if (this.isAllPlayRound) {
            if (!isCorrect) {
                this.touch();
                return { ...base, isClose };
            }
            player.guessedCurrentRound = true;
            player.hasAnswered = true;
            player.guessOrder = 1;
            const points = Math.round(SCORING_RULES.ALL_PLAY_CORRECT * this.difficultyMultiplier) +
                this.speedBonus(now);
            player.score += points;
            player.currentRoundScore += points;
            if (team) {
                team.score += points;
                team.currentRoundScore += points;
                team.hasAnswered = true;
            }
            this.registerCorrectGuess(player, points, roundStartedAt, now, 1);
            this.rewardDrawer();
            this.touch();
            // El primero que acierta cierra la ronda
            return {
                ...base,
                isCorrect: true,
                pointsAwarded: points,
                roundShouldEnd: true,
                endReason: 'TEAM_SOLVED',
                teamId: team?.id
            };
        }
        // ---- Turno del equipo ----
        if (!team)
            return base;
        team.attemptsUsed++;
        const limit = this.settings.attemptsPerTurn;
        const attemptsLeft = limit > 0 ? Math.max(0, limit - team.attemptsUsed) : null;
        if (isCorrect) {
            player.guessedCurrentRound = true;
            player.hasAnswered = true;
            player.guessOrder = 1;
            team.hasAnswered = true;
            let points = Math.round(SCORING_RULES.TEAM_CORRECT * this.difficultyMultiplier);
            if (team.attemptsUsed === 1)
                points += SCORING_RULES.FIRST_ATTEMPT_BONUS;
            points += this.speedBonus(now);
            team.score += points;
            team.currentRoundScore += points;
            player.score += points;
            player.currentRoundScore += points;
            this.registerCorrectGuess(player, points, roundStartedAt, now, 1);
            this.rewardDrawer();
            this.touch();
            return {
                ...base,
                isCorrect: true,
                pointsAwarded: points,
                roundShouldEnd: true,
                endReason: 'TEAM_SOLVED',
                attemptsLeft,
                teamId: team.id
            };
        }
        // Falló: si se acabaron los intentos, el turno se termina
        const exhausted = limit > 0 && team.attemptsUsed >= limit;
        if (exhausted)
            team.hasAnswered = true;
        this.touch();
        return {
            ...base,
            isClose,
            attemptsLeft,
            teamId: team.id,
            roundShouldEnd: exhausted,
            endReason: exhausted ? 'ATTEMPTS_EXHAUSTED' : undefined
        };
    }
    registerCorrectGuess(player, points, roundStartedAt, now, order) {
        this.correctGuessersThisRound.push({
            playerId: player.id,
            playerName: player.name,
            points,
            timeTakenSeconds: Math.round((now - roundStartedAt) / 1000),
            order
        });
    }
    get difficultyMultiplier() {
        return getDifficultyMeta(this.settings.difficulty).scoreMultiplier;
    }
    speedBonus(now) {
        if (!this.roundEndsAt)
            return 0;
        const totalDuration = this.settings.roundDuration * 1000;
        const remaining = Math.max(0, this.roundEndsAt - now);
        return Math.round((remaining / totalDuration) * SCORING_RULES.SPEED_BONUS_MAX);
    }
    awardSoloPoints(player, order, now) {
        let base = SCORING_RULES.OTHER_GUESS;
        if (order === 1)
            base = SCORING_RULES.FIRST_GUESS;
        else if (order === 2)
            base = SCORING_RULES.SECOND_GUESS;
        else if (order === 3)
            base = SCORING_RULES.THIRD_GUESS;
        const points = Math.round(base * this.difficultyMultiplier) + this.speedBonus(now);
        player.score += points;
        player.currentRoundScore += points;
        return points;
    }
    rewardDrawer() {
        const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
        if (!drawer)
            return;
        drawer.score += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
        drawer.currentRoundScore += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
        if (this.isTeamMode && drawer.teamId) {
            const team = this.teams.get(drawer.teamId);
            if (team) {
                team.score += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
                team.currentRoundScore += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
            }
        }
    }
    /** Solo para todos contra todos + riesgo: los puntos se calculan al cerrar */
    resolvePendingRiskAnswers() {
        const word = this.currentWord;
        if (!this.isRiskMode || !word)
            return;
        const roundStartedAt = this.roundStartedAt;
        const ordered = [...this.pendingAnswers].sort((a, b) => a.submittedAt - b.submittedAt);
        let correctOrder = 0;
        for (const answer of ordered) {
            const player = this.players.get(answer.playerId);
            if (!player)
                continue;
            const isCorrect = this.wordService.isCorrectGuess(answer.text, word);
            const isClose = !isCorrect && this.wordService.isCloseGuess(answer.text, word);
            if (!isCorrect) {
                if (isClose) {
                    const consolation = Math.round(SCORING_RULES.RISK_CLOSE * this.difficultyMultiplier);
                    player.score += consolation;
                    player.currentRoundScore += consolation;
                }
                continue;
            }
            correctOrder++;
            player.guessedCurrentRound = true;
            player.guessOrder = correctOrder;
            let points = Math.round(SCORING_RULES.RISK_CORRECT * this.difficultyMultiplier);
            if (correctOrder === 1)
                points += SCORING_RULES.TEAM_FIRST_BONUS;
            points += this.speedBonus(answer.submittedAt);
            player.score += points;
            player.currentRoundScore += points;
            this.correctGuessersThisRound.push({
                playerId: player.id,
                playerName: player.name,
                points,
                timeTakenSeconds: roundStartedAt
                    ? Math.round((answer.submittedAt - roundStartedAt) / 1000)
                    : 0,
                order: correctOrder
            });
            this.rewardDrawer();
        }
    }
    buildAnswerLog() {
        const word = this.currentWord;
        if (!word)
            return [];
        return [...this.pendingAnswers]
            .sort((a, b) => a.submittedAt - b.submittedAt)
            .map((answer) => {
            const team = answer.teamId ? this.teams.get(answer.teamId) : undefined;
            const isCorrect = this.wordService.isCorrectGuess(answer.text, word);
            const isClose = !isCorrect && this.wordService.isCloseGuess(answer.text, word);
            const player = this.players.get(answer.playerId);
            return {
                teamId: team?.id ?? '',
                teamName: team?.name ?? 'Sin equipo',
                teamColor: team?.color ?? '#64748B',
                playerId: answer.playerId,
                playerName: answer.playerName,
                text: answer.text.slice(0, 60),
                isCorrect,
                isClose,
                points: isCorrect ? player?.currentRoundScore ?? 0 : 0,
                submittedAt: answer.submittedAt
            };
        });
    }
    endRound(_reason) {
        this.clearTimers();
        this.resolvePendingRiskAnswers();
        this.status = GameStatus.ROUND_RESULT;
        this.phaseEndsAt = Date.now() + TIMINGS.ROUND_RESULT_MS;
        const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
        const turnTeam = drawer?.teamId ? this.teams.get(drawer.teamId) : undefined;
        const summary = {
            word: this.currentWord ? this.currentWord.text : '',
            category: this.currentWord ? this.currentWord.category : '',
            difficulty: this.currentWord ? this.currentWord.difficulty : 1,
            drawerId: this.currentDrawerId || '',
            drawerName: drawer ? drawer.name : 'Dibujante',
            drawerTeamId: drawer?.teamId,
            drawerPoints: drawer ? drawer.currentRoundScore : 0,
            wasAllPlay: this.isAllPlayRound,
            turnTeamId: this.isAllPlayRound ? null : turnTeam?.id ?? null,
            turnTeamName: this.isAllPlayRound ? null : turnTeam?.name ?? null,
            correctGuessers: [...this.correctGuessersThisRound].sort((a, b) => a.order - b.order),
            teamAnswers: this.isTeamMode || this.isRiskMode ? this.buildAnswerLog() : []
        };
        this.lastRoundResult = summary;
        this.touch();
        return summary;
    }
    advanceNextTurn() {
        this.phaseEndsAt = null;
        this.currentDrawerIndex++;
        while (this.currentDrawerIndex < this.drawerQueue.length &&
            !this.players.get(this.drawerQueue[this.currentDrawerIndex])?.connected) {
            this.currentDrawerIndex++;
        }
        if (this.currentDrawerIndex >= this.drawerQueue.length) {
            this.currentRound++;
            this.currentDrawerIndex = 0;
            this.drawerQueue = this.buildDrawerQueue();
        }
        const notEnoughPlayers = this.getConnectedPlayers().length < 2;
        const notEnoughTeams = this.isTeamMode && this.getActiveTeams().length < 2;
        if (this.currentRound > this.totalRounds ||
            this.drawerQueue.length === 0 ||
            notEnoughPlayers ||
            notEnoughTeams) {
            this.status = GameStatus.GAME_OVER;
            this.currentDrawerId = null;
            this.isAllPlayRound = false;
            this.touch();
            return { nextStatus: GameStatus.GAME_OVER, isGameOver: true };
        }
        // Se sortea la carta antes de la cuenta regresiva, así la TV puede anunciarla
        this.isAllPlayRound = this.rollAllPlay();
        this.status = GameStatus.COUNTDOWN;
        this.currentDrawerId = this.drawerQueue[this.currentDrawerIndex];
        this.touch();
        return { nextStatus: GameStatus.COUNTDOWN, isGameOver: false };
    }
    // ------------------------------------------------------------------
    // Lienzo
    // ------------------------------------------------------------------
    appendStrokePoints(playerId, points, color, width, isEraser, isNewStroke) {
        if (points.length === 0)
            return;
        const last = this.strokes[this.strokes.length - 1];
        const canContinue = !isNewStroke && last && last.playerId === playerId;
        if (canContinue) {
            last.points.push(...points);
            return;
        }
        this.strokes.push({
            id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            playerId,
            points: [...points],
            color,
            width,
            isEraser,
            timestamp: Date.now()
        });
    }
    undoLastStroke() {
        return this.strokes.pop();
    }
    clearCanvas() {
        this.strokes = [];
    }
    // ------------------------------------------------------------------
    // Temporizadores
    // ------------------------------------------------------------------
    setRoundTimer(handle) {
        if (this.timerHandle)
            clearTimeout(this.timerHandle);
        this.timerHandle = handle;
    }
    setCountdownTimer(handle) {
        if (this.countdownHandle)
            clearInterval(this.countdownHandle);
        this.countdownHandle = handle;
    }
    setPhaseTimer(handle) {
        if (this.phaseHandle)
            clearTimeout(this.phaseHandle);
        this.phaseHandle = handle;
    }
    clearTimers() {
        if (this.timerHandle) {
            clearTimeout(this.timerHandle);
            this.timerHandle = null;
        }
        if (this.countdownHandle) {
            clearInterval(this.countdownHandle);
            this.countdownHandle = null;
        }
        if (this.phaseHandle) {
            clearTimeout(this.phaseHandle);
            this.phaseHandle = null;
        }
    }
    // ------------------------------------------------------------------
    // Resultados
    // ------------------------------------------------------------------
    getWinner() {
        const list = Array.from(this.players.values());
        if (list.length === 0)
            return null;
        return [...list].sort((a, b) => b.score - a.score)[0];
    }
    getWinnerTeam() {
        if (!this.isTeamMode)
            return null;
        const list = this.getActiveTeams();
        if (list.length === 0)
            return null;
        return [...list].sort((a, b) => b.score - a.score)[0];
    }
    getPublicState() {
        const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
        const isOver = this.status === GameStatus.GAME_OVER;
        return {
            id: this.id,
            joinCode: this.joinCode,
            hostId: this.hostId,
            status: this.status,
            players: Array.from(this.players.values()),
            teams: Array.from(this.teams.values()),
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            currentDrawerId: this.currentDrawerId,
            currentDrawerName: drawer ? drawer.name : undefined,
            currentDrawerTeamId: drawer?.teamId ?? null,
            currentTeamId: this.currentTeamId,
            isAllPlayRound: this.isAllPlayRound,
            attemptsLeft: this.getAttemptsLeft(),
            roundStartedAt: this.roundStartedAt,
            roundEndsAt: this.roundEndsAt,
            phaseEndsAt: this.phaseEndsAt,
            wordCategory: this.currentWord ? this.currentWord.category : null,
            wordPattern: this.currentWord ? getWordPattern(this.currentWord.text) : null,
            settings: this.settings,
            createdAt: this.createdAt,
            lastRoundResult: this.lastRoundResult,
            winner: isOver ? this.getWinner() : null,
            winnerTeam: isOver ? this.getWinnerTeam() : null,
            version: this.version
        };
    }
}
function clamp(value, min, max) {
    if (Number.isNaN(value))
        return min;
    return Math.min(max, Math.max(min, value));
}
function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
