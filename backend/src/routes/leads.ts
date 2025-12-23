import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

interface LeadSubmission {
  name: string;
  email: string;
  company: string;
  role: string;
  phone?: string;
  completedAt: string;
  completionTime: number;
  levelsCompleted: number;
  hintsUsed: number;
  totalAttempts: number;
  source: 'tradeshow' | 'web';
  event?: string;
}

interface LeadRow {
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
}

// POST /api/leads - Submit a new lead
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: LeadSubmission = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.company) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and company are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
      return;
    }

    // Insert lead into database
    const result = await query<LeadRow>(
      `INSERT INTO leads (
        name, email, company, role, phone,
        completed_at, completion_time, levels_completed,
        hints_used, total_attempts, source, event
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        data.name,
        data.email,
        data.company,
        data.role || '',
        data.phone || null,
        data.completedAt,
        data.completionTime,
        data.levelsCompleted,
        data.hintsUsed,
        data.totalAttempts,
        data.source || 'web',
        data.event || null,
      ]
    );

    console.log(`New lead submitted: ${data.email} (ID: ${result.rows[0].id})`);

    res.status(201).json({
      success: true,
      message: 'Lead submitted successfully',
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit lead',
    });
  }
});

// GET /api/leads - List all leads (admin endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source, event, limit = '100', offset = '0' } = req.query;

    let queryText = 'SELECT * FROM leads WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (source) {
      queryText += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (event) {
      queryText += ` AND event = $${paramIndex++}`;
      params.push(event);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await query<LeadRow>(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams: unknown[] = [];
    let countParamIndex = 1;

    if (source) {
      countQuery += ` AND source = $${countParamIndex++}`;
      countParams.push(source);
    }
    if (event) {
      countQuery += ` AND event = $${countParamIndex}`;
      countParams.push(event);
    }

    const countResult = await query<{ total: string }>(countQuery, countParams);

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
    });
  }
});

// GET /api/leads/export - Export leads as CSV
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { source, event } = req.query;

    let queryText = 'SELECT * FROM leads WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (source) {
      queryText += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (event) {
      queryText += ` AND event = $${paramIndex}`;
      params.push(event);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query<LeadRow>(queryText, params);

    // Generate CSV
    const headers = [
      'ID', 'Name', 'Email', 'Company', 'Role', 'Phone',
      'Completed At', 'Completion Time (s)', 'Levels Completed',
      'Hints Used', 'Total Attempts', 'Source', 'Event', 'Created At'
    ];

    const rows = result.rows.map(row => [
      row.id,
      row.name,
      row.email,
      row.company,
      row.role,
      row.phone || '',
      row.completed_at,
      row.completion_time,
      row.levels_completed,
      row.hints_used,
      row.total_attempts,
      row.source,
      row.event || '',
      row.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export leads',
    });
  }
});

// GET /api/leads/stats - Get lead statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await query<{
      total_leads: string;
      total_tradeshow: string;
      total_web: string;
      avg_completion_time: string;
      avg_levels_completed: string;
      unique_companies: string;
    }>(`
      SELECT
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE source = 'tradeshow') as total_tradeshow,
        COUNT(*) FILTER (WHERE source = 'web') as total_web,
        ROUND(AVG(completion_time)) as avg_completion_time,
        ROUND(AVG(levels_completed), 1) as avg_levels_completed,
        COUNT(DISTINCT company) as unique_companies
      FROM leads
    `);

    const byEvent = await query<{ event: string; count: string }>(`
      SELECT event, COUNT(*) as count
      FROM leads
      WHERE event IS NOT NULL
      GROUP BY event
      ORDER BY count DESC
    `);

    const row = stats.rows[0];

    res.json({
      success: true,
      data: {
        totalLeads: parseInt(row.total_leads, 10),
        bySource: {
          tradeshow: parseInt(row.total_tradeshow, 10),
          web: parseInt(row.total_web, 10),
        },
        averageCompletionTime: parseFloat(row.avg_completion_time) || 0,
        averageLevelsCompleted: parseFloat(row.avg_levels_completed) || 0,
        uniqueCompanies: parseInt(row.unique_companies, 10),
        byEvent: byEvent.rows.map(r => ({
          event: r.event,
          count: parseInt(r.count, 10),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;

