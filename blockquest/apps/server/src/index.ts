import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { router } from './routes';
import { verifyToken } from './auth';
import { ZoneRoom } from './game/ZoneRoom';

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', router);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });

// Socket auth: handshake carries the same JWT as REST
io.use((socket, next) => {
  try {
    socket.data.userId = verifyToken(String(socket.handshake.auth?.token ?? ''));
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

const village = new ZoneRoom(io);

io.on('connection', (socket) => {
  village.attach(socket, socket.data.userId as string);
});

server.listen(PORT, () => {
  console.log(`BlockQuest server listening on :${PORT}`);
});
