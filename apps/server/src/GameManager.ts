import { generateRoomCode, GameSettings } from '@party-draw/shared';
import { GameRoom } from './GameRoom.js';
import { WordService } from './WordService.js';

/** Sin nadie conectado durante este lapso, la sala se descarta */
const IDLE_ROOM_TTL_MS = 20 * 60 * 1000;
/** Tope duro de vida de una sala, aunque siga habiendo gente */
const MAX_ROOM_LIFETIME_MS = 6 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map(); // joinCode -> GameRoom
  private socketRoomMap: Map<string, string> = new Map(); // socketId -> joinCode
  private readonly wordService: WordService;
  private cleanupHandle: NodeJS.Timeout;

  constructor() {
    this.wordService = new WordService();
    this.cleanupHandle = setInterval(() => this.cleanupAbandonedRooms(), CLEANUP_INTERVAL_MS);
    // No mantiene vivo el proceso solo por el timer de limpieza
    this.cleanupHandle.unref?.();
  }

  public createRoom(settings?: Partial<GameSettings>): GameRoom {
    let joinCode = generateRoomCode();
    while (this.rooms.has(joinCode)) {
      joinCode = generateRoomCode();
    }

    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    const newRoom = new GameRoom(roomId, joinCode, '', this.wordService, settings);

    this.rooms.set(joinCode, newRoom);
    return newRoom;
  }

  public getRoom(joinCode: string): GameRoom | undefined {
    if (!joinCode) return undefined;
    return this.rooms.get(joinCode.toUpperCase().trim());
  }

  public getRoomBySocket(socketId: string): GameRoom | undefined {
    const joinCode = this.socketRoomMap.get(socketId);
    return joinCode ? this.rooms.get(joinCode) : undefined;
  }

  public bindSocketToRoom(socketId: string, joinCode: string): void {
    this.socketRoomMap.set(socketId, joinCode.toUpperCase().trim());
  }

  public unbindSocket(socketId: string): string | undefined {
    const joinCode = this.socketRoomMap.get(socketId);
    this.socketRoomMap.delete(socketId);
    return joinCode;
  }

  public removeRoom(joinCode: string): void {
    const room = this.rooms.get(joinCode);
    if (room) {
      room.clearTimers();
      this.rooms.delete(joinCode);
    }
  }

  public get roomCount(): number {
    return this.rooms.size;
  }

  private cleanupAbandonedRooms(): void {
    const now = Date.now();

    for (const [code, room] of this.rooms.entries()) {
      const nobodyConnected =
        room.getConnectedPlayers().length === 0 && room.tvSocketIds.size === 0;
      const idleTooLong = nobodyConnected && now - room.lastActivityAt > IDLE_ROOM_TTL_MS;
      const tooOld = now - room.createdAt > MAX_ROOM_LIFETIME_MS;

      if (idleTooLong || tooOld) {
        room.clearTimers();
        this.rooms.delete(code);

        // Limpia los sockets huérfanos que apuntaban a esta sala
        for (const [socketId, joinCode] of this.socketRoomMap.entries()) {
          if (joinCode === code) this.socketRoomMap.delete(socketId);
        }
      }
    }
  }
}
