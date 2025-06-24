#!/bin/bash

# Deploy to Fly.io script

echo "Claude Cloud Service - Deploy to Fly.io"
echo "======================================="

# Set Fly CLI path
FLY_CMD="/Users/adnanakil/.fly/bin/flyctl"

# Check if fly CLI is installed
if [ ! -f "$FLY_CMD" ]; then
    if ! command -v flyctl &> /dev/null && ! command -v fly &> /dev/null; then
        echo "Error: Fly CLI is not installed"
        echo "Please install it from https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi
    FLY_CMD=$(command -v flyctl || command -v fly)
fi

# Check if logged in to Fly.io
echo "Checking Fly.io authentication..."
if ! $FLY_CMD auth whoami &> /dev/null; then
    echo "Not logged in to Fly.io. Please run: $FLY_CMD auth login"
    exit 1
fi

# Create app if it doesn't exist
echo "Checking if app exists..."
if ! $FLY_CMD apps list | grep -q "claude-cloud-service"; then
    echo "Creating new Fly.io app..."
    $FLY_CMD apps create claude-cloud-service --org personal
else
    echo "App already exists"
fi

# Set secrets
echo "Setting secrets..."
echo "Please ensure you have your ANTHROPIC_API_KEY ready"

# Check if ANTHROPIC_API_KEY is already set
if ! $FLY_CMD secrets list | grep -q "ANTHROPIC_API_KEY"; then
    read -p "Enter your ANTHROPIC_API_KEY: " -s api_key
    echo
    $FLY_CMD secrets set ANTHROPIC_API_KEY="$api_key"
else
    echo "ANTHROPIC_API_KEY already set"
fi

# Generate a random JWT secret if not already set
if ! $FLY_CMD secrets list | grep -q "JWT_SECRET"; then
    jwt_secret=$(openssl rand -base64 32)
    echo "Setting JWT_SECRET..."
    $FLY_CMD secrets set JWT_SECRET="$jwt_secret"
else
    echo "JWT_SECRET already set"
fi

# Deploy the app
echo "Deploying to Fly.io..."
$FLY_CMD deploy

# Get app URL
echo "Getting app URL..."
$FLY_CMD status

echo ""
echo "Deployment complete!"
echo "Your app should be available at: https://claude-cloud-service.fly.dev"
echo ""
echo "To view logs: $FLY_CMD logs"
echo "To check status: $FLY_CMD status"
echo "To open in browser: $FLY_CMD open"