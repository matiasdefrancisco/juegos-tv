import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import dotenv from 'dotenv';
import { GameManager } from './GameManager.js';
import { setupSocketHandlers } from './socketHandler.js';
import { initFirebase } from './firestore.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: 10000,
    pingInterval: 5000
});
const gameManager = new GameManager();
setupSocketHandlers(io, gameManager);
initFirebase();
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Party Draw Backend'
    });
});
const PORT = process.env.PORT || 3001;
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
server.listen(PORT, () => {
    const localIp = getLocalIpAddress();
    console.log('====================================================');
    console.log(`🎨 PARTY DRAW SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📡 Local:   http://localhost:${PORT}`);
    console.log(`📱 Network: http://${localIp}:${PORT}`);
    console.log('====================================================');
});
