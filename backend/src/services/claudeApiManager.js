import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class ClaudeApiManager extends EventEmitter {
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
    
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      context: [],
      cwd: sessionDir
    };

    this.sessions.set(sessionId, session);
    
    // Send welcome message
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

  async sendCommand(sessionId, command) {
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
      this.emit('output', sessionId, '  version  - Show Claude version\n');
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
    
    if (lowerCommand === 'version') {
      try {
        const version = execSync('claude --version', { encoding: 'utf8' }).trim();
        this.emit('output', sessionId, `${version}\n`);
      } catch (e) {
        this.emit('output', sessionId, 'Error getting version\n');
      }
      this.emit('output', sessionId, '> ');
      return;
    }
    
    if (lowerCommand === 'exit') {
      this.emit('output', sessionId, 'Goodbye!\n');
      this.emit('exit', sessionId, 0);
      this.destroySession(sessionId);
      return;
    }
    
    // Use Claude in non-interactive print mode
    try {
      const env = {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        HOME: session.cwd,
        TERM: 'dumb',
        NO_COLOR: '1'
      };
      
      console.log(`Executing Claude with command: ${command}`);
      console.log(`Working directory: ${session.cwd}`);
      console.log(`Environment vars: ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
      
      // Use echo to pipe the command to claude --print
      console.log(`Piping command to Claude: echo "${command}" | claude --print`);
      
      const claudeProcess = spawn('sh', ['-c', `echo "${command.replace(/"/g, '\\"')}" | claude --print`], {
        cwd: session.cwd,
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      let processExited = false;
      
      // Set a timeout for Claude responses
      const timeout = setTimeout(() => {
        if (!processExited) {
          console.log('Claude process timed out, killing it');
          claudeProcess.kill();
          this.emit('output', sessionId, '\nClaude is taking too long to respond. Please try again.\n');
          this.emit('output', sessionId, '> ');
        }
      }, 30000); // 30 second timeout
      
      claudeProcess.stdout.on('data', (data) => {
        output += data.toString();
        this.emit('output', sessionId, data.toString());
      });
      
      claudeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Claude stderr:', data.toString());
      });
      
      claudeProcess.on('exit', (code) => {
        processExited = true;
        clearTimeout(timeout);
        
        console.log(`Claude process exited with code: ${code}`);
        console.log(`Total output length: ${output.length}`);
        console.log(`Error output: ${errorOutput}`);
        
        if (code !== 0) {
          if (errorOutput.includes('ANTHROPIC_API_KEY')) {
            this.emit('output', sessionId, 'Error: Claude API key not configured properly.\n');
          } else if (errorOutput) {
            this.emit('output', sessionId, `Error: ${errorOutput}\n`);
          } else {
            this.emit('output', sessionId, `Error: Claude exited with code ${code}\n`);
          }
        } else if (output.length === 0) {
          this.emit('output', sessionId, 'Claude returned no output.\n');
        }
        this.emit('output', sessionId, '\n> ');
      });
      
      claudeProcess.on('error', (error) => {
        processExited = true;
        clearTimeout(timeout);
        console.error('Claude process error:', error);
        this.emit('output', sessionId, `Error: ${error.message}\n`);
        this.emit('output', sessionId, '> ');
      });
      
    } catch (error) {
      console.error('Error processing command:', error);
      this.emit('output', sessionId, `Error: ${error.message}\n`);
      this.emit('output', sessionId, '> ');
    }
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
      lastActivity: session.lastActivity
    }));
  }
}