// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ClaudeCloud",
    platforms: [.iOS(.v16)],
    dependencies: [
        .package(url: "https://github.com/daltoniam/Starscream.git", from: "4.0.0")
    ],
    targets: [
        .executableTarget(
            name: "ClaudeCloud",
            dependencies: ["Starscream"])
    ]
)