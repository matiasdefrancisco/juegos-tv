import { generateRoomCode } from '@party-draw/shared';
import { GameRoom } from './GameRoom.js';
import { WordService } from './WordService.js';
export class GameManager {
    rooms = new Map(); // joinCode -> GameRoom
    socketRoomMap = new Map(); // socketId -> joinCode
    wordService;
    constructor() {
        this.wordService = new WordService();
        // Periodic cleanup of abandoned rooms every 30 minutes
        setInterval(() => this.cleanupAbandonedRooms(), 30 * 60 * 1000);
    }
    createRoom(hostSocketId, settings) {
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
    getRoom(joinCode) {
        return this.rooms.get(joinCode.toUpperCase().trim());
    }
    getRoomBySocket(socketId) {
        const joinCode = this.socketRoomMap.get(socketId);
        return joinCode ? this.rooms.get(joinCode) : undefined;
    }
    bindSocketToRoom(socketId, joinCode) {
        this.socketRoomMap.set(socketId, joinCode.toUpperCase().trim());
    }
    unbindSocket(socketId) {
        const joinCode = this.socketRoomMap.get(socketId);
        this.socketRoomMap.delete(socketId);
        return joinCode;
    }
    removeRoom(joinCode) {
        const room = this.rooms.get(joinCode);
        if (room) {
            room.clearTimers();
            this.rooms.delete(joinCode);
        }
    }
    cleanupAbandonedRooms() {
        const now = Date.now();
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        for (const [code, room] of this.rooms.entries()) {
            const isOld = now - room.createdAt > TWO_HOURS;
            const allDisconnected = Array.from(room.players.values()).every((p) => !p.connected);
            if (isOld && allDisconnected) {
                room.clearTimers();
                this.rooms.delete(code);
            }
        }
    }
}
