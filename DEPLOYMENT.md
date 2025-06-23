# Deployment Guide

## Railway Deployment Steps

1. **Push to GitHub**
   ```bash
   cd claude-cloud-service
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Set up Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` directory as the root directory

3. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   - `ANTHROPIC_API_KEY` - Your Claude API key
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
   - `SESSIONS_DIR` - Set to `/app/sessions`
   - `NODE_ENV` - Set to `production`

4. **Deploy**
   - Railway will automatically deploy when you push to GitHub
   - Note your deployment URL (e.g., `https://your-app.railway.app`)

## iOS App Configuration

1. **Update URLs in TerminalManager.swift**
   ```swift
   private let baseURL = "https://your-app.railway.app"
   private let wsBaseURL = "wss://your-app.railway.app"
   ```

2. **Configure App Transport Security**
   Add to Info.plist if using HTTP during development:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   ```

3. **Build and Run**
   - Open the Xcode project
   - Select your device/simulator
   - Build and run

## Monitoring

Railway provides:
- Logs: View in Railway dashboard
- Metrics: CPU, Memory, Network usage
- Alerts: Set up in project settings

## Scaling

To handle more users:
1. Increase Railway plan limits
2. Implement Redis for session management
3. Use PostgreSQL for persistent storage
4. Add rate limiting per user