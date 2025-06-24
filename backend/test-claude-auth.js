#!/usr/bin/env node

import { spawn, execSync } from 'child_process';

console.log('=== Testing Claude Authentication ===\n');

// Check environment
console.log('1. Environment Check:');
console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`   API Key length: ${process.env.ANTHROPIC_API_KEY?.length || 0}`);
console.log(`   API Key prefix: ${process.env.ANTHROPIC_API_KEY?.substring(0, 10)}...`);

// Check Claude installation
console.log('\n2. Claude Installation:');
try {
  const version = execSync('claude --version', { encoding: 'utf8' });
  console.log(`   Version: ${version.trim()}`);
} catch (e) {
  console.log(`   Error: ${e.message}`);
}

// Test with simple command
console.log('\n3. Testing simple Claude command:');
const claudeProcess = spawn('claude', ['--print', 'Hi'], {
  env: {
    ...process.env,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  }
});

let output = '';
let error = '';

claudeProcess.stdout.on('data', (data) => {
  output += data.toString();
});

claudeProcess.stderr.on('data', (data) => {
  error += data.toString();
});

claudeProcess.on('exit', (code) => {
  console.log(`   Exit code: ${code}`);
  console.log(`   Output: ${output || '(empty)'}`);
  console.log(`   Error: ${error || '(empty)'}`);
  
  // If authentication error, check config
  if (error.includes('API key') || error.includes('authenticate')) {
    console.log('\n4. Authentication Issue Detected');
    console.log('   Claude may need to be configured with the API key.');
    console.log('   The API key should be set in ANTHROPIC_API_KEY environment variable.');
  }
  
  process.exit(code);
});