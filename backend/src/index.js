import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import sessionRouter from './routes/sessions.js';
import debugRouter from './routes/debug.js';
import { SessionManager } from './services/sessionManager.js';
import { MockSessionManager } from './services/mockSessionManager.js';
import { ClaudeSessionManager } from './services/claudeSessionManager.js';
import { ClaudeApiManager } from './services/claudeApiManager.js';
import { WebSocketHandler } from './services/websocketHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  noServer: true,
  path: '/ws'
});

// Use different session managers based on environment
const sessionType = process.env.SESSION_TYPE || 'api'; // 'api', 'claude', 'mock', or 'pty'
let sessionManager;

switch (sessionType) {
  case 'mock':
    sessionManager = new MockSessionManager();
    console.log('Running in MOCK mode');
    break;
  case 'pty':
    sessionManager = new SessionManager();
    console.log('Running with PTY-based Claude CLI');
    break;
  case 'claude':
    sessionManager = new ClaudeSessionManager();
    console.log('Running with subprocess-based Claude CLI');
    break;
  case 'api':
  default:
    sessionManager = new ClaudeApiManager();
    console.log('Running with API-based Claude manager');
    break;
}

const wsHandler = new WebSocketHandler(sessionManager);

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRouter(sessionManager));
app.use('/api/debug', debugRouter());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket test endpoint
app.get('/api/ws-test', (req, res) => {
  res.json({ 
    websocketUrl: `wss://${req.get('host')}/ws/test`,
    message: 'Use this URL to test WebSocket connection'
  });
});

// Handle WebSocket upgrade manually for better Railway compatibility
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade request for:', request.url);
  
  // Only handle WebSocket requests that start with /ws/
  if (request.url.startsWith('/ws/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  wsHandler.handleConnection(ws, req);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});