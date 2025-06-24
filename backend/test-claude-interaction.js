#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'https://claude-cloud-service.fly.dev';
const WS_BASE_URL = 'wss://claude-cloud-service.fly.dev';

async function testClaudeInteraction() {
  console.log('=== Testing Claude Interaction on Fly.io ===\n');
  
  // 1. Create a session
  console.log('1. Creating session...');
  let sessionId;
  try {
    const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user' })
    });
    const session = await sessionRes.json();
    sessionId = session.id;
    console.log('✓ Session created:', sessionId);
  } catch (error) {
    console.error('✗ Session creation failed:', error.message);
    return;
  }
  
  // 2. Connect WebSocket
  console.log('\n2. Connecting WebSocket...');
  const ws = new WebSocket(`${WS_BASE_URL}/ws/${sessionId}`);
  
  let themeSelectionSeen = false;
  let claudeReady = false;
  let outputBuffer = '';
  
  ws.on('open', () => {
    console.log('✓ WebSocket connected');
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'output' && message.data) {
      outputBuffer += message.data;
      
      // Check if we're seeing the theme selection
      if (message.data.includes('Choose the text style')) {
        console.log('\n3. Theme selection screen detected');
        themeSelectionSeen = true;
        
        // Wait a bit for the auto-selection to happen
        console.log('   Waiting for auto-theme selection...');
        setTimeout(() => {
          // Check if we need to manually select
          if (!claudeReady && outputBuffer.includes('Choose the text style')) {
            console.log('   Auto-selection didn\'t trigger, selecting manually...');
            ws.send(JSON.stringify({
              type: 'command',
              command: '1'
            }));
          }
        }, 2000);
      }
      
      // Check if Claude is ready (look for the prompt)
      if (message.data.includes('Claude Code') && 
          (message.data.includes('>') || message.data.includes('$') || message.data.includes('Human:'))) {
        claudeReady = true;
        console.log('\n4. Claude is ready!');
        
        // Send test commands
        setTimeout(() => sendTestCommands(), 500);
      }
      
      // Show cleaned output
      const cleaned = message.data
        .replace(/\u001b\[[0-9;]*m/g, '') // Remove color codes
        .replace(/\u001b\[[?][0-9]*[lh]/g, '') // Remove cursor codes
        .replace(/\u001b\[[0-9]*[JH]/g, '') // Remove clear codes
        .replace(/\u001b\[[?]2004[lh]/g, '') // Remove bracketed paste
        .trim();
      
      if (cleaned && !cleaned.includes('Choose the text style')) {
        console.log('   Output:', cleaned.substring(0, 100) + (cleaned.length > 100 ? '...' : ''));
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('✗ WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('\n✓ Test completed');
    process.exit(0);
  });
  
  function sendTestCommands() {
    console.log('\n5. Sending test commands...');
    
    // Test 1: pwd
    setTimeout(() => {
      console.log('   Sending: pwd');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'pwd'
      }));
    }, 500);
    
    // Test 2: ls
    setTimeout(() => {
      console.log('   Sending: ls -la');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'ls -la'
      }));
    }, 2000);
    
    // Test 3: Check Claude
    setTimeout(() => {
      console.log('   Sending: help');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'help'
      }));
    }, 4000);
    
    // Close after tests
    setTimeout(() => {
      console.log('\nClosing connection...');
      ws.close();
    }, 8000);
  }
}

// Also test the health endpoint with more detail
async function checkHealth() {
  console.log('Checking server health...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const health = await res.json();
    console.log('Health check:', JSON.stringify(health, null, 2));
    
    // Also check if auto-deploy is working
    const deployRes = await fetch(`${BASE_URL}/api/debug/server-info`);
    if (deployRes.ok) {
      const info = await deployRes.json();
      console.log('Server info:', JSON.stringify(info, null, 2));
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
  console.log('');
}

// Run tests
checkHealth().then(() => testClaudeInteraction()).catch(console.error);