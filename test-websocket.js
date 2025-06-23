import WebSocket from 'ws';

const sessionId = 'b64f0b83-abde-46d3-9572-a1da7b36155c';
const ws = new WebSocket(`wss://claude-text-production.up.railway.app/ws/${sessionId}`);

ws.on('open', () => {
  console.log('Connected to WebSocket');
  
  // Send a test command
  setTimeout(() => {
    console.log('Sending command: echo "Hello from test"');
    ws.send(JSON.stringify({
      type: 'command',
      command: 'echo "Hello from test"'
    }));
  }, 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
  
  if (message.type === 'output') {
    console.log('Output:', message.data);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket closed');
});