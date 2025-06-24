# Claude Cloud Service - Fly.io Deployment Guide

This guide explains how to deploy the Claude Cloud Service backend to Fly.io with full PTY/TTY support.

## Prerequisites

1. Fly.io account (create at https://fly.io)
2. Anthropic API key for Claude
3. Fly CLI installed

## Quick Deployment

```bash
# Navigate to backend directory
cd backend

# Run the deployment script
./deploy-fly.sh
```

The script will:
- Check for Fly CLI installation
- Create the app if it doesn't exist
- Set required secrets (ANTHROPIC_API_KEY and JWT_SECRET)
- Deploy the application

## Manual Deployment Steps

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
```

### 2. Login to Fly.io

```bash
flyctl auth login
```

### 3. Create the App

```bash
flyctl apps create claude-cloud-service --org personal
```

### 4. Set Secrets

```bash
# Set your Anthropic API key
flyctl secrets set ANTHROPIC_API_KEY="your-api-key-here"

# Generate and set JWT secret
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)"
```

### 5. Deploy

```bash
flyctl deploy
```

## Configuration

The `fly.toml` file is configured with:
- **Region**: `iad` (US East)
- **Session Type**: `pty` (for terminal emulation)
- **Auto-scaling**: Scales down to 0 when not in use
- **WebSocket Support**: Full support for real-time communication
- **Memory**: 512MB (sufficient for Claude CLI)

## Updating the iOS App

After deployment, update the iOS app to point to your Fly.io URL:

```bash
cd ../ios-app
./update-backend-url.sh https://claude-cloud-service.fly.dev
```

## Environment Variables

The following environment variables are set:
- `SESSION_TYPE=pty` - Uses PTY-based session manager
- `SESSIONS_DIR=/app/sessions` - Directory for session data
- `NODE_ENV=production` - Production environment
- `PORT=3000` - Internal port

## Monitoring and Logs

```bash
# View real-time logs
flyctl logs

# Check app status
flyctl status

# Open app in browser
flyctl open

# SSH into the container
flyctl ssh console
```

## Troubleshooting

### WebSocket Connection Issues
- Ensure your app URL uses `wss://` for WebSocket connections
- Check that the path starts with `/ws/`

### Claude CLI Not Found
- The Dockerfile installs Claude CLI globally
- Check logs to ensure installation succeeded

### PTY Errors
- The container includes all required dependencies for node-pty
- If issues persist, check that `SESSION_TYPE=pty` is set

## Scaling

```bash
# Scale to specific number of instances
flyctl scale count 2

# Configure auto-scaling
flyctl autoscale set min=0 max=3
```

## Updating the App

To deploy updates:

```bash
# Make your changes, then:
flyctl deploy
```

## Security Notes

- API keys are stored as Fly.io secrets
- Sessions are isolated per user
- WebSocket connections require valid session IDs
- JWT tokens are used for session management

## Cost Optimization

The app is configured to:
- Scale to 0 when not in use
- Use shared CPU (cheaper)
- Minimal memory allocation (512MB)

This keeps costs low while maintaining good performance.