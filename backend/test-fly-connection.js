#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'https://claude-cloud-service.fly.dev';
const WS_BASE_URL = 'wss://claude-cloud-service.fly.dev';

async function testConnection() {
  console.log('=== Testing Fly.io Claude Cloud Service ===\n');
  
  // 1. Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('Health check:', health);
    console.log(`Session type: ${health.sessionType}`);
    console.log(`Active sessions: ${health.activeSessions}`);
  } catch (error) {
    console.error('Health check failed:', error.message);
    return;
  }
  
  // 2. Create a session
  console.log('\n2. Creating session...');
  let sessionId;
  try {
    const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user' })
    });
    const session = await sessionRes.json();
    sessionId = session.id;
    console.log('Session created:', sessionId);
  } catch (error) {
    console.error('Session creation failed:', error.message);
    return;
  }
  
  // 3. Connect WebSocket
  console.log('\n3. Connecting WebSocket...');
  const ws = new WebSocket(`${WS_BASE_URL}/ws/${sessionId}`);
  
  ws.on('open', () => {
    console.log('WebSocket connected');
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received:', message.type);
    if (message.data) {
      console.log('Output:', message.data);
    }
    
    // After getting connected message, send test commands
    if (message.type === 'connected') {
      console.log('\n4. Sending test commands...');
      
      // Send pwd command
      setTimeout(() => {
        console.log('Sending: pwd');
        ws.send(JSON.stringify({
          type: 'command',
          command: 'pwd'
        }));
      }, 500);
      
      // Send ls command
      setTimeout(() => {
        console.log('Sending: ls -la');
        ws.send(JSON.stringify({
          type: 'command',
          command: 'ls -la'
        }));
      }, 2000);
      
      // Send claude check
      setTimeout(() => {
        console.log('Sending: which claude && claude --version');
        ws.send(JSON.stringify({
          type: 'command',
          command: 'which claude && claude --version'
        }));
      }, 4000);
      
      // Close after tests
      setTimeout(() => {
        console.log('\nClosing connection...');
        ws.close();
        process.exit(0);
      }, 8000);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket closed');
  });
}

// Run the test
testConnection().catch(console.error);