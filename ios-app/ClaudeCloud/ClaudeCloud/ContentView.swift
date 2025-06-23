//
//  ContentView.swift
//  ClaudeCloud
//
//  Created by Adnan Akil on 6/23/25.
//

import SwiftUI
import Foundation
import Combine

struct ContentView: View {
    @StateObject private var terminalManager = TerminalManager()
    @State private var inputCommand = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Terminal output
            ScrollViewReader { proxy in
                ScrollView {
                    Text(terminalManager.output)
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .id("bottom")
                }
                .background(Color.black)
                .onChange(of: terminalManager.output) { _ in
                    withAnimation {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                }
            }
            
            // Input field
            HStack {
                TextField("Enter command", text: $inputCommand)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .focused($isInputFocused)
                    .onSubmit {
                        sendCommand()
                    }
                
                Button(action: sendCommand) {
                    Image(systemName: "paperplane.fill")
                }
                .disabled(inputCommand.isEmpty || !terminalManager.isConnected)
            }
            .padding()
        }
        .onAppear {
            terminalManager.connect()
            isInputFocused = true
        }
    }
    
    private func sendCommand() {
        guard !inputCommand.isEmpty else { return }
        terminalManager.sendCommand(inputCommand)
        inputCommand = ""
    }
}

class TerminalManager: ObservableObject {
    @Published var output = ""
    @Published var isConnected = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var sessionId: String?
    private let baseURL = "https://claude-text-production.up.railway.app"
    private let wsBaseURL = "wss://claude-text-production.up.railway.app"
    
    func connect() {
        output = "Connecting to Claude Cloud...\n"
        createSession { [weak self] sessionId in
            guard let self = self, let sessionId = sessionId else {
                DispatchQueue.main.async {
                    self?.output += "Failed to create session\n"
                }
                return
            }
            self.sessionId = sessionId
            self.connectWebSocket(sessionId: sessionId)
        }
    }
    
    private func createSession(completion: @escaping (String?) -> Void) {
        guard let url = URL(string: "\(baseURL)/api/sessions") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["userId": "ios-user"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            guard let data = data,
                  let response = try? JSONDecoder().decode(SessionResponse.self, from: data) else {
                completion(nil)
                return
            }
            completion(response.id)
        }.resume()
    }
    
    private func connectWebSocket(sessionId: String) {
        guard let url = URL(string: "\(wsBaseURL)/ws/\(sessionId)") else { return }
        
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        
        DispatchQueue.main.async {
            self.isConnected = true
        }
        
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                default:
                    break
                }
                self?.receiveMessage()
                
            case .failure(let error):
                print("WebSocket error: \(error)")
                DispatchQueue.main.async {
                    self?.isConnected = false
                    self?.output += "\nDisconnected from server\n"
                }
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        print("Received WebSocket message: \(text)")
        guard let data = text.data(using: .utf8),
              let message = try? JSONDecoder().decode(WebSocketMessage.self, from: data) else { 
            print("Failed to decode message")
            return 
        }
        
        DispatchQueue.main.async {
            switch message.type {
            case "output":
                self.output += message.data ?? ""
            case "connected":
                self.output += "Connected to Claude Code session\n"
            case "exit":
                self.output += "\nSession ended\n"
                self.isConnected = false
            default:
                print("Unknown message type: \(message.type)")
            }
        }
    }
    
    func sendCommand(_ command: String) {
        let message = WebSocketMessage(type: "command", command: command)
        guard let data = try? JSONEncoder().encode(message),
              let string = String(data: data, encoding: .utf8) else { return }
        
        print("Sending command: \(string)")
        
        webSocketTask?.send(.string(string)) { error in
            if let error = error {
                print("Send error: \(error)")
                DispatchQueue.main.async {
                    self.output += "\nError sending command: \(error.localizedDescription)\n"
                }
            } else {
                print("Command sent successfully")
            }
        }
        
        DispatchQueue.main.async {
            self.output += "> \(command)\n"
        }
    }
}

struct SessionResponse: Codable {
    let id: String
    let userId: String
    let createdAt: String
    let websocketUrl: String
}

struct WebSocketMessage: Codable {
    let type: String
    let data: String?
    let command: String?
    let code: Int?
    
    init(type: String, data: String? = nil, command: String? = nil, code: Int? = nil) {
        self.type = type
        self.data = data
        self.command = command
        self.code = code
    }
}

#Preview {
    ContentView()
}