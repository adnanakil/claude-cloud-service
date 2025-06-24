#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'https://claude-text-production.up.railway.app';

async function testWebSocketConnection() {
  console.log('1. Creating session...');
  
  // Create a session
  const sessionResponse = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-user' })
  });
  
  const session = await sessionResponse.json();
  console.log('Session created:', session);
  
  // Test WebSocket connection
  console.log('\n2. Connecting to WebSocket...');
  const wsUrl = `wss://claude-text-production.up.railway.app/ws/${session.id}`;
  console.log('WebSocket URL:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('WebSocket connected!');
    
    // Send test commands
    setTimeout(() => {
      console.log('\n3. Sending help command...');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'help'
      }));
    }, 1000);
    
    // Send a Claude question
    setTimeout(() => {
      console.log('\n4. Sending Claude question...');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'What is 2+2?'
      }));
    }, 3000);
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received:', message);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', (code, reason) => {
    console.log('WebSocket closed:', code, reason.toString());
  });
  
  // Keep the script running
  setTimeout(() => {
    console.log('\n5. Closing connection...');
    ws.close();
    process.exit(0);
  }, 15000);
}

// Also test the echo endpoint
async function testEchoWebSocket() {
  console.log('\n\nTesting Echo WebSocket...');
  const ws = new WebSocket('wss://claude-text-production.up.railway.app/ws/echo');
  
  ws.on('open', () => {
    console.log('Echo WebSocket connected!');
    ws.send('Hello from test script');
  });
  
  ws.on('message', (data) => {
    console.log('Echo received:', data.toString());
  });
  
  ws.on('error', (error) => {
    console.error('Echo WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('Echo WebSocket closed');
  });
}

// Run tests
testWebSocketConnection().catch(console.error);
testEchoWebSocket().catch(console.error);