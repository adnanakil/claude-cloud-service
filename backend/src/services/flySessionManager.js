import { v4 as uuidv4 } from 'uuid';
import { spawn as ptySpawn } from 'node-pty';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class FlySessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.sessionsDir = process.env.SESSIONS_DIR || '/tmp/claude-sessions';
    this.usePty = process.env.USE_PTY !== 'false';
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
    
    // Check if project directory exists
    const projectDir = process.env.PROJECTS_DIR ? 
      path.join(process.env.PROJECTS_DIR, 'claude-cloud-service') : null;
    let startDir = sessionDir;
    try {
      if (projectDir) {
        await fs.access(projectDir);
        startDir = projectDir;
      }
    } catch (error) {
      // Project directory doesn't exist, use session directory
    }
    
    console.log(`Starting Claude session in ${startDir}`);
    console.log(`Using PTY: ${this.usePty}`);
    
    let claudeProcess;
    let processInterface;
    
    // Try PTY first if enabled
    if (this.usePty) {
      try {
        claudeProcess = ptySpawn('claude', [startDir], {
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
        
        processInterface = {
          write: (data) => claudeProcess.write(data),
          on: (event, handler) => claudeProcess.on(event, handler),
          kill: () => claudeProcess.kill()
        };
        
        console.log('Successfully started Claude with PTY');
      } catch (ptyError) {
        console.error('PTY spawn failed, falling back to standard spawn:', ptyError.message);
        this.usePty = false;
      }
    }
    
    // Fallback to standard spawn
    if (!this.usePty) {
      try {
        // Use echo pipe approach for non-PTY mode
        claudeProcess = spawn('bash', ['-c', `cd "${startDir}" && claude`], {
          cwd: sessionDir,
          env: env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Create PTY-like interface
        processInterface = {
          write: (data) => {
            if (claudeProcess.stdin.writable) {
              claudeProcess.stdin.write(data);
            }
          },
          on: (event, handler) => {
            if (event === 'data') {
              claudeProcess.stdout.on('data', handler);
              claudeProcess.stderr.on('data', handler);
            } else if (event === 'exit') {
              claudeProcess.on('exit', handler);
            } else if (event === 'error') {
              claudeProcess.on('error', handler);
            }
          },
          kill: () => claudeProcess.kill()
        };
        
        console.log('Successfully started Claude with standard spawn');
      } catch (spawnError) {
        console.error('Failed to spawn Claude:', spawnError);
        this.emit('output', sessionId, `Error: Failed to start Claude CLI - ${spawnError.message}\n`);
        throw spawnError;
      }
    }
    
    const session = {
      id: sessionId,
      userId,
      process: processInterface,
      pty: processInterface, // Keep pty name for compatibility
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      themeSelected: false
    };
    
    // Auto-select theme when detected
    processInterface.on('data', (data) => {
      const output = data.toString();
      session.output.push({
        type: 'output',
        data: output,
        timestamp: new Date()
      });
      this.emit('output', sessionId, output);
      
      // Auto-select theme 1 (Dark mode) on first prompt
      if (!session.themeSelected && output.includes('Choose the text style')) {
        setTimeout(() => {
          console.log('Auto-selecting theme 1 (Dark mode)');
          processInterface.write('1\n');
          session.themeSelected = true;
        }, 500);
      }
    });
    
    processInterface.on('exit', (code) => {
      this.emit('exit', sessionId, code);
      this.sessions.delete(sessionId);
    });
    
    processInterface.on('error', (error) => {
      console.error('Process error:', error);
      this.emit('output', sessionId, `Error: ${error.message}\n`);
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

    session.process.write(command + '\n');
    session.lastActivity = new Date();
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
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