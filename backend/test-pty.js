import { spawn } from 'node-pty';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing PTY functionality...');

try {
  // Test basic PTY spawn
  const pty = spawn('echo', ['PTY test successful'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env
  });

  pty.on('data', (data) => {
    console.log('PTY output:', data);
  });

  pty.on('exit', (code) => {
    console.log('PTY exited with code:', code);
    
    // Now test Claude CLI
    testClaudeCLI();
  });
} catch (error) {
  console.error('PTY test failed:', error);
  process.exit(1);
}

function testClaudeCLI() {
  console.log('\nTesting Claude CLI with PTY...');
  
  try {
    const claudePty = spawn('claude', ['--version'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
      }
    });

    let output = '';
    
    claudePty.on('data', (data) => {
      output += data;
      console.log('Claude output:', data);
    });

    claudePty.on('exit', (code) => {
      console.log('Claude CLI exited with code:', code);
      if (code === 0) {
        console.log('\nSUCCESS: Both PTY and Claude CLI are working correctly!');
      } else {
        console.log('\nWARNING: Claude CLI exited with non-zero code');
      }
    });

    claudePty.on('error', (error) => {
      console.error('Claude CLI error:', error);
    });
    
  } catch (error) {
    console.error('Claude CLI test failed:', error);
  }
}