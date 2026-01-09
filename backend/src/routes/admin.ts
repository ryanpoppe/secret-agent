import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db.js';

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Simple session store (in-memory for simplicity)
const sessions = new Map<string, { username: string; createdAt: Date }>();

// Clean up expired sessions (older than 24 hours)
function cleanupSessions() {
  const now = new Date();
  for (const [token, session] of sessions) {
    const age = now.getTime() - session.createdAt.getTime();
    if (age > 24 * 60 * 60 * 1000) {
      sessions.delete(token);
    }
  }
}

// Generate a simple random token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2) +
         Date.now().toString(36);
}

// Admin authentication middleware
function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session) {
    res.status(401).json({ success: false, error: 'Invalid or expired session' });
    return;
  }

  // Check if session is expired (24 hours)
  const age = Date.now() - session.createdAt.getTime();
  if (age > 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    res.status(401).json({ success: false, error: 'Session expired' });
    return;
  }

  next();
}

// POST /api/admin/login - Admin login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    res.status(500).json({ 
      success: false, 
      error: 'Admin credentials not configured on server' 
    });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  // Clean up old sessions
  cleanupSessions();

  // Create new session
  const token = generateToken();
  sessions.set(token, { username, createdAt: new Date() });

  console.log(`Admin login successful: ${username}`);

  res.json({
    success: true,
    token,
    message: 'Login successful',
  });
});

// POST /api/admin/logout - Admin logout
router.post('/logout', authenticateAdmin, (req: Request, res: Response) => {
  const token = req.headers.authorization?.substring(7);
  if (token) {
    sessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/verify - Verify admin session
router.get('/verify', authenticateAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Session valid' });
});

// ============================================
// Leaderboard Management
// ============================================

// GET /api/admin/scores - Get all scores with more details
router.get('/scores', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = '100', offset = '0' } = req.query;

    const result = await query<{
      id: number;
      player_name: string;
      email: string;
      score: number;
      levels_completed: number;
      current_level: number;
      hints_used: number;
      total_attempts: number;
      completion_time: number;
      is_complete: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM scores 
       ORDER BY score DESC, completion_time ASC 
       LIMIT $1 OFFSET $2`,
      [parseInt(limit as string, 10), parseInt(offset as string, 10)]
    );

    const countResult = await query<{ total: string }>(
      'SELECT COUNT(*) as total FROM scores'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        playerName: row.player_name,
        email: row.email,
        score: row.score,
        levelsCompleted: row.levels_completed,
        currentLevel: row.current_level,
        hintsUsed: row.hints_used,
        totalAttempts: row.total_attempts,
        completionTime: row.completion_time,
        isComplete: row.is_complete,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total, 10),
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scores' });
  }
});

// DELETE /api/admin/scores/:id - Delete a single score entry
router.delete('/scores/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scoreId = parseInt(id, 10);

    if (isNaN(scoreId)) {
      res.status(400).json({ success: false, error: 'Invalid score ID' });
      return;
    }

    const result = await query(
      'DELETE FROM scores WHERE id = $1 RETURNING id, player_name, email',
      [scoreId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Score not found' });
      return;
    }

    console.log(`Admin deleted score: ID ${scoreId}`);

    res.json({
      success: true,
      message: 'Score deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting score:', error);
    res.status(500).json({ success: false, error: 'Failed to delete score' });
  }
});

// DELETE /api/admin/scores - Clear all scores (leaderboard)
router.delete('/scores', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM scores');
    
    console.log(`Admin cleared leaderboard: ${result.rowCount} entries deleted`);

    res.json({
      success: true,
      message: `Leaderboard cleared. ${result.rowCount} entries deleted.`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to clear leaderboard' });
  }
});

// ============================================
// Leads Management
// ============================================

// GET /api/admin/leads - Get all leads
router.get('/leads', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = '100', offset = '0' } = req.query;

    const result = await query<{
      id: number;
      name: string;
      email: string;
      company: string;
      role: string;
      phone: string | null;
      completed_at: Date;
      completion_time: number;
      levels_completed: number;
      hints_used: number;
      total_attempts: number;
      source: string;
      event: string | null;
      created_at: Date;
    }>(
      `SELECT * FROM leads 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [parseInt(limit as string, 10), parseInt(offset as string, 10)]
    );

    const countResult = await query<{ total: string }>(
      'SELECT COUNT(*) as total FROM leads'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        company: row.company,
        role: row.role,
        phone: row.phone,
        completedAt: row.completed_at,
        completionTime: row.completion_time,
        levelsCompleted: row.levels_completed,
        hintsUsed: row.hints_used,
        totalAttempts: row.total_attempts,
        source: row.source,
        event: row.event,
        createdAt: row.created_at,
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total, 10),
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// DELETE /api/admin/leads/:id - Delete a single lead
router.delete('/leads/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leadId = parseInt(id, 10);

    if (isNaN(leadId)) {
      res.status(400).json({ success: false, error: 'Invalid lead ID' });
      return;
    }

    const result = await query(
      'DELETE FROM leads WHERE id = $1 RETURNING id, name, email',
      [leadId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    console.log(`Admin deleted lead: ID ${leadId}`);

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

// DELETE /api/admin/leads - Clear all leads
router.delete('/leads', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM leads');
    
    console.log(`Admin cleared leads: ${result.rowCount} entries deleted`);

    res.json({
      success: true,
      message: `All leads cleared. ${result.rowCount} entries deleted.`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error('Error clearing leads:', error);
    res.status(500).json({ success: false, error: 'Failed to clear leads' });
  }
});

// ============================================
// Stats
// ============================================

// GET /api/admin/stats - Get overall stats
router.get('/stats', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const leadsCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM leads');
    const scoresCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM scores');
    const completedCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM scores WHERE is_complete = true'
    );

    res.json({
      success: true,
      data: {
        totalLeads: parseInt(leadsCount.rows[0].count, 10),
        totalScores: parseInt(scoresCount.rows[0].count, 10),
        completedGames: parseInt(completedCount.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;

