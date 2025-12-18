import type { LeadSubmission } from '@/types/player'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

const FAILED_SUBMISSIONS_KEY = 'secret_agent_failed_submissions'

interface ApiResponse {
  success: boolean
  message?: string
  error?: string
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

    if (!response.ok) {
      saveFailedSubmission(data)
      throw new Error(`Lead submission failed: ${response.status}`)
    }

    return await response.json()
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
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
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

