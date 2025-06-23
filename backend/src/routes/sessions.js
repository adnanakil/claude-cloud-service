import express from 'express';

export default function sessionRouter(sessionManager) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { userId } = req.body;
      const session = await sessionManager.createSession(userId || 'anonymous');
      res.json({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        websocketUrl: `/ws/${session.id}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/', (req, res) => {
    const sessions = sessionManager.getAllSessions();
    res.json(sessions);
  });

  router.get('/:id', (req, res) => {
    const session = sessionManager.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    });
  });

  router.delete('/:id', (req, res) => {
    sessionManager.destroySession(req.params.id);
    res.json({ message: 'Session terminated' });
  });

  return router;
}