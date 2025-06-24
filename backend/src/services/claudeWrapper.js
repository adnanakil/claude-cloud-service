#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

// This wrapper runs Claude CLI without PTY requirements
// It acts as a bridge between stdin/stdout and Claude

const args = process.argv.slice(2);

// Set up environment
const env = {
  ...process.env,
  TERM: 'dumb', // Use dumb terminal to avoid PTY requirements
  NO_COLOR: '1', // Disable colors
  CLAUDE_NO_INTERACTIVE: '1' // If Claude has a non-interactive mode
};

console.log('Starting Claude wrapper...');

// Spawn Claude process
const claude = spawn('claude', args, {
  env: env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle Claude output
claude.stdout.on('data', (data) => {
  process.stdout.write(data);
});

claude.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle Claude exit
claude.on('exit', (code) => {
  console.log(`Claude exited with code ${code}`);
  process.exit(code);
});

claude.on('error', (err) => {
  console.error('Failed to start Claude:', err);
  process.exit(1);
});

// Forward stdin to Claude
process.stdin.on('data', (data) => {
  claude.stdin.write(data);
});

// Handle process termination
process.on('SIGINT', () => {
  claude.kill('SIGINT');
});

process.on('SIGTERM', () => {
  claude.kill('SIGTERM');
});