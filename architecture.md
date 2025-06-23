# Claude Cloud Service Architecture

## Overview
This system allows Claude Code to run in the cloud and be accessed through an iOS app.

## Components

### 1. Backend Service (Node.js/Python)
- Manages Claude Code instances
- Handles WebSocket connections for real-time communication
- REST API for session management
- Queue system for command processing

### 2. Claude Code Runner
- Docker container with Claude Code CLI
- Persistent sessions per user
- File system isolation
- Resource limits

### 3. iOS App
- SwiftUI interface
- WebSocket client for real-time updates
- Terminal emulator UI
- File browser
- Authentication

### 4. API Design

#### WebSocket Events
- `command` - Send CLI command
- `output` - Receive command output
- `status` - Session status updates
- `error` - Error messages

#### REST Endpoints
- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get session info
- `DELETE /sessions/:id` - Terminate session
- `GET /sessions/:id/files` - List files
- `GET /sessions/:id/files/*` - Download file
- `POST /sessions/:id/files/*` - Upload file

### 5. Security
- JWT authentication
- Rate limiting
- Resource quotas per user
- Sandboxed execution environment