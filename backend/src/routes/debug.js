import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

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
      const { stdout, stderr } = await execAsync('claude --version');
      res.json({ 
        version: stdout.trim(),
        error: stderr
      });
    } catch (error) {
      res.json({ 
        error: error.message,
        command: 'claude --version'
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

  return router;
}