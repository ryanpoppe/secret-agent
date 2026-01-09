import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthCheck } from './db.js';
import leadsRouter from './routes/leads.js';
import scoresRouter from './routes/scores.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const API_KEY = process.env.API_KEY;

// Middleware
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
  credentials: true,
}));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Optional API key authentication
const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  if (!API_KEY) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== API_KEY) {
    res.status(403).json({ success: false, error: 'Invalid API key' });
    return;
  }

  next();
};

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await healthCheck();
  if (dbHealthy) {
    res.json({ status: 'healthy', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API routes
app.use('/api/leads', authenticateApiKey, leadsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/admin', adminRouter);

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}`);
  console.log(`   API key protection: ${API_KEY ? 'enabled' : 'disabled'}`);
});

