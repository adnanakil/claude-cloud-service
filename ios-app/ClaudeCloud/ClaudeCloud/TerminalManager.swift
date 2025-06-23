import Foundation
import Combine

class TerminalManager: ObservableObject {
    @Published var output = ""
    @Published var isConnected = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var sessionId: String?
    private let baseURL = "https://claude-text-production.up.railway.app"
    private let wsBaseURL = "wss://claude-text-production.up.railway.app"
    
    func connect() {
        createSession { [weak self] sessionId in
            guard let self = self, let sessionId = sessionId else { return }
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
                }
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let message = try? JSONDecoder().decode(WebSocketMessage.self, from: data) else { return }
        
        DispatchQueue.main.async {
            switch message.type {
            case "output":
                self.output += message.data ?? ""
            case "connected":
                self.output += "Connected to Claude Code session\\n"
            case "exit":
                self.output += "\\nSession ended\\n"
                self.isConnected = false
            default:
                break
            }
        }
    }
    
    func sendCommand(_ command: String) {
        let message = WebSocketMessage(type: "command", command: command)
        guard let data = try? JSONEncoder().encode(message),
              let string = String(data: data, encoding: .utf8) else { return }
        
        webSocketTask?.send(.string(string)) { error in
            if let error = error {
                print("Send error: \(error)")
            }
        }
        
        DispatchQueue.main.async {
            self.output += "> \(command)\\n"
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