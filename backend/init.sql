-- Code Camp 2025 Database Schema
-- This file is automatically run when the PostgreSQL container is first created

-- Leads table: Tracks sales leads from the game
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT '',
    phone VARCHAR(50),
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_time INTEGER DEFAULT 0,
    levels_completed INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    source VARCHAR(50) DEFAULT 'web',
    event VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on source and event for filtering
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_event ON leads(event);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);


-- Scores table: Tracks game scores and leaderboard
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    score INTEGER NOT NULL DEFAULT 0,
    levels_completed INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    completion_time INTEGER DEFAULT 0,
    -- Score breakdown for analytics
    level_points INTEGER,
    answer_points INTEGER,
    hint_penalty INTEGER,
    bonus_points INTEGER,
    level12_bonus INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on score for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores(score DESC, completion_time ASC);

-- Create index on email for player lookups
CREATE INDEX IF NOT EXISTS idx_scores_email ON scores(email);

-- Create index on created_at for recent scores
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);


-- Optional: Add some useful views

-- Daily lead counts
CREATE OR REPLACE VIEW daily_leads AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as lead_count,
    COUNT(*) FILTER (WHERE source = 'tradeshow') as tradeshow_count,
    COUNT(*) FILTER (WHERE source = 'web') as web_count
FROM leads
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Daily score statistics
CREATE OR REPLACE VIEW daily_scores AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as games_played,
    MAX(score) as highest_score,
    ROUND(AVG(score)::numeric, 1) as avg_score,
    MIN(completion_time) as fastest_time
FROM scores
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top performers view
CREATE OR REPLACE VIEW top_performers AS
SELECT
    player_name,
    email,
    score,
    levels_completed,
    completion_time,
    created_at,
    RANK() OVER (ORDER BY score DESC, completion_time ASC) as rank
FROM scores
ORDER BY rank
LIMIT 100;

-- Grant permissions (if using a different user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO codecamp;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO codecamp;

