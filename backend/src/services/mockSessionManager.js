import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export class MockSessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
  }

  async createSession(userId) {
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      mockMode: true
    };

    // Simulate a terminal session
    setTimeout(() => {
      this.emit('output', sessionId, 'Welcome to Mock Claude Terminal\n');
      this.emit('output', sessionId, 'This is a test mode - Claude CLI is not available\n');
      this.emit('output', sessionId, '$ ');
    }, 100);

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  sendCommand(sessionId, command) {
    console.log('MockSessionManager.sendCommand:', sessionId, command);
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('Session not found in sendCommand:', sessionId);
      throw new Error('Session not found');
    }

    session.lastActivity = new Date();
    
    // Echo the command
    console.log('Emitting output for command:', command);
    this.emit('output', sessionId, command + '\n');
    
    // Simulate some responses
    setTimeout(() => {
      if (command === 'help') {
        this.emit('output', sessionId, 'Available commands: help, echo, test, exit\n');
      } else if (command.startsWith('echo ')) {
        this.emit('output', sessionId, command.substring(5) + '\n');
      } else if (command === 'test') {
        this.emit('output', sessionId, 'Mock session is working correctly!\n');
      } else if (command === 'exit') {
        this.emit('output', sessionId, 'Goodbye!\n');
        this.emit('exit', sessionId, 0);
        this.sessions.delete(sessionId);
        return;
      } else {
        this.emit('output', sessionId, `Mock response for: ${command}\n`);
      }
      this.emit('output', sessionId, '$ ');
    }, 100);
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
    }
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      mockMode: session.mockMode
    }));
  }
}