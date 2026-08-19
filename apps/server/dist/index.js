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
/**
 * Orígenes permitidos. Con ALLOWED_ORIGINS vacío se acepta cualquiera,
 * que es lo práctico en red local (los celulares entran por IP).
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
const corsOptions = {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST']
};
const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 20000,
    pingInterval: 10000,
    // Los trazos son mensajes chicos y frecuentes: no hace falta buffer grande
    maxHttpBufferSize: 1e5
});
const gameManager = new GameManager();
setupSocketHandlers(io, gameManager);
initFirebase();
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Party Draw Backend',
        uptimeSeconds: Math.round(process.uptime()),
        activeRooms: gameManager.roomCount,
        connectedSockets: io.engine.clientsCount
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
    console.log(`🔒 CORS:    ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'abierto (*)'}`);
    console.log('====================================================');
});
// Cierre ordenado para que los redeploys no dejen sockets colgados
function shutdown(signal) {
    console.log(`\n${signal} recibido, cerrando servidor...`);
    io.close(() => {
        server.close(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
