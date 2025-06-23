export class WebSocketHandler {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.connections = new Map();
  }

  handleConnection(ws, req) {
    const sessionId = this.extractSessionId(req.url);
    
    if (!sessionId) {
      ws.close(1008, 'Session ID required');
      return;
    }

    this.connections.set(sessionId, ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleMessage(sessionId, data, ws);
      } catch (error) {
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

    ws.send(JSON.stringify({
      type: 'connected',
      sessionId
    }));
  }

  async handleMessage(sessionId, data, ws) {
    switch (data.type) {
      case 'command':
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