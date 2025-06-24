FROM node:20-slim

# Install dependencies for node-pty and other build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    git \
    wget \
    ca-certificates \
    build-essential \
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

# Create sessions directory and projects directory
RUN mkdir -p /app/sessions /app/projects && chown -R claude-user:claude-user /app/sessions /app/projects

# Switch to non-root user
USER claude-user

# Set environment variables
ENV SESSIONS_DIR=/app/sessions
ENV PROJECTS_DIR=/app/projects
ENV PATH="/usr/local/bin:${PATH}"
# Set git config for the user
USER claude-user
RUN git config --global user.email "claude@fly.io" && \
    git config --global user.name "Claude Code"
USER root

# Copy test script
COPY test-claude-auth.js /app/

# Expose port
EXPOSE 3000

# Create startup script as root
USER root
RUN echo '#!/bin/sh\n\
echo "=== Container Starting ==="\n\
echo "User: $(whoami)"\n\
echo "PATH: $PATH"\n\
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}"\n\
\n\
# Export environment variables for child processes\n\
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"\n\
export JWT_SECRET="${JWT_SECRET}"\n\
export PATH="${PATH}"\n\
\n\
# Clone or update the repository\n\
REPO_DIR="/app/projects/claude-cloud-service"\n\
if [ -d "$REPO_DIR" ]; then\n\
    echo "Repository exists, pulling latest changes..."\n\
    cd "$REPO_DIR"\n\
    git pull origin main || echo "Git pull failed, continuing..."\n\
else\n\
    echo "Cloning repository..."\n\
    cd /app/projects\n\
    git clone https://github.com/adnanakil/claude-cloud-service.git || echo "Git clone failed"\n\
    # Set ownership after cloning\n\
    chown -R claude-user:claude-user "$REPO_DIR" || echo "Chown failed"\n\
fi\n\
\n\
echo "Testing Claude..."\n\
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" claude --version || echo "Claude version failed"\n\
echo "Starting application..."\n\
cd /app\n\
# Pass environment variables explicitly to su\n\
exec su claude-user -c "ANTHROPIC_API_KEY=\"${ANTHROPIC_API_KEY}\" JWT_SECRET=\"${JWT_SECRET}\" npm start"' > /app/start.sh && chmod +x /app/start.sh

# Start the application as root (script will switch to claude-user)
CMD ["/app/start.sh"]