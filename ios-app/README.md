# ClaudeCloud iOS App

## Creating the Xcode Project

1. Open Xcode
2. File → New → Project
3. Choose **iOS** → **App**
4. Configure:
   - Product Name: `ClaudeCloud`
   - Team: Select your team
   - Organization Identifier: `com.yourname`
   - Interface: `SwiftUI`
   - Language: `Swift`
   - Use Core Data: `No`
   - Include Tests: `No`
5. Save in the `ios-app` directory

## Adding the Code

1. Delete the default `ContentView.swift`
2. Right-click on the `ClaudeCloud` folder in Xcode
3. Add Files to "ClaudeCloud"
4. Select `ClaudeCloudApp.swift` from this directory
5. Make sure "Copy items if needed" is checked

## Running the App

1. Select your iOS device or simulator
2. Click the Run button (▶️)
3. The app will connect to your Railway backend

## Features

- Real-time terminal interface
- WebSocket connection to Claude Code
- Command input and output display
- Auto-scrolling terminal view

## Troubleshooting

If you see connection errors:
1. Check that your Railway backend is running
2. Verify the URLs in `TerminalManager` class
3. For local testing, update URLs to use your local backend