# Mobile Development Guide for Claude Cloud Service

This guide explains how to develop the Claude Cloud Service using your iPhone through the Fly.io deployment.

## Overview

The Fly.io deployment is configured to:
1. Automatically clone your GitHub repository
2. Start Claude Code sessions in the project directory
3. Provide full access to the codebase for development
4. Sync changes back to GitHub

## Setup

### 1. Initial Deployment

Run the setup script:
```bash
cd backend
./setup-fly-development.sh
```

### 2. Set Your API Key

```bash
flyctl secrets set ANTHROPIC_API_KEY=your-api-key --app claude-cloud-service
```

### 3. Get Your App URL

```bash
flyctl info --app claude-cloud-service
```

Look for the hostname (e.g., `claude-cloud-service.fly.dev`)

## Using Claude Code on Mobile

### Connect from iPhone

1. Open the ClaudeCloud iOS app
2. Enter your Fly.io app URL: `https://your-app.fly.dev`
3. Claude Code will start automatically in the project directory

### Available Commands

When connected, Claude Code has full access to:
- All project files in `/app/projects/claude-cloud-service`
- Git for version control
- npm for package management
- All standard Unix tools

### Working Directory Structure

```
/app/
├── projects/
│   └── claude-cloud-service/    # Your cloned repository
│       ├── backend/
│       ├── ios-app/
│       └── shared/
├── sessions/                    # Individual session directories
└── node_modules/               # Backend dependencies
```

## Development Workflow

### 1. Making Changes

Claude Code starts in `/app/projects/claude-cloud-service`, giving you access to:
- Edit files across the entire project
- Run tests
- Execute npm commands
- Use git for version control

### 2. Testing Changes

You can test backend changes immediately:
```bash
# From within Claude Code
cd backend
npm test
```

### 3. Committing Changes

```bash
# From within Claude Code
git add .
git commit -m "Your commit message"
git push origin main
```

### 4. Updating the Deployment

After pushing changes to GitHub, redeploy:
```bash
# From your local machine
flyctl deploy --app claude-cloud-service
```

## Tips for Mobile Development

### 1. Use Short Commands
Mobile typing can be tedious. Use aliases and short commands:
```bash
# In Claude Code
alias gs='git status'
alias ga='git add'
alias gc='git commit'
```

### 2. Navigate Efficiently
```bash
# Jump to key directories
cd /app/projects/claude-cloud-service/backend
cd /app/projects/claude-cloud-service/ios-app
```

### 3. View Files Quickly
```bash
# Use cat for quick viewing
cat package.json
# Use less for longer files
less src/index.js
```

### 4. Check Git Status Often
```bash
git status
git diff
```

## Troubleshooting

### Repository Not Cloned

If the repository isn't cloned automatically:

1. SSH into the container:
   ```bash
   flyctl ssh console --app claude-cloud-service
   ```

2. Clone manually:
   ```bash
   cd /app/projects
   git clone https://github.com/adnanakil/claude-cloud-service.git
   ```

### Claude Code Not Starting in Project Directory

Check the logs:
```bash
flyctl logs --app claude-cloud-service
```

Look for messages about the working directory.

### Permission Issues

The `claude-user` should have full access to `/app/projects`. If you encounter permission issues:

1. SSH into the container
2. Check permissions:
   ```bash
   ls -la /app/projects
   ```

## Advanced Usage

### Environment Variables

Set additional environment variables:
```bash
flyctl secrets set VAR_NAME=value --app claude-cloud-service
```

### Scaling

Adjust resources if needed:
```bash
flyctl scale memory 1024 --app claude-cloud-service
```

### Monitoring

View real-time logs:
```bash
flyctl logs --app claude-cloud-service --tail
```

## Security Notes

1. The repository is cloned via HTTPS (public access)
2. To push changes, you'll need to set up GitHub credentials
3. Keep your ANTHROPIC_API_KEY secure
4. Consider using GitHub tokens for private repositories

## Next Steps

1. Set up GitHub authentication for pushing changes
2. Configure any additional tools you need
3. Customize the environment for your workflow
4. Consider setting up automated deployments with GitHub Actions