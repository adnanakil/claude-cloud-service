#!/bin/bash

# Script to update iOS app backend URL

if [ $# -eq 0 ]; then
    echo "Usage: $0 <new-backend-url>"
    echo "Example: $0 https://claude-cloud-service.fly.dev"
    exit 1
fi

NEW_URL=$1
NEW_WS_URL=$(echo $NEW_URL | sed 's/https:/wss:/')

echo "Updating iOS app backend URL to: $NEW_URL"
echo "WebSocket URL will be: $NEW_WS_URL"

# Update the ClaudeCloudApp.swift file
sed -i '' "s|private let baseURL = \".*\"|private let baseURL = \"$NEW_URL\"|g" ClaudeCloudApp.swift
sed -i '' "s|private let wsBaseURL = \".*\"|private let wsBaseURL = \"$NEW_WS_URL\"|g" ClaudeCloudApp.swift

echo "Backend URL updated successfully!"
echo "Don't forget to rebuild the iOS app."