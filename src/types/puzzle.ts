export type PuzzleType =
  | 'caesar'
  | 'morse'
  | 'binary'
  | 'hex'
  | 'network'
  | 'pattern'
  | 'substitution'
  | 'ports'
  | 'logic'
  | 'visual'
  | 'final'

export interface Puzzle {
  id: number
  type: PuzzleType
  title: string
  missionBrief: string
  question: string
  answer: string
  hint: string
  acceptableAnswers?: string[] // Alternative correct answers
}

export interface PuzzleState {
  puzzles: Puzzle[]
  currentPuzzle: Puzzle | null
  attempts: number
}

export interface PuzzleAttempt {
  puzzleId: number
  answer: string
  isCorrect: boolean
  timestamp: Date
}

