export interface GameState {
  currentLevel: number // 0 = intro, 1-11 = levels, 12 = debrief
  levelsCompleted: number[] // Array of completed level IDs
  startTime: Date | null // Game start timestamp
  endTime: Date | null // Game completion timestamp
  hintsUsed: number[] // Levels where hints were used
  isComplete: boolean
  totalAttempts: number
}

export const STORAGE_KEYS = {
  PLAYER: 'secret_agent_player',
  GAME: 'secret_agent_game',
  SESSION: 'secret_agent_session',
} as const
