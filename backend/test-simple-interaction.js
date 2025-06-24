#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'https://claude-cloud-service.fly.dev';
const WS_BASE_URL = 'wss://claude-cloud-service.fly.dev';

async function testSimpleInteraction() {
  console.log('=== Simple Claude Test ===\n');
  
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
  
  let messageCount = 0;
  let themeSelected = false;
  
  ws.on('open', () => {
    console.log('WebSocket connected\n');
  });
  
  ws.on('message', (data) => {
    messageCount++;
    const message = JSON.parse(data.toString());
    
    if (message.type === 'output' && message.data) {
      // Clean output for display
      const cleaned = message.data
        .replace(/\u001b\[[0-9;]*m/g, '')
        .replace(/\u001b\[[?][0-9]*[lh]/g, '')
        .replace(/\u001b\[[0-9]*[JH]/g, '')
        .replace(/\u001b\[[?]2004[lh]/g, '');
      
      if (cleaned.trim()) {
        console.log(`Message ${messageCount}:`, cleaned.substring(0, 100) + (cleaned.length > 100 ? '...' : ''));
      }
      
      // If we see theme selection, select option 1
      if (!themeSelected && message.data.includes('Choose the text style')) {
        console.log('\nTheme selection detected, selecting option 1...');
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'command',
            command: '1'
          }));
          themeSelected = true;
          
          // After theme selection, send test command
          setTimeout(() => {
            console.log('\nSending test command: pwd');
            ws.send(JSON.stringify({
              type: 'command',
              command: 'pwd'
            }));
            
            // Wait longer to see the response
            setTimeout(() => {
              console.log('\nSending test command: ls -la');
              ws.send(JSON.stringify({
                type: 'command',
                command: 'ls -la'
              }));
              
              // Close after more time
              setTimeout(() => {
                console.log('\nTest complete!');
                ws.close();
                process.exit(0);
              }, 3000);
            }, 2000);
          }, 1000);
        }, 500);
      }
      
      // Show pwd and ls output
      if (themeSelected && (cleaned.includes('/app/') || cleaned.includes('total '))) {
        console.log('\nCommand output:', cleaned);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    process.exit(1);
  });
}

testSimpleInteraction().catch(console.error);