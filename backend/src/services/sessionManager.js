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
    
    // Check if project directory exists, use it as the starting directory
    const projectDir = process.env.PROJECTS_DIR ? 
      path.join(process.env.PROJECTS_DIR, 'claude-cloud-service') : null;
    const startDir = projectDir && require('fs').existsSync(projectDir) ? 
      projectDir : sessionDir;
    
    const args = [
      startDir // Start Claude in project directory if available
    ];
    
    console.log(`Starting Claude session in ${startDir}`);
    console.log(`Environment: ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
    
    let pty;
    try {
      // Try to spawn with different PTY settings
      pty = spawn(claudeCommand, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: sessionDir,
        env: {
          ...env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        }
      });
    } catch (spawnError) {
      console.error('Failed to spawn Claude with PTY:', spawnError);
      // Try without PTY as a fallback
      const { exec } = require('child_process');
      const childProcess = exec(`${claudeCommand} ${args.join(' ')}`, {
        cwd: sessionDir,
        env: env
      });
      
      // Simulate PTY interface
      pty = {
        write: (data) => childProcess.stdin.write(data),
        on: (event, handler) => {
          if (event === 'data') {
            childProcess.stdout.on('data', handler);
            childProcess.stderr.on('data', handler);
          } else if (event === 'exit') {
            childProcess.on('exit', handler);
          } else if (event === 'error') {
            childProcess.on('error', handler);
          }
        },
        kill: () => childProcess.kill()
      };
    }
    
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

    // Flag to track if theme has been selected
    let themeSelected = false;
    
    pty.on('data', (data) => {
      const output = data.toString();
      session.output.push({
        type: 'output',
        data: output,
        timestamp: new Date()
      });
      this.emit('output', sessionId, output);
      
      // Auto-select theme 1 (Dark mode) on first prompt
      if (!themeSelected && output.includes('Choose the text style')) {
        setTimeout(() => {
          console.log('Auto-selecting theme 1 (Dark mode)');
          pty.write('1\n');
          themeSelected = true;
        }, 500);
      }
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