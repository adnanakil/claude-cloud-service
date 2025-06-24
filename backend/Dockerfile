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

# For now, we'll use a placeholder for Claude CLI
# In production, you would download the actual Claude binary
RUN mkdir -p /usr/local/bin && \
    echo '#!/bin/bash' > /usr/local/bin/claude && \
    echo 'echo "Claude CLI placeholder - please install actual Claude CLI"' >> /usr/local/bin/claude && \
    echo 'echo "Visit: https://github.com/anthropics/claude-code"' >> /usr/local/bin/claude && \
    echo 'exit 1' >> /usr/local/bin/claude && \
    chmod 755 /usr/local/bin/claude

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