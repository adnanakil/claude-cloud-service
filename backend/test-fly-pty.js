#!/usr/bin/env node

import { spawn } from 'child_process';
import pty from 'node-pty';
import fs from 'fs';

console.log('=== Testing PTY Support on Fly.io ===');
console.log('Environment:', {
  FLY_APP_NAME: process.env.FLY_APP_NAME,
  FLY_REGION: process.env.FLY_REGION,
  NODE_ENV: process.env.NODE_ENV,
  USER: process.env.USER,
  HOME: process.env.HOME
});

// Check if /dev/pts exists
console.log('\n=== Checking /dev/pts ===');
try {
  const devpts = fs.readdirSync('/dev/pts');
  console.log('/dev/pts contents:', devpts);
} catch (error) {
  console.error('/dev/pts not accessible:', error.message);
}

// Check if PTY devices exist
console.log('\n=== Checking PTY devices ===');
try {
  const devFiles = fs.readdirSync('/dev').filter(f => f.startsWith('pty') || f.startsWith('tty'));
  console.log('PTY/TTY devices in /dev:', devFiles.slice(0, 10), '...');
} catch (error) {
  console.error('Cannot read /dev:', error.message);
}

// Test 1: Try node-pty with simple command
console.log('\n=== Test 1: node-pty with echo command ===');
try {
  const ptyProcess = pty.spawn('echo', ['Hello from PTY'], {
    name: 'xterm',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
  });

  ptyProcess.on('data', (data) => {
    console.log('PTY output:', data);
  });

  ptyProcess.on('exit', (code) => {
    console.log('PTY process exited with code:', code);
  });
} catch (error) {
  console.error('node-pty failed:', error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
}

// Test 2: Try standard spawn as fallback
console.log('\n=== Test 2: Standard spawn with echo command ===');
try {
  const childProcess = spawn('echo', ['Hello from standard spawn'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  childProcess.stdout.on('data', (data) => {
    console.log('Standard spawn output:', data.toString());
  });

  childProcess.on('exit', (code) => {
    console.log('Standard spawn exited with code:', code);
  });
} catch (error) {
  console.error('Standard spawn failed:', error.message);
}

// Test 3: Check if we can create a PTY manually
console.log('\n=== Test 3: Manual PTY allocation ===');
try {
  const { execSync } = require('child_process');
  const result = execSync('python3 -c "import pty; print(pty.openpty())"', { encoding: 'utf8' });
  console.log('Python PTY allocation result:', result.trim());
} catch (error) {
  console.error('Manual PTY allocation failed:', error.message);
}

// Test 4: Check tty command
console.log('\n=== Test 4: TTY information ===');
try {
  const { execSync } = require('child_process');
  const ttyInfo = execSync('tty', { encoding: 'utf8' });
  console.log('Current TTY:', ttyInfo.trim());
} catch (error) {
  console.error('TTY command failed:', error.message);
}

// Recommendations
console.log('\n=== Recommendations ===');
console.log('1. If node-pty fails with EIO, use standard spawn instead');
console.log('2. Set USE_PTY=false in your Fly.io environment variables');
console.log('3. Use the FlySessionManager which has automatic fallback');
console.log('4. Consider using a WebSocket-based terminal emulator on the frontend');

process.exit(0);