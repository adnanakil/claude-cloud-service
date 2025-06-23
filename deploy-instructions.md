# Deploy Instructions

## Step 1: GitHub Setup

1. First, authenticate GitHub CLI:
   ```bash
   gh auth login
   ```

2. Create the repository:
   ```bash
   gh repo create claude-cloud-service --public --description "Cloud-based Claude Code service with iOS app interface"
   ```

3. Push to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 2: Railway Deployment

1. Go to [Railway](https://railway.app) and sign in

2. Click "New Project" → "Deploy from GitHub repo"

3. Select the `claude-cloud-service` repository

4. In the deployment settings:
   - Set Root Directory to: `backend`
   - Railway will detect the Dockerfile automatically

5. Add environment variables in Railway dashboard:
   ```
   ANTHROPIC_API_KEY=your-claude-api-key
   JWT_SECRET=generate-a-secure-secret
   SESSIONS_DIR=/app/sessions
   NODE_ENV=production
   ```

6. Railway will automatically deploy your service

## Step 3: Update iOS App

1. Once deployed, copy your Railway URL (e.g., `claude-cloud-service.up.railway.app`)

2. Update `ios-app/ClaudeCloud/ClaudeCloud/TerminalManager.swift`:
   ```swift
   private let baseURL = "https://claude-cloud-service.up.railway.app"
   private let wsBaseURL = "wss://claude-cloud-service.up.railway.app"
   ```

3. Commit and push the iOS app updates:
   ```bash
   git add ios-app/ClaudeCloud/ClaudeCloud/TerminalManager.swift
   git commit -m "Update iOS app with production URLs"
   git push
   ```

## Alternative: Manual GitHub Repository Creation

If you prefer to create the repository manually:

1. Go to https://github.com/new
2. Name: `claude-cloud-service`
3. Make it public
4. Don't initialize with README
5. Create repository

Then run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/claude-cloud-service.git
git push -u origin main
```