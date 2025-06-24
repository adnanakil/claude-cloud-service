import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class ClaudeStdinManager extends EventEmitter {
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
      console.log(`Created session directory: ${sessionDir}`);
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
    
    console.log('Starting Claude with stdin approach');
    
    // Start claude in print mode but read from stdin
    const claudeProcess = spawn('claude', ['--print'], {
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
      busy: false
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
      session.busy = false;
      this.emit('output', sessionId, '\n> ');
    });
    
    // Handle stderr
    claudeProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`Claude stderr: ${output}`);
      if (output.includes('Enter a prompt')) {
        // Ignore this prompt message
        return;
      }
      session.output.push({
        type: 'error',
        data: output,
        timestamp: new Date()
      });
      this.emit('output', sessionId, `Error: ${output}\n`);
      session.busy = false;
      this.emit('output', sessionId, '> ');
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
      session.busy = false;
    });
    
    this.sessions.set(sessionId, session);
    
    // Send initial message
    setTimeout(() => {
      this.emit('output', sessionId, 'Welcome to Claude Cloud! Type your questions or commands.\n');
      this.emit('output', sessionId, 'Type "help" for available commands.\n');
      this.emit('output', sessionId, '> ');
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
    this.emit('output', sessionId, `> ${command}\n`);
    
    // Handle special commands (case-insensitive)
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand === 'help') {
      this.emit('output', sessionId, 'Available commands:\n');
      this.emit('output', sessionId, '  help     - Show this help message\n');
      this.emit('output', sessionId, '  clear    - Clear the screen\n');
      this.emit('output', sessionId, '  exit     - End the session\n');
      this.emit('output', sessionId, '\nOr just type your question and Claude will respond!\n');
      this.emit('output', sessionId, '> ');
      return;
    }
    
    if (lowerCommand === 'clear') {
      this.emit('output', sessionId, '\x1b[2J\x1b[H');
      this.emit('output', sessionId, '> ');
      return;
    }
    
    if (lowerCommand === 'exit') {
      this.emit('output', sessionId, 'Goodbye!\n');
      this.emit('exit', sessionId, 0);
      this.destroySession(sessionId);
      return;
    }
    
    // If a command is already being processed, queue it
    if (session.busy) {
      this.emit('output', sessionId, 'Claude is still processing your previous request. Please wait...\n');
      return;
    }
    
    // Send command to Claude via stdin
    console.log(`Sending to Claude stdin: ${command}`);
    session.busy = true;
    
    try {
      // Write the command followed by EOF to trigger Claude to process it
      session.process.stdin.write(command + '\n');
      session.process.stdin.end(); // This triggers Claude to process and exit
      
      // After Claude processes, we'll need to restart it for the next command
      session.process.on('exit', () => {
        if (this.sessions.has(sessionId)) {
          // Restart Claude for the next command
          this.restartClaude(session);
        }
      });
    } catch (error) {
      console.error('Error writing to Claude stdin:', error);
      this.emit('output', sessionId, `Error: ${error.message}\n`);
      session.busy = false;
      this.emit('output', sessionId, '> ');
    }
  }

  restartClaude(session) {
    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      HOME: session.cwd || '/tmp',
      TERM: 'dumb',
      NO_COLOR: '1'
    };
    
    const claudeProcess = spawn('claude', ['--print'], {
      cwd: session.cwd || '/tmp',
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    session.process = claudeProcess;
    session.busy = false;
    
    // Reattach event handlers
    claudeProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Claude stdout: ${output}`);
      this.emit('output', session.id, output);
      session.busy = false;
      this.emit('output', session.id, '\n> ');
    });
    
    claudeProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Enter a prompt')) return;
      console.log(`Claude stderr: ${output}`);
      this.emit('output', session.id, `Error: ${output}\n`);
      session.busy = false;
      this.emit('output', session.id, '> ');
    });
    
    claudeProcess.on('error', (error) => {
      console.error('Claude process error:', error);
      this.emit('output', session.id, `Error: ${error.message}\n`);
      session.busy = false;
    });
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