#!/usr/bin/env node

// Test script to diagnose Claude CLI issues in Docker

import { spawn, execSync } from 'child_process';
import fs from 'fs';

console.log('=== Claude CLI Test Script ===\n');

// 1. Check environment
console.log('1. Environment Check:');
console.log(`   NODE_VERSION: ${process.version}`);
console.log(`   PATH: ${process.env.PATH}`);
console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`   USER: ${process.env.USER || 'not set'}`);
console.log(`   HOME: ${process.env.HOME || 'not set'}`);
console.log();

// 2. Check if Claude is installed
console.log('2. Claude Installation Check:');
try {
  const whichResult = execSync('which claude', { encoding: 'utf8' }).trim();
  console.log(`   Claude found at: ${whichResult}`);
  
  // Check file details
  const stats = fs.statSync(whichResult);
  console.log(`   File size: ${stats.size} bytes`);
  console.log(`   Executable: ${stats.mode & 0o111 ? 'YES' : 'NO'}`);
  
  // Check if it's a symlink
  const lstat = fs.lstatSync(whichResult);
  if (lstat.isSymbolicLink()) {
    const target = fs.readlinkSync(whichResult);
    console.log(`   Symlink to: ${target}`);
  }
} catch (e) {
  console.log('   Claude NOT found in PATH');
}
console.log();

// 3. Check npm global packages
console.log('3. NPM Global Packages:');
try {
  const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  console.log(`   Global npm root: ${npmRoot}`);
  
  // Check if @anthropic-ai/claude-code is installed
  const claudeCodePath = `${npmRoot}/@anthropic-ai/claude-code`;
  if (fs.existsSync(claudeCodePath)) {
    console.log(`   @anthropic-ai/claude-code found at: ${claudeCodePath}`);
    
    // Check package.json
    const packageJson = JSON.parse(fs.readFileSync(`${claudeCodePath}/package.json`, 'utf8'));
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Main: ${packageJson.main || 'not specified'}`);
    
    // Check if bin exists
    if (packageJson.bin) {
      console.log(`   Bin entries:`, packageJson.bin);
    }
  } else {
    console.log('   @anthropic-ai/claude-code NOT found');
  }
} catch (e) {
  console.error('   Error checking npm packages:', e.message);
}
console.log();

// 4. Try different ways to run Claude
console.log('4. Attempting to run Claude:');

// Method 1: Direct spawn
console.log('\n   Method 1: Direct spawn');
try {
  const claude1 = spawn('claude', ['--version'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  claude1.stdout.on('data', (data) => {
    console.log(`   stdout: ${data}`);
  });
  
  claude1.stderr.on('data', (data) => {
    console.log(`   stderr: ${data}`);
  });
  
  claude1.on('error', (error) => {
    console.log(`   Error: ${error.message}`);
  });
  
  claude1.on('exit', (code) => {
    console.log(`   Exit code: ${code}`);
  });
} catch (e) {
  console.log(`   Failed: ${e.message}`);
}

// Method 2: Using npx
setTimeout(() => {
  console.log('\n   Method 2: Using npx');
  try {
    const result = execSync('npx @anthropic-ai/claude-code --version', { encoding: 'utf8' });
    console.log(`   Success: ${result}`);
  } catch (e) {
    console.log(`   Failed: ${e.message}`);
  }
}, 2000);

// Method 3: Direct node execution
setTimeout(() => {
  console.log('\n   Method 3: Direct node execution');
  try {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const claudeBin = `${npmRoot}/@anthropic-ai/claude-code/cli.js`;
    if (fs.existsSync(claudeBin)) {
      const result = execSync(`node ${claudeBin} --version`, { encoding: 'utf8' });
      console.log(`   Success: ${result}`);
    } else {
      console.log(`   Claude binary not found at: ${claudeBin}`);
    }
  } catch (e) {
    console.log(`   Failed: ${e.message}`);
  }
}, 4000);

// Keep process alive for async operations
setTimeout(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}, 6000);