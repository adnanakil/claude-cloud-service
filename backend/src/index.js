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
  noServer: true
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    sessionType: sessionType,
    activeSessions: sessionManager.getAllSessions().length
  });
});

// WebSocket test endpoint
app.get('/api/ws-test', (req, res) => {
  res.json({ 
    websocketUrl: `wss://${req.get('host')}/ws/test`,
    message: 'Use this URL to test WebSocket connection',
    headers: req.headers,
    protocol: req.protocol,
    host: req.get('host')
  });
});

// Add a simple WebSocket echo test endpoint
app.get('/api/ws-echo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>WebSocket Test</title></head>
    <body>
      <h1>WebSocket Echo Test</h1>
      <div id="status">Disconnected</div>
      <div id="messages"></div>
      <script>
        const ws = new WebSocket('wss://${req.get('host')}/ws/echo');
        const status = document.getElementById('status');
        const messages = document.getElementById('messages');
        
        ws.onopen = () => {
          status.textContent = 'Connected';
          ws.send('Hello from browser');
        };
        
        ws.onmessage = (event) => {
          messages.innerHTML += '<p>Received: ' + event.data + '</p>';
        };
        
        ws.onerror = (error) => {
          status.textContent = 'Error: ' + error;
        };
        
        ws.onclose = () => {
          status.textContent = 'Disconnected';
        };
      </script>
    </body>
    </html>
  `);
});

// Handle WebSocket upgrade manually for better Railway compatibility
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade request for:', request.url);
  console.log('Upgrade headers:', request.headers);
  
  // Only handle WebSocket requests that start with /ws/
  if (request.url.startsWith('/ws/')) {
    // Verify WebSocket headers
    const upgradeHeader = request.headers.upgrade;
    const connectionHeader = request.headers.connection;
    
    if (upgradeHeader !== 'websocket' || !connectionHeader.toLowerCase().includes('upgrade')) {
      console.error('Invalid WebSocket headers:', { upgrade: upgradeHeader, connection: connectionHeader });
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
    
    console.log('Valid WebSocket upgrade request, proceeding with handshake');
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('WebSocket upgrade successful');
      wss.emit('connection', ws, request);
    });
  } else {
    console.log('WebSocket request to invalid path:', request.url);
    socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
  }
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  // Handle echo test endpoint
  if (req.url === '/ws/echo') {
    console.log('Echo WebSocket connected');
    ws.send('Echo server connected');
    
    ws.on('message', (message) => {
      console.log('Echo received:', message.toString());
      ws.send(`Echo: ${message}`);
    });
    
    ws.on('close', () => {
      console.log('Echo WebSocket closed');
    });
    
    return;
  }
  
  // Handle normal session connections
  wsHandler.handleConnection(ws, req);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});