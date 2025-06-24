#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

async function testProjectSetup() {
  console.log('=== Testing Project Setup for Mobile Development ===\n');
  
  const projectsDir = process.env.PROJECTS_DIR || '/app/projects';
  const repoDir = path.join(projectsDir, 'claude-cloud-service');
  
  // Test 1: Check if projects directory exists
  console.log('1. Checking projects directory...');
  try {
    await fs.access(projectsDir);
    console.log(`✓ Projects directory exists: ${projectsDir}`);
  } catch (error) {
    console.log(`✗ Projects directory not found: ${projectsDir}`);
    console.log('  Creating directory...');
    await fs.mkdir(projectsDir, { recursive: true });
  }
  
  // Test 2: Check if repository is cloned
  console.log('\n2. Checking if repository is cloned...');
  try {
    await fs.access(repoDir);
    console.log(`✓ Repository exists: ${repoDir}`);
    
    // Check git status
    const gitStatus = spawn('git', ['status'], { cwd: repoDir });
    gitStatus.stdout.on('data', (data) => {
      console.log(`  Git status: ${data.toString().trim()}`);
    });
  } catch (error) {
    console.log(`✗ Repository not found: ${repoDir}`);
    console.log('  Repository will be cloned on first startup');
  }
  
  // Test 3: Check Claude Code accessibility
  console.log('\n3. Checking Claude Code installation...');
  try {
    const { execSync } = require('child_process');
    const claudeVersion = execSync('claude --version', { encoding: 'utf8' }).trim();
    console.log(`✓ Claude Code installed: ${claudeVersion}`);
  } catch (error) {
    console.log('✗ Claude Code not found in PATH');
  }
  
  // Test 4: Check environment variables
  console.log('\n4. Checking environment variables...');
  console.log(`  SESSIONS_DIR: ${process.env.SESSIONS_DIR || 'not set'}`);
  console.log(`  PROJECTS_DIR: ${process.env.PROJECTS_DIR || 'not set'}`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
  
  // Test 5: Simulate Claude Code startup directory
  console.log('\n5. Testing Claude Code startup directory...');
  if (await fs.access(repoDir).then(() => true).catch(() => false)) {
    console.log(`✓ Claude Code will start in: ${repoDir}`);
    
    // List key directories
    const dirs = await fs.readdir(repoDir);
    console.log('  Available directories:');
    for (const dir of dirs) {
      const stat = await fs.stat(path.join(repoDir, dir));
      if (stat.isDirectory() && !dir.startsWith('.')) {
        console.log(`    - ${dir}/`);
      }
    }
  } else {
    console.log(`✓ Claude Code will start in session directory until repo is cloned`);
  }
  
  console.log('\n=== Setup Test Complete ===');
  console.log('\nFor mobile development:');
  console.log('1. Deploy with: flyctl deploy');
  console.log('2. Connect from iPhone using the ClaudeCloud app');
  console.log('3. Claude Code will have full access to your project');
}

// Run the test
testProjectSetup().catch(console.error);