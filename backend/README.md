# Claude Cloud Service - Backend

## Deployment to Railway

1. Fork/clone this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Set the following environment variables in Railway:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `JWT_SECRET` - A secure random string for JWT signing
   - `PORT` - Railway will set this automatically
5. Deploy!

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your API key
npm run dev
```

## API Endpoints

- `POST /api/sessions` - Create a new Claude Code session
- `GET /api/sessions/:id` - Get session info
- `DELETE /api/sessions/:id` - Terminate a session
- WebSocket: `ws://your-domain/ws/:sessionId` - Connect to session

## iOS App Configuration

Update the `baseURL` and `wsBaseURL` in `TerminalManager.swift` to your Railway deployment URL:

```swift
private let baseURL = "https://your-app.railway.app"
private let wsBaseURL = "wss://your-app.railway.app"
```