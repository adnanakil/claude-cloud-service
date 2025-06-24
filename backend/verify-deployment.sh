#!/bin/bash

# Verification script for Claude Cloud Service deployment

echo "=== Claude Cloud Service Deployment Verification ==="
echo

# Check if flyctl is available
if command -v flyctl &> /dev/null; then
    FLYCTL="flyctl"
elif [ -f "/Users/adnanakil/.fly/bin/flyctl" ]; then
    FLYCTL="/Users/adnanakil/.fly/bin/flyctl"
else
    echo "❌ flyctl not found. Please install it first."
    exit 1
fi

APP_NAME="claude-cloud-service"
echo "Checking deployment for app: $APP_NAME"
echo

# 1. Check app status
echo "1. App Status:"
$FLYCTL status -a $APP_NAME
echo

# 2. Check recent logs for startup
echo "2. Recent Startup Logs:"
echo "Looking for repository cloning and Claude startup..."
$FLYCTL logs -a $APP_NAME | tail -50 | grep -E "(Container Starting|Cloning repository|Repository exists|Testing Claude|Starting application|Git pull|User:|PATH:|ANTHROPIC_API_KEY:)" || echo "No startup logs found"
echo

# 3. Check for errors
echo "3. Recent Errors (if any):"
$FLYCTL logs -a $APP_NAME | tail -50 | grep -iE "(error|failed|exception)" || echo "✓ No recent errors found"
echo

# 4. Test WebSocket connection
echo "4. Testing WebSocket Connection:"
APP_URL=$($FLYCTL info -a $APP_NAME --json | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4)
if [ -n "$APP_URL" ]; then
    echo "App URL: https://$APP_URL"
    
    # Test health endpoint
    echo -n "Testing health endpoint: "
    if curl -s "https://$APP_URL/api/health" | grep -q "ok"; then
        echo "✓ Health check passed"
    else
        echo "❌ Health check failed"
    fi
else
    echo "❌ Could not determine app URL"
fi
echo

# 5. SSH into container to check project directory
echo "5. Checking Project Directory (via SSH):"
echo "Running: flyctl ssh console -a $APP_NAME -C 'ls -la /app/projects/'"
$FLYCTL ssh console -a $APP_NAME -C "ls -la /app/projects/" 2>/dev/null || echo "SSH access not available or directory doesn't exist"
echo

echo "6. Checking if Claude is accessible:"
$FLYCTL ssh console -a $APP_NAME -C "which claude && claude --version" 2>/dev/null || echo "Could not verify Claude installation via SSH"
echo

echo "=== Verification Complete ==="
echo
echo "To test from your iPhone:"
echo "1. Open the ClaudeCloud app"
echo "2. Make sure the URL is set to: https://$APP_NAME.fly.dev"
echo "3. Try running: pwd"
echo "4. Then try: ls -la"
echo "5. You should see your project files"
echo
echo "To monitor logs in real-time:"
echo "  $FLYCTL logs -a $APP_NAME --tail"