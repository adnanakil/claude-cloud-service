#!/bin/bash

# Setup script for Fly.io development environment

echo "=== Claude Cloud Service - Fly.io Development Setup ==="
echo

# Set Fly CLI path
FLYCTL="/Users/adnanakil/.fly/bin/flyctl"
if [ ! -f "$FLYCTL" ]; then
    if ! command -v flyctl &> /dev/null; then
        echo "Error: Fly CLI (flyctl) is not installed."
        echo "Please install it from: https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi
    FLYCTL="flyctl"
fi

# Check if user is logged in to Fly
if ! $FLYCTL auth whoami &> /dev/null; then
    echo "Error: Not logged in to Fly.io"
    echo "Please run: $FLYCTL auth login"
    exit 1
fi

echo "✓ Fly CLI is installed and authenticated"
echo

# Get app name
APP_NAME=${FLY_APP_NAME:-"claude-cloud-service"}
echo "App name: $APP_NAME"

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Warning: ANTHROPIC_API_KEY is not set in your environment"
    echo "You'll need to set it as a Fly secret:"
    echo "  flyctl secrets set ANTHROPIC_API_KEY=your-api-key --app $APP_NAME"
    echo
fi

# Deploy the application
echo "Deploying to Fly.io..."
echo "This will:"
echo "  1. Build the Docker image with git and project cloning support"
echo "  2. Deploy the Claude Code service"
echo "  3. Set up the project directory at /app/projects/claude-cloud-service"
echo "  4. Start Claude Code sessions in the project directory"
echo

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Deploy
$FLYCTL deploy --app $APP_NAME

echo
echo "=== Deployment Complete ==="
echo
echo "Your Claude Code service is now running on Fly.io!"
echo
echo "To access from your iPhone:"
echo "1. Get your app URL: $FLYCTL info --app $APP_NAME"
echo "2. Open the URL in your ClaudeCloud iOS app"
echo "3. Claude Code will start in the project directory with full access to your codebase"
echo
echo "To view logs:"
echo "  $FLYCTL logs --app $APP_NAME"
echo
echo "To SSH into the container:"
echo "  $FLYCTL ssh console --app $APP_NAME"
echo
echo "The project repository will be automatically cloned to:"
echo "  /app/projects/claude-cloud-service"
echo
echo "Each Claude session will start in this directory, giving you full access to develop through your phone!"