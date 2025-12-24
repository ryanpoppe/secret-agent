import type { LeadSubmission } from '@/types/player'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api/leads'
const SCORES_ENDPOINT = import.meta.env.VITE_SCORES_ENDPOINT || '/api/scores'
const API_KEY = import.meta.env.VITE_API_KEY || ''

const FAILED_SUBMISSIONS_KEY = 'secret_agent_failed_submissions'

interface ApiResponse {
  success: boolean
  message?: string
  error?: string
  code?: string
  id?: number
  rank?: number
}

interface ScoreSubmission {
  playerName: string
  email: string
  score: number
  levelsCompleted: number
  currentLevel: number
  hintsUsed: number
  totalAttempts: number
  completionTime: number
  isComplete?: boolean
  scoreBreakdown?: {
    levelPoints: number
    answerPoints: number
    hintPenalty: number
    bonusPoints: number
    level12Bonus: number
  }
}

interface LeaderboardEntry {
  rank: number
  playerName: string
  score: number
  levelsCompleted: number
  currentLevel: number
  hintsUsed: number
  completionTime: number
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Check if an email address already exists in the system
 */
export async function checkEmailExists(email: string): Promise<{
  success: boolean
  exists?: boolean
  error?: string
}> {
  try {
    const response = await fetch(`${API_ENDPOINT}/check-email/${encodeURIComponent(email)}`)

    if (!response.ok) {
      throw new Error(`Email check failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Email check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Submit lead data to the API
 */
export async function submitLead(data: LeadSubmission): Promise<ApiResponse> {
  if (!API_ENDPOINT) {
    console.warn('API endpoint not configured. Storing lead locally.')
    saveFailedSubmission(data)
    return { success: false, error: 'API not configured' }
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      // Return the error response (includes code for EMAIL_EXISTS)
      return result
    }

    return result
  } catch (error) {
    console.error('Lead submission error:', error)
    saveFailedSubmission(data)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Save failed submission for later retry
 */
export function saveFailedSubmission(data: LeadSubmission): void {
  try {
    const existing = getFailedSubmissions()
    existing.push({
      ...data,
      failedAt: new Date().toISOString(),
    })
    localStorage.setItem(FAILED_SUBMISSIONS_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save submission to localStorage:', error)
  }
}

/**
 * Get all failed submissions
 */
export function getFailedSubmissions(): (LeadSubmission & { failedAt: string })[] {
  try {
    const stored = localStorage.getItem(FAILED_SUBMISSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear failed submissions (after successful retry)
 */
export function clearFailedSubmissions(): void {
  localStorage.removeItem(FAILED_SUBMISSIONS_KEY)
}

/**
 * Retry all failed submissions
 */
export async function retryFailedSubmissions(): Promise<number> {
  const failed = getFailedSubmissions()
  if (failed.length === 0) return 0

  let successCount = 0
  const stillFailed: (LeadSubmission & { failedAt: string })[] = []

  for (const submission of failed) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { failedAt, ...data } = submission
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        successCount++
      } else {
        stillFailed.push(submission)
      }
    } catch {
      stillFailed.push(submission)
    }
  }

  localStorage.setItem(FAILED_SUBMISSIONS_KEY, JSON.stringify(stillFailed))
  return successCount
}

/**
 * Export leads as CSV for manual processing
 */
export function exportLeadsAsCsv(): string {
  const failed = getFailedSubmissions()
  if (failed.length === 0) return ''

  const headers = [
    'Name',
    'Email',
    'Company',
    'Role',
    'Phone',
    'Completed At',
    'Completion Time (s)',
    'Levels Completed',
    'Hints Used',
    'Total Attempts',
    'Source',
    'Event',
    'Failed At',
  ]

  const rows = failed.map((lead) => [
    lead.name,
    lead.email,
    lead.company,
    lead.role || '',
    lead.phone || '',
    lead.completedAt,
    lead.completionTime.toString(),
    lead.levelsCompleted.toString(),
    lead.hintsUsed.toString(),
    lead.totalAttempts.toString(),
    lead.source,
    lead.event || '',
    lead.failedAt,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download leads as CSV file
 */
export function downloadLeadsCsv(): void {
  const csv = exportLeadsAsCsv()
  if (!csv) {
    console.warn('No leads to export')
    return
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// ============================================
// Score Tracking API
// ============================================

/**
 * Submit a score to the leaderboard
 */
export async function submitScore(data: ScoreSubmission): Promise<ApiResponse> {
  try {
    const response = await fetch(SCORES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Score submission failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Score submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get the leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<{
  success: boolean
  data?: LeaderboardEntry[]
  error?: string
}> {
  try {
    const response = await fetch(`${SCORES_ENDPOINT}/leaderboard?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get the rank for a specific score
 */
export async function getScoreRank(score: number): Promise<{
  success: boolean
  data?: {
    rank: number
    total: number
    percentile: number
  }
  error?: string
}> {
  try {
    const response = await fetch(`${SCORES_ENDPOINT}/rank/${score}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch rank: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Rank fetch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update player progress after each level
 * This creates or updates the score record for the player
 */
export async function updateProgress(data: ScoreSubmission): Promise<ApiResponse> {
  try {
    const response = await fetch(SCORES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Progress update failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Progress update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
