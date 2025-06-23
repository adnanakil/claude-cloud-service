#!/bin/bash

echo "Creating Xcode project..."

# Create the project using xcodegen or manually
cd ios-app

# Create Package.swift for SwiftPM
cat > Package.swift << 'EOF'
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ClaudeCloud",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "ClaudeCloud",
            targets: ["ClaudeCloud"]),
    ],
    targets: [
        .target(
            name: "ClaudeCloud",
            path: "Sources")
    ]
)
EOF

# Create directory structure
mkdir -p Sources/ClaudeCloud

# Move Swift files
mv ClaudeCloud/ClaudeCloud/*.swift Sources/ClaudeCloud/ 2>/dev/null || true

echo "Project structure created. Now open Xcode and:"
echo "1. File > New > Project"
echo "2. Choose iOS > App"
echo "3. Product Name: ClaudeCloud"
echo "4. Interface: SwiftUI"
echo "5. Language: Swift"
echo "6. Save in: ios-app directory"
echo ""
echo "Then copy the Swift files from Sources/ClaudeCloud into your new project."