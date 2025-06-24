#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'https://claude-cloud-service.fly.dev';
const WS_BASE_URL = 'wss://claude-cloud-service.fly.dev';

async function testFullInteraction() {
  console.log('=== Full Claude Interaction Test ===\n');
  
  // Create session
  const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-user' })
  });
  const session = await sessionRes.json();
  console.log('Session created:', session.id);
  
  // Connect WebSocket
  const ws = new WebSocket(`${WS_BASE_URL}/ws/${session.id}`);
  
  let allOutput = '';
  let commandsSent = 0;
  
  ws.on('open', () => {
    console.log('WebSocket connected\n');
    console.log('Waiting for Claude to initialize...\n');
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'output' && message.data) {
      allOutput += message.data;
      
      // Clean output for display
      const cleaned = message.data
        .replace(/\u001b\[[0-9;]*m/g, '')
        .replace(/\u001b\[[?][0-9]*[lh]/g, '')
        .replace(/\u001b\[[0-9]*[JH]/g, '')
        .replace(/\u001b\[[?]2004[lh]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      // Show significant output
      if (cleaned.trim() && !cleaned.includes('[2K[1A')) {
        console.log('Output:', cleaned.trim());
      }
      
      // Handle different states
      if (allOutput.includes('Choose the text style') && commandsSent === 0) {
        console.log('\n→ Selecting theme 1...');
        ws.send(JSON.stringify({ type: 'command', command: '1' }));
        commandsSent++;
      } else if (allOutput.includes('Human:') && commandsSent === 1) {
        console.log('\n→ Claude is ready! Sending: pwd');
        ws.send(JSON.stringify({ type: 'command', command: 'pwd' }));
        commandsSent++;
      } else if (commandsSent === 2 && (allOutput.includes('/app/') || allOutput.includes('Assistant:'))) {
        setTimeout(() => {
          console.log('\n→ Sending: ls -la');
          ws.send(JSON.stringify({ type: 'command', command: 'ls -la' }));
          commandsSent++;
        }, 1000);
      } else if (commandsSent === 3 && allOutput.includes('total')) {
        setTimeout(() => {
          console.log('\n→ Sending: cd /app/projects/claude-cloud-service && pwd');
          ws.send(JSON.stringify({ type: 'command', command: 'cd /app/projects/claude-cloud-service && pwd' }));
          commandsSent++;
        }, 1000);
      }
    }
  });
  
  // Close after 15 seconds
  setTimeout(() => {
    console.log('\n\nTest complete! Commands sent:', commandsSent);
    console.log('Final state of output includes:');
    console.log('- Theme selection:', allOutput.includes('Choose the text style'));
    console.log('- Human prompt:', allOutput.includes('Human:'));
    console.log('- Directory info:', allOutput.includes('/app/'));
    ws.close();
    process.exit(0);
  }, 15000);
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    process.exit(1);
  });
}

testFullInteraction().catch(console.error);