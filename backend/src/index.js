import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import sessionRouter from './routes/sessions.js';
import debugRouter from './routes/debug.js';
import { SessionManager } from './services/sessionManager.js';
import { MockSessionManager } from './services/mockSessionManager.js';
import { WebSocketHandler } from './services/websocketHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Use mock session manager if Claude is not available
const useMock = process.env.USE_MOCK === 'true';
const sessionManager = useMock ? new MockSessionManager() : new SessionManager();
const wsHandler = new WebSocketHandler(sessionManager);

if (useMock) {
  console.log('Running in MOCK mode - Claude CLI not required');
} else {
  console.log('Running with real Claude CLI');
}

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRouter(sessionManager));
app.use('/api/debug', debugRouter());

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