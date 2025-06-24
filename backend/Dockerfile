FROM node:20-slim

# Install dependencies for node-pty
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    git \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user first
RUN useradd -m -s /bin/bash claude-user

# Install Claude CLI globally via npm
RUN npm install -g @anthropic-ai/claude-code

# Verify installation and show where it's installed
RUN which claude || echo "Claude not found in PATH"
RUN ls -la /usr/local/lib/node_modules/ || echo "No global modules"
RUN find /usr -name "claude" -type f 2>/dev/null || echo "Claude binary not found"

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
ENV PATH="/usr/local/bin:${PATH}"

# Copy test script
COPY test-claude-auth.js /app/

# Expose port
EXPOSE 3000

# Create startup script that tests Claude first
RUN echo '#!/bin/sh\n\
echo "=== Container Starting ==="\n\
echo "User: $(whoami)"\n\
echo "PATH: $PATH"\n\
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}"\n\
echo "Testing Claude..."\n\
claude --version || echo "Claude version failed"\n\
echo "Starting application..."\n\
exec npm start' > /app/start.sh && chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]