import {
  DEFAULT_GAME_SETTINGS,
  GameSettings,
  GameStatus,
  Player,
  PublicGameState,
  RoundResultSummary,
  SCORING_RULES,
  Stroke,
  Word,
  sanitizePlayerName
} from '@party-draw/shared';
import { WordService } from './WordService.js';

export class GameRoom {
  public readonly id: string;
  public readonly joinCode: string;
  public hostId: string;
  public status: GameStatus = GameStatus.WAITING;
  public players: Map<string, Player> = new Map();
  public socketPlayerMap: Map<string, string> = new Map(); // socketId -> playerId
  
  public currentRound: number = 0;
  public totalRounds: number;
  public currentDrawerIndex: number = -1;
  public currentDrawerId: string | null = null;
  public currentWord: Word | null = null;
  
  public roundStartedAt: number | null = null;
  public roundEndsAt: number | null = null;
  public settings: GameSettings;
  public createdAt: number = Date.now();
  
  public strokes: Stroke[] = [];
  public lastRoundResult: RoundResultSummary | null = null;
  
  private usedWordIds: Set<string> = new Set();
  private drawerQueue: string[] = []; // player IDs in order of turns
  private timerHandle: NodeJS.Timeout | null = null;
  private countdownHandle: NodeJS.Timeout | null = null;
  private correctGuessersThisRound: Array<{
    playerId: string;
    playerName: string;
    points: number;
    timeTakenSeconds: number;
    order: number;
  }> = [];

  constructor(
    id: string,
    joinCode: string,
    hostId: string,
    private readonly wordService: WordService,
    settings?: Partial<GameSettings>
  ) {
    this.id = id;
    this.joinCode = joinCode;
    this.hostId = hostId;
    this.settings = { ...DEFAULT_GAME_SETTINGS, ...settings };
    this.totalRounds = this.settings.totalRounds;
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getPlayerBySocket(socketId: string): Player | undefined {
    const playerId = this.socketPlayerMap.get(socketId);
    return playerId ? this.players.get(playerId) : undefined;
  }

  public addPlayer(
    socketId: string,
    name: string,
    avatar: string,
    color: string,
    sessionId: string
  ): Player {
    const sanitizedName = sanitizePlayerName(name);
    
    // Check if player with same sessionId already exists (reconnection case)
    for (const [id, existingPlayer] of this.players.entries()) {
      if (existingPlayer.sessionId === sessionId) {
        existingPlayer.connected = true;
        existingPlayer.name = sanitizedName;
        this.socketPlayerMap.set(socketId, id);
        return existingPlayer;
      }
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const newPlayer: Player = {
      id: playerId,
      sessionId,
      name: sanitizedName,
      avatar: avatar || '🎨',
      color: color || '#FF3B30',
      score: 0,
      connected: true,
      isHost: playerId === this.hostId,
      joinedAt: Date.now(),
      guessedCurrentRound: false,
      currentRoundScore: 0
    };

    this.players.set(playerId, newPlayer);
    this.socketPlayerMap.set(socketId, playerId);
    return newPlayer;
  }

  public removePlayer(socketId: string): { player: Player | undefined; newHostId?: string } {
    const playerId = this.socketPlayerMap.get(socketId);
    if (!playerId) return { player: undefined };

    const player = this.players.get(playerId);
    if (player) {
      player.connected = false;
    }
    this.socketPlayerMap.delete(socketId);

    let newHostId: string | undefined;
    // If host disconnected, reassign host role to first available connected player
    if (player && player.isHost) {
      player.isHost = false;
      const activePlayer = Array.from(this.players.values()).find((p) => p.connected);
      if (activePlayer) {
        activePlayer.isHost = true;
        this.hostId = activePlayer.id;
        newHostId = activePlayer.id;
      }
    }

    return { player, newHostId };
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    if (this.status !== GameStatus.WAITING) return;
    this.settings = { ...this.settings, ...newSettings };
    this.totalRounds = this.settings.totalRounds;
  }

  /**
   * Initializes player turn queue and starts the game
   */
  public startGame(): boolean {
    const connectedPlayers = Array.from(this.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      return false;
    }

    this.status = GameStatus.COUNTDOWN;
    this.currentRound = 1;
    
    // Shuffle player IDs for random turn order
    this.drawerQueue = connectedPlayers.map((p) => p.id).sort(() => Math.random() - 0.5);
    this.currentDrawerIndex = 0;
    this.currentDrawerId = this.drawerQueue[0];

    return true;
  }

  /**
   * Starts drawing round
   */
  public startDrawingRound(): { word: Word; drawerId: string } {
    this.clearTimers();
    this.status = GameStatus.DRAWING;
    this.strokes = [];
    this.correctGuessersThisRound = [];

    // Reset round scores and guess state
    for (const player of this.players.values()) {
      player.guessedCurrentRound = false;
      player.currentRoundScore = 0;
      player.guessOrder = undefined;
    }

    this.currentDrawerId = this.drawerQueue[this.currentDrawerIndex];
    this.currentWord = this.wordService.getRandomWord(this.settings.categories, this.usedWordIds);
    this.usedWordIds.add(this.currentWord.id);

    const now = Date.now();
    this.roundStartedAt = now;
    this.roundEndsAt = now + this.settings.roundDuration * 1000;

    return {
      word: this.currentWord,
      drawerId: this.currentDrawerId
    };
  }

  /**
   * Evaluates a guess from a player
   */
  public processGuess(
    playerId: string,
    guessText: string
  ): {
    isCorrect: boolean;
    isClose: boolean;
    pointsAwarded: number;
    allGuessed: boolean;
  } {
    if (this.status !== GameStatus.DRAWING || !this.currentWord || !this.roundStartedAt || !this.roundEndsAt) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, allGuessed: false };
    }

    // Drawer cannot guess
    if (playerId === this.currentDrawerId) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, allGuessed: false };
    }

    const player = this.players.get(playerId);
    if (!player || player.guessedCurrentRound) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, allGuessed: false };
    }

    const isCorrect = this.wordService.isCorrectGuess(guessText, this.currentWord);
    if (isCorrect) {
      player.guessedCurrentRound = true;
      const order = this.correctGuessersThisRound.length + 1;
      player.guessOrder = order;

      // Calculate points
      let basePoints = SCORING_RULES.OTHER_GUESS;
      if (order === 1) basePoints = SCORING_RULES.FIRST_GUESS;
      else if (order === 2) basePoints = SCORING_RULES.SECOND_GUESS;
      else if (order === 3) basePoints = SCORING_RULES.THIRD_GUESS;

      // Speed bonus based on remaining time percentage
      const totalDuration = this.settings.roundDuration * 1000;
      const remainingTime = Math.max(0, this.roundEndsAt - Date.now());
      const speedRatio = remainingTime / totalDuration;
      const speedBonus = Math.round(speedRatio * SCORING_RULES.SPEED_BONUS_MAX);

      const pointsAwarded = basePoints + speedBonus;
      player.score += pointsAwarded;
      player.currentRoundScore = pointsAwarded;

      // Award bonus points to the drawer for each correct guesser
      const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
      if (drawer) {
        drawer.score += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
        drawer.currentRoundScore += SCORING_RULES.DRAWER_BONUS_PER_GUESS;
      }

      const timeTaken = Math.round((Date.now() - this.roundStartedAt) / 1000);
      this.correctGuessersThisRound.push({
        playerId: player.id,
        playerName: player.name,
        points: pointsAwarded,
        timeTakenSeconds: timeTaken,
        order
      });

      // Check if all non-drawer connected players have guessed
      const guessers = Array.from(this.players.values()).filter(
        (p) => p.connected && p.id !== this.currentDrawerId
      );
      const allGuessed = guessers.length > 0 && guessers.every((p) => p.guessedCurrentRound);

      return { isCorrect: true, isClose: false, pointsAwarded, allGuessed };
    }

    const isClose = this.wordService.isCloseGuess(guessText, this.currentWord);
    return { isCorrect: false, isClose, pointsAwarded: 0, allGuessed: false };
  }

  /**
   * Concludes the current round and generates summary
   */
  public endRound(reason: 'ALL_GUESSED' | 'TIME_UP' | 'DRAWER_DISCONNECTED'): RoundResultSummary {
    this.clearTimers();
    this.status = GameStatus.ROUND_RESULT;

    const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
    const summary: RoundResultSummary = {
      word: this.currentWord ? this.currentWord.text : '',
      category: this.currentWord ? this.currentWord.category : '',
      drawerId: this.currentDrawerId || '',
      drawerName: drawer ? drawer.name : 'Dibujante',
      drawerPoints: drawer ? drawer.currentRoundScore : 0,
      correctGuessers: [...this.correctGuessersThisRound]
    };

    this.lastRoundResult = summary;
    return summary;
  }

  /**
   * Advances to next turn/round or game over
   */
  public advanceNextTurn(): { nextStatus: GameStatus; isGameOver: boolean } {
    this.currentDrawerIndex++;

    // If all players have drawn in this round, advance round number
    if (this.currentDrawerIndex >= this.drawerQueue.length) {
      this.currentRound++;
      this.currentDrawerIndex = 0;
      // Re-shuffle or re-order for next round
      const connectedPlayers = Array.from(this.players.values()).filter((p) => p.connected);
      this.drawerQueue = connectedPlayers.map((p) => p.id);
    }

    // Check if total rounds reached
    if (this.currentRound > this.totalRounds || this.drawerQueue.length === 0) {
      this.status = GameStatus.GAME_OVER;
      return { nextStatus: GameStatus.GAME_OVER, isGameOver: true };
    }

    this.status = GameStatus.COUNTDOWN;
    this.currentDrawerId = this.drawerQueue[this.currentDrawerIndex];
    return { nextStatus: GameStatus.COUNTDOWN, isGameOver: false };
  }

  /**
   * Adds a stroke point / stroke to active history
   */
  public addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
  }

  public undoLastStroke(): Stroke | undefined {
    return this.strokes.pop();
  }

  public clearCanvas(): void {
    this.strokes = [];
  }

  public clearTimers(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
  }

  public getWinner(): Player | null {
    const playersList = Array.from(this.players.values());
    if (playersList.length === 0) return null;
    return playersList.sort((a, b) => b.score - a.score)[0];
  }

  /**
   * Returns sanitized public state (NO secret word!) for TV and guessers
   */
  public getPublicState(): PublicGameState {
    const drawer = this.currentDrawerId ? this.players.get(this.currentDrawerId) : undefined;
    return {
      id: this.id,
      joinCode: this.joinCode,
      hostId: this.hostId,
      status: this.status,
      players: Array.from(this.players.values()),
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      currentDrawerId: this.currentDrawerId,
      currentDrawerName: drawer ? drawer.name : undefined,
      roundStartedAt: this.roundStartedAt,
      roundEndsAt: this.roundEndsAt,
      wordCategory: this.currentWord ? this.currentWord.category : null,
      wordLength: this.currentWord ? this.currentWord.text.length : null,
      settings: this.settings,
      createdAt: this.createdAt,
      lastRoundResult: this.lastRoundResult,
      winner: this.status === GameStatus.GAME_OVER ? this.getWinner() : null
    };
  }
}
