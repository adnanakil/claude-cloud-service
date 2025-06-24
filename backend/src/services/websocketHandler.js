export class WebSocketHandler {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.connections = new Map();
  }

  handleConnection(ws, req) {
    const sessionId = this.extractSessionId(req.url);
    console.log('WebSocket connection attempt for URL:', req.url);
    console.log('Extracted session ID:', sessionId);
    
    if (!sessionId) {
      ws.close(1008, 'Session ID required');
      return;
    }

    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      console.log('Session not found:', sessionId);
      console.log('Available sessions:', this.sessionManager.getAllSessions().map(s => s.id));
      ws.close(1008, 'Session not found');
      return;
    }

    console.log('WebSocket connected for session:', sessionId);
    console.log('Session details:', { id: session.id, userId: session.userId });
    this.connections.set(sessionId, ws);

    ws.on('message', async (message) => {
      console.log('Received WebSocket message:', message.toString());
      try {
        const data = JSON.parse(message);
        await this.handleMessage(sessionId, data, ws);
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      this.connections.delete(sessionId);
    });

    const outputListener = (sid, output) => {
      if (sid === sessionId && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: output
        }));
      }
    };

    const exitListener = (sid, code) => {
      if (sid === sessionId && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'exit',
          code
        }));
        ws.close();
      }
    };

    this.sessionManager.on('output', outputListener);
    this.sessionManager.on('exit', exitListener);

    ws.on('close', () => {
      this.sessionManager.removeListener('output', outputListener);
      this.sessionManager.removeListener('exit', exitListener);
    });

    // Send initial connection message
    try {
      ws.send(JSON.stringify({
        type: 'connected',
        sessionId
      }));
      console.log('Sent connected message to client');
    } catch (error) {
      console.error('Failed to send connected message:', error);
    }
  }

  async handleMessage(sessionId, data, ws) {
    console.log('Handling message type:', data.type, 'for session:', sessionId);
    switch (data.type) {
      case 'command':
        console.log('Sending command to session:', data.command);
        this.sessionManager.sendCommand(sessionId, data.command);
        break;
      
      case 'resize':
        const session = this.sessionManager.getSession(sessionId);
        if (session && session.pty) {
          session.pty.resize(data.cols, data.rows);
        }
        break;
      
      default:
        throw new Error(`Unknown message type: ${data.type}`);
    }
  }

  extractSessionId(url) {
    const match = url.match(/\/ws\/(.+)/);
    return match ? match[1] : null;
  }
}