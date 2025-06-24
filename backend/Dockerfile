FROM node:20-slim

# Install dependencies for node-pty and Claude Code
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user first
RUN useradd -m -s /bin/bash claude-user

# Install Claude CLI globally
RUN curl -fsSL https://github.com/anthropics/claude-code/releases/latest/download/install.sh | bash && \
    # Find where Claude was installed and copy to global location
    find /root -name "claude" -type f -executable -exec cp {} /usr/local/bin/claude \; && \
    chmod +x /usr/local/bin/claude && \
    # Make it accessible to all users
    chmod 755 /usr/local/bin/claude

# Test Claude installation
RUN /usr/local/bin/claude --version || echo "Claude CLI installation needs API key to run"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies as root
RUN npm install

# Copy application code
COPY . .

# Change ownership to claude-user
RUN chown -R claude-user:claude-user /app

# Create sessions directory
RUN mkdir -p /app/sessions && chown -R claude-user:claude-user /app/sessions

# Switch to non-root user
USER claude-user

# Set environment variable for sessions
ENV SESSIONS_DIR=/app/sessions

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]