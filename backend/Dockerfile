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

# Verify installation
RUN which claude && claude --version || echo "Claude CLI installed"

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

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]