FROM node:20-slim

# Install dependencies for node-pty and Claude Code
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI as root
RUN curl -fsSL https://github.com/anthropics/claude-code/releases/latest/download/install.sh | bash
RUN cp /root/.local/bin/claude /usr/local/bin/claude || cp /usr/local/bin/claude /usr/bin/claude || true
RUN chmod +x /usr/local/bin/claude || chmod +x /usr/bin/claude || true

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create a non-root user
RUN useradd -m -s /bin/bash claude-user
RUN chown -R claude-user:claude-user /app

# Switch to non-root user
USER claude-user

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]