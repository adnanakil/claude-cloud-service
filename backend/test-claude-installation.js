#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://claude-cloud-service.fly.dev';

async function testClaudeInstallation() {
  console.log('=== Testing Claude Installation ===\n');
  
  // Create a special debug endpoint to check Claude
  console.log('Creating debug session to test Claude...');
  
  try {
    // First, let's check if we have a debug endpoint
    const debugRes = await fetch(`${BASE_URL}/api/debug/check-claude`, {
      method: 'GET'
    });
    
    if (!debugRes.ok) {
      console.log('Debug endpoint not available, creating session instead...');
      
      // Create a session and try to get info
      const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'debug-test' })
      });
      
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        console.log('Session created:', session.id);
        
        // Try to get session info
        const infoRes = await fetch(`${BASE_URL}/api/sessions/${session.id}`, {
          method: 'GET'
        });
        
        if (infoRes.ok) {
          const info = await infoRes.json();
          console.log('Session info:', JSON.stringify(info, null, 2));
        }
      } else {
        console.log('Failed to create session:', sessionRes.status, await sessionRes.text());
      }
    } else {
      const debugInfo = await debugRes.json();
      console.log('Claude check:', JSON.stringify(debugInfo, null, 2));
    }
    
    // Also check server info
    console.log('\nChecking server environment...');
    const serverRes = await fetch(`${BASE_URL}/api/debug/server-info`);
    if (serverRes.ok) {
      const serverInfo = await serverRes.json();
      console.log('Server info:', JSON.stringify(serverInfo, null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testClaudeInstallation().catch(console.error);