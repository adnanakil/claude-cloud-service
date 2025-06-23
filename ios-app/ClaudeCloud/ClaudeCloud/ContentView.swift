import SwiftUI

struct ContentView: View {
    @StateObject private var terminalManager = TerminalManager()
    @State private var inputCommand = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            TerminalView(output: terminalManager.output)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            
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

struct TerminalView: View {
    let output: String
    @State private var scrollViewProxy: ScrollViewProxy?
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                Text(output)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.green)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .id("bottom")
            }
            .background(Color.black)
            .onAppear {
                scrollViewProxy = proxy
            }
            .onChange(of: output) { _ in
                withAnimation {
                    scrollViewProxy?.scrollTo("bottom", anchor: .bottom)
                }
            }
        }
    }
}

#Preview {
    ContentView()
}