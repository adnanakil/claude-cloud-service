import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Simple session manager that uses exec instead of PTY
export class ExecSessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.sessionsDir = process.env.SESSIONS_DIR || '/tmp/claude-sessions';
    this.initializeSessionsDir();
  }

  async initializeSessionsDir() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create sessions directory:', error);
    }
  }

  async createSession(userId) {
    const sessionId = uuidv4();
    const sessionDir = path.join(this.sessionsDir, sessionId);
    
    try {
      await fs.mkdir(sessionDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create session directory:', error);
    }
    
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      currentProcess: null,
      cwd: sessionDir
    };

    this.sessions.set(sessionId, session);
    
    // Send initial message
    setTimeout(() => {
      this.emit('output', sessionId, 'Claude CLI Session (Exec Mode)\n');
      this.emit('output', sessionId, 'Type your commands below:\n$ ');
    }, 100);

    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  sendCommand(sessionId, command) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.lastActivity = new Date();
    
    // Echo the command
    this.emit('output', sessionId, command + '\n');
    
    // Execute the command
    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
    };
    
    console.log(`Executing command: ${command} in ${session.cwd}`);
    
    const child = exec(command, {
      cwd: session.cwd,
      env: env,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      if (error) {
        this.emit('output', sessionId, `Error: ${error.message}\n`);
      }
      if (stdout) {
        this.emit('output', sessionId, stdout);
      }
      if (stderr) {
        this.emit('output', sessionId, `Error: ${stderr}`);
      }
      this.emit('output', sessionId, '$ ');
    });
    
    session.currentProcess = child;
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.currentProcess) {
        session.currentProcess.kill();
      }
      this.sessions.delete(sessionId);
    }
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));
  }
}