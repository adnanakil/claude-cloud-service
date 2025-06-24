// Environment-specific configuration

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isFlyEnvironment = process.env.FLY_APP_NAME || process.env.FLY_REGION;
export const isDockerEnvironment = process.env.DOCKER_CONTAINER === 'true';

// Session manager configuration
export const sessionConfig = {
  // Disable PTY on Fly.io by default due to container limitations
  usePty: process.env.USE_PTY === 'true' || (!isFlyEnvironment && !isDockerEnvironment),
  
  // Session type preference
  sessionType: process.env.SESSION_TYPE || (isFlyEnvironment ? 'standard' : 'pty'),
  
  // Paths
  sessionsDir: process.env.SESSIONS_DIR || '/tmp/claude-sessions',
  projectsDir: process.env.PROJECTS_DIR || '/app/projects',
  
  // Timeouts
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour default
  commandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '300000'), // 5 minutes default
};

// Get the appropriate session manager
export function getSessionManager() {
  const { sessionType } = sessionConfig;
  
  if (isFlyEnvironment) {
    console.log('Using FlySessionManager for Fly.io environment');
    const { FlySessionManager } = require('../services/flySessionManager');
    return new FlySessionManager();
  }
  
  switch (sessionType) {
    case 'standard':
    case 'claude':
      console.log('Using ClaudeSessionManager (standard spawn)');
      const { ClaudeSessionManager } = require('../services/claudeSessionManager');
      return new ClaudeSessionManager();
      
    case 'pty':
    default:
      console.log('Using SessionManager (PTY)');
      const { SessionManager } = require('../services/sessionManager');
      return new SessionManager();
  }
}