import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

interface ScoreSubmission {
  playerName: string;
  email: string;
  score: number;
  levelsCompleted: number;
  currentLevel: number;
  hintsUsed: number;
  totalAttempts: number;
  completionTime: number;
  isComplete?: boolean;
  scoreBreakdown?: {
    levelPoints: number;
    answerPoints: number;
    hintPenalty: number;
    bonusPoints: number;
    level12Bonus: number;
  };
}

interface ScoreRow {
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
  level_points: number | null;
  answer_points: number | null;
  hint_penalty: number | null;
  bonus_points: number | null;
  level12_bonus: number | null;
  created_at: Date;
  updated_at: Date;
  rank?: string;
}

// POST /api/scores - Create or update score (upsert by email)
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: ScoreSubmission = req.body;

    // Validate required fields
    if (!data.playerName || !data.email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: playerName and email are required',
      });
      return;
    }

    // Upsert score - insert or update based on email
    const result = await query<ScoreRow>(
      `INSERT INTO scores (
        player_name, email, score, levels_completed, current_level,
        hints_used, total_attempts, completion_time, is_complete,
        level_points, answer_points, hint_penalty,
        bonus_points, level12_bonus, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (email) DO UPDATE SET
        score = EXCLUDED.score,
        levels_completed = EXCLUDED.levels_completed,
        current_level = EXCLUDED.current_level,
        hints_used = EXCLUDED.hints_used,
        total_attempts = EXCLUDED.total_attempts,
        completion_time = EXCLUDED.completion_time,
        is_complete = EXCLUDED.is_complete,
        level_points = EXCLUDED.level_points,
        answer_points = EXCLUDED.answer_points,
        hint_penalty = EXCLUDED.hint_penalty,
        bonus_points = EXCLUDED.bonus_points,
        level12_bonus = EXCLUDED.level12_bonus,
        updated_at = NOW()
      RETURNING id`,
      [
        data.playerName,
        data.email,
        data.score || 0,
        data.levelsCompleted || 0,
        data.currentLevel || 1,
        data.hintsUsed || 0,
        data.totalAttempts || 0,
        data.completionTime || 0,
        data.isComplete || false,
        data.scoreBreakdown?.levelPoints || 0,
        data.scoreBreakdown?.answerPoints || 0,
        data.scoreBreakdown?.hintPenalty || 0,
        data.scoreBreakdown?.bonusPoints || 0,
        data.scoreBreakdown?.level12Bonus || 0,
      ]
    );

    // Get the rank for this score
    const rankResult = await query<{ rank: string }>(
      `SELECT COUNT(*) + 1 as rank
       FROM scores
       WHERE score > $1 AND is_complete = true`,
      [data.score || 0]
    );

    console.log(`Score updated: ${data.playerName} (${data.email}) - Level ${data.currentLevel}, ${data.score || 0} points`);

    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      id: result.rows[0].id,
      rank: parseInt(rankResult.rows[0].rank, 10),
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score',
    });
  }
});

// GET /api/scores/player/:email - Get score for a specific player
router.get('/player/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const result = await query<ScoreRow>(
      `SELECT * FROM scores WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Player not found',
      });
      return;
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
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
        scoreBreakdown: {
          levelPoints: row.level_points,
          answerPoints: row.answer_points,
          hintPenalty: row.hint_penalty,
          bonusPoints: row.bonus_points,
          level12Bonus: row.level12_bonus,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching player score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player score',
    });
  }
});

// GET /api/scores/leaderboard - Get top scores
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = '10', includeIncomplete = 'false' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const showIncomplete = includeIncomplete === 'true';

    const whereClause = showIncomplete ? '' : 'WHERE is_complete = true';

    const result = await query<ScoreRow>(
      `SELECT
        id, player_name, email, score, levels_completed, current_level,
        hints_used, completion_time, is_complete, created_at, updated_at,
        RANK() OVER (ORDER BY score DESC, completion_time ASC) as rank
       FROM scores
       ${whereClause}
       ORDER BY score DESC, completion_time ASC
       LIMIT $1`,
      [limitNum]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        rank: parseInt(row.rank!, 10),
        playerName: row.player_name,
        score: row.score,
        levelsCompleted: row.levels_completed,
        currentLevel: row.current_level,
        hintsUsed: row.hints_used,
        completionTime: row.completion_time,
        isComplete: row.is_complete,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

// GET /api/scores/stats - Get score statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await query<{
      total_games: string;
      highest_score: string;
      average_score: string;
      fastest_time: string;
      avg_completion_time: string;
      total_hints_used: string;
      avg_levels_completed: string;
    }>(`
      SELECT
        COUNT(*) as total_games,
        MAX(score) as highest_score,
        ROUND(AVG(score), 1) as average_score,
        MIN(completion_time) as fastest_time,
        ROUND(AVG(completion_time)) as avg_completion_time,
        SUM(hints_used) as total_hints_used,
        ROUND(AVG(levels_completed), 1) as avg_levels_completed
      FROM scores
    `);

    const topScorer = await query<{ player_name: string; score: number }>(
      `SELECT player_name, score
       FROM scores
       ORDER BY score DESC, completion_time ASC
       LIMIT 1`
    );

    const row = stats.rows[0];

    res.json({
      success: true,
      data: {
        totalGames: parseInt(row.total_games, 10),
        highestScore: parseInt(row.highest_score, 10) || 0,
        averageScore: parseFloat(row.average_score) || 0,
        fastestTime: parseInt(row.fastest_time, 10) || 0,
        avgCompletionTime: parseFloat(row.avg_completion_time) || 0,
        totalHintsUsed: parseInt(row.total_hints_used, 10) || 0,
        avgLevelsCompleted: parseFloat(row.avg_levels_completed) || 0,
        topScorer: topScorer.rows[0] ? {
          playerName: topScorer.rows[0].player_name,
          score: topScorer.rows[0].score,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching score stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

// GET /api/scores/rank/:score - Get rank for a specific score
router.get('/rank/:score', async (req: Request, res: Response) => {
  try {
    const score = parseInt(req.params.score, 10);

    if (isNaN(score)) {
      res.status(400).json({
        success: false,
        error: 'Invalid score parameter',
      });
      return;
    }

    const result = await query<{ rank: string; total: string }>(
      `SELECT
        (SELECT COUNT(*) + 1 FROM scores WHERE score > $1) as rank,
        (SELECT COUNT(*) FROM scores) as total`,
      [score]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        rank: parseInt(row.rank, 10),
        total: parseInt(row.total, 10),
        percentile: row.total !== '0'
          ? Math.round((1 - (parseInt(row.rank, 10) - 1) / parseInt(row.total, 10)) * 100)
          : 100,
      },
    });
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rank',
    });
  }
});

export default router;

