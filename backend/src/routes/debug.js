import express from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export default function debugRouter() {
  const router = express.Router();

  router.get('/which-claude', async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync('which claude');
      res.json({ 
        claudePath: stdout.trim(),
        error: stderr,
        PATH: process.env.PATH
      });
    } catch (error) {
      res.json({ 
        error: error.message,
        PATH: process.env.PATH
      });
    }
  });

  router.get('/test-claude', async (req, res) => {
    try {
      const query = req.query.query || 'What is 2+2?';
      const { stdout, stderr } = await execAsync(`claude --print "${query}"`, {
        timeout: 15000,
        env: process.env
      });
      res.json({ 
        query,
        response: stdout.trim(),
        error: stderr,
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
      });
    } catch (error) {
      res.json({ 
        error: error.message,
        command: `claude --print "${req.query.query || 'What is 2+2?'}"`,
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
      });
    }
  });

  router.get('/env', (req, res) => {
    res.json({
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'
    });
  });

  // Test Claude directly
  router.get('/test-claude-direct', async (req, res) => {
    try {
      const { spawn } = require('child_process');
      const testProcess = spawn('claude', ['--print', 'Say hello'], {
        env: process.env,
        timeout: 10000
      });
      
      let output = '';
      let error = '';
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      testProcess.on('exit', (code) => {
        res.json({
          success: code === 0,
          code,
          output,
          error,
          env: {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'
          }
        });
      });
      
      testProcess.on('error', (err) => {
        res.json({
          success: false,
          error: err.message
        });
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  });

  // Comprehensive Claude diagnostics
  router.get('/claude-diagnostics', async (req, res) => {
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        PATH: process.env.PATH,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
        NODE_VERSION: process.version,
        PLATFORM: os.platform(),
        ARCH: os.arch()
      },
      checks: []
    };

    // Check 1: which claude
    try {
      const claudePath = execSync('which claude', { encoding: 'utf8' }).trim();
      results.checks.push({
        name: 'which claude',
        success: true,
        result: claudePath
      });
      
      // Check file stats
      try {
        const stats = fs.statSync(claudePath);
        results.checks.push({
          name: 'claude file stats',
          success: true,
          result: {
            size: stats.size,
            executable: !!(stats.mode & 0o111),
            isSymlink: fs.lstatSync(claudePath).isSymbolicLink()
          }
        });
      } catch (e) {
        results.checks.push({
          name: 'claude file stats',
          success: false,
          error: e.message
        });
      }
    } catch (e) {
      results.checks.push({
        name: 'which claude',
        success: false,
        error: e.message
      });
    }

    // Check 2: npm global root
    try {
      const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
      results.checks.push({
        name: 'npm root -g',
        success: true,
        result: npmRoot
      });
      
      // Check if @anthropic-ai/claude-code exists
      const claudeCodePath = `${npmRoot}/@anthropic-ai/claude-code`;
      if (fs.existsSync(claudeCodePath)) {
        const packageJson = JSON.parse(fs.readFileSync(`${claudeCodePath}/package.json`, 'utf8'));
        results.checks.push({
          name: '@anthropic-ai/claude-code package',
          success: true,
          result: {
            path: claudeCodePath,
            version: packageJson.version,
            bin: packageJson.bin
          }
        });
      } else {
        results.checks.push({
          name: '@anthropic-ai/claude-code package',
          success: false,
          error: 'Package not found'
        });
      }
    } catch (e) {
      results.checks.push({
        name: 'npm root -g',
        success: false,
        error: e.message
      });
    }

    // Check 3: claude --version
    try {
      const version = execSync('claude --version', { encoding: 'utf8', timeout: 5000 }).trim();
      results.checks.push({
        name: 'claude --version',
        success: true,
        result: version
      });
    } catch (e) {
      results.checks.push({
        name: 'claude --version',
        success: false,
        error: e.message
      });
    }

    // Check 4: npx claude --version
    try {
      const npxVersion = execSync('npx @anthropic-ai/claude-code --version', { encoding: 'utf8', timeout: 10000 }).trim();
      results.checks.push({
        name: 'npx @anthropic-ai/claude-code --version',
        success: true,
        result: npxVersion
      });
    } catch (e) {
      results.checks.push({
        name: 'npx @anthropic-ai/claude-code --version',
        success: false,
        error: e.message
      });
    }

    // Check 5: List /usr/local/bin
    try {
      const binContents = fs.readdirSync('/usr/local/bin').filter(f => f.includes('claude'));
      results.checks.push({
        name: '/usr/local/bin claude files',
        success: true,
        result: binContents
      });
    } catch (e) {
      results.checks.push({
        name: '/usr/local/bin claude files',
        success: false,
        error: e.message
      });
    }

    res.json(results);
  });

  return router;
}