import { generateRoomCode, GameSettings, Player } from '@party-draw/shared';
import { GameRoom } from './GameRoom.js';
import { WordService } from './WordService.js';

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map(); // joinCode -> GameRoom
  private socketRoomMap: Map<string, string> = new Map(); // socketId -> joinCode
  private readonly wordService: WordService;

  constructor() {
    this.wordService = new WordService();

    // Periodic cleanup of abandoned rooms every 30 minutes
    setInterval(() => this.cleanupAbandonedRooms(), 30 * 60 * 1000);
  }

  public createRoom(hostSocketId: string, settings?: Partial<GameSettings>): GameRoom {
    let joinCode = generateRoomCode();
    // Ensure unique code
    while (this.rooms.has(joinCode)) {
      joinCode = generateRoomCode();
    }

    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    const newRoom = new GameRoom(roomId, joinCode, '', this.wordService, settings);

    this.rooms.set(joinCode, newRoom);
    return newRoom;
  }

  public getRoom(joinCode: string): GameRoom | undefined {
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

  private cleanupAbandonedRooms(): void {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      const isOld = now - room.createdAt > TWO_HOURS;
      const allDisconnected = Array.from(room.players.values()).every((p: Player) => !p.connected);

      if (isOld && allDisconnected) {
        room.clearTimers();
        this.rooms.delete(code);
      }
    }
  }
}
