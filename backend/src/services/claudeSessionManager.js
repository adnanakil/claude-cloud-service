import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class ClaudeSessionManager extends EventEmitter {
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
    
    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      HOME: sessionDir,
      TERM: 'dumb',
      NO_COLOR: '1'
    };
    
    console.log(`Starting Claude session in ${sessionDir}`);
    console.log(`Environment: ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
    
    // Use spawn without PTY
    const claudeProcess = spawn('claude', ['--no-update-check', sessionDir], {
      cwd: sessionDir,
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const session = {
      id: sessionId,
      userId,
      process: claudeProcess,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      inputBuffer: ''
    };
    
    // Handle stdout
    claudeProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Claude stdout: ${output}`);
      session.output.push({
        type: 'output',
        data: output,
        timestamp: new Date()
      });
      this.emit('output', sessionId, output);
    });
    
    // Handle stderr
    claudeProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`Claude stderr: ${output}`);
      session.output.push({
        type: 'error',
        data: output,
        timestamp: new Date()
      });
      this.emit('output', sessionId, output);
    });
    
    // Handle process exit
    claudeProcess.on('exit', (code) => {
      console.log(`Claude process exited with code ${code}`);
      this.emit('exit', sessionId, code);
      this.sessions.delete(sessionId);
    });
    
    // Handle process errors
    claudeProcess.on('error', (error) => {
      console.error('Claude process error:', error);
      this.emit('output', sessionId, `Error: ${error.message}\n`);
      
      // If Claude isn't found, provide helpful message
      if (error.code === 'ENOENT') {
        this.emit('output', sessionId, 'Claude CLI not found. Please ensure it is installed.\n');
        this.emit('output', sessionId, 'You can install it with: npm install -g @anthropic-ai/claude-code\n');
      }
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

    session.lastActivity = new Date();
    
    console.log(`Sending command to Claude: ${command}`);
    
    // Write command to Claude's stdin
    try {
      session.process.stdin.write(command + '\n');
    } catch (error) {
      console.error('Error writing to Claude stdin:', error);
      this.emit('output', sessionId, `Error: ${error.message}\n`);
    }
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.process) {
      session.process.kill();
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