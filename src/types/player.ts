export interface PlayerState {
  name: string
  email: string
  company: string
  role: string
  phone: string | null
  submittedAt: Date | null
}

export interface LeadSubmission {
  // Player information
  name: string
  email: string
  company: string
  role: string
  phone?: string

  // Game metrics
  completedAt: string // ISO timestamp
  completionTime: number // seconds
  levelsCompleted: number
  hintsUsed: number
  totalAttempts: number

  // Source tracking
  source: 'tradeshow' | 'web'
  event?: string // Tradeshow name
}

