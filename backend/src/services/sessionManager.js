import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import { spawn } from 'node-pty';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class SessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.docker = new Docker();
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
    
    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      HOME: sessionDir
    };
    
    // Use the claude command
    const claudeCommand = 'claude';
    const args = [
      '--no-update-check',
      sessionDir // Pass the session directory to Claude
    ];
    
    console.log(`Starting Claude session in ${sessionDir}`);
    console.log(`Environment: ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
    
    const pty = spawn(claudeCommand, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: sessionDir,
      env: env
    });
    
    // Add error handling
    pty.on('error', (error) => {
      console.error('Failed to spawn Claude:', error);
      this.emit('output', sessionId, `Error: Failed to start Claude CLI - ${error.message}\n`);
    });

    const session = {
      id: sessionId,
      userId,
      pty,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: []
    };

    pty.on('data', (data) => {
      session.output.push({
        type: 'output',
        data: data.toString(),
        timestamp: new Date()
      });
      this.emit('output', sessionId, data.toString());
    });

    pty.on('exit', (code) => {
      this.emit('exit', sessionId, code);
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
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

    session.pty.write(command + '\n');
    session.lastActivity = new Date();
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
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