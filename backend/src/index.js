import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import sessionRouter from './routes/sessions.js';
import { SessionManager } from './services/sessionManager.js';
import { WebSocketHandler } from './services/websocketHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const sessionManager = new SessionManager();
const wsHandler = new WebSocketHandler(sessionManager);

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRouter(sessionManager));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

wss.on('connection', (ws, req) => {
  wsHandler.handleConnection(ws, req);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});