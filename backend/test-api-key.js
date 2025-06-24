#!/usr/bin/env node

import fetch from 'node-fetch';

async function testApiKey() {
  console.log('Testing API key availability on Fly.io...\n');
  
  // Test 1: Check environment endpoint
  try {
    const envRes = await fetch('https://claude-cloud-service.fly.dev/api/debug/env');
    const env = await envRes.json();
    console.log('Environment check:');
    console.log('- ANTHROPIC_API_KEY:', env.ANTHROPIC_API_KEY);
    console.log('- PATH:', env.PATH);
    console.log('- USER:', env.USER);
  } catch (error) {
    console.error('Failed to check environment:', error.message);
  }
  
  // Test 2: Try to test Claude with API
  console.log('\nTesting Claude with API...');
  try {
    const testRes = await fetch('https://claude-cloud-service.fly.dev/api/debug/test-claude?query=Hello');
    const test = await testRes.json();
    console.log('Claude test result:', JSON.stringify(test, null, 2));
  } catch (error) {
    console.error('Failed to test Claude:', error.message);
  }
  
  // Test 3: Check if we can manually set the API key
  console.log('\nChecking if API key is in Fly secrets...');
  console.log('Run this command to verify:');
  console.log('flyctl secrets list -a claude-cloud-service');
  console.log('\nIf ANTHROPIC_API_KEY is listed but shows as "NOT SET" in the app,');
  console.log('you may need to redeploy or check the Dockerfile.');
}

testApiKey();