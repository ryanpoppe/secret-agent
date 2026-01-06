import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GameState } from '@/types/game'
import { STORAGE_KEYS } from '@/types/game'
import { updateProgress } from '@/utils/api'
import { usePlayerStore } from './player'

// Scoring constants
const POINTS_PER_LEVEL = 10
const POINTS_PER_CORRECT_ANSWER = 1
const POINTS_HINT_PENALTY = -5
const POINTS_HIDDEN_BONUS = 10
const POINTS_WRONG_ANSWER_PENALTY = -5

export const useGameStore = defineStore('game', () => {
  // State
  const currentLevel = ref(0) // 0 = intro, 1-11 = levels, 12 = debrief
  const levelsCompleted = ref<number[]>([])
  const startTime = ref<Date | null>(null)
  const endTime = ref<Date | null>(null)
  const hintsUsed = ref<number[]>([])
  const isComplete = ref(false)
  const totalAttempts = ref(0)
  
  // Scoring state
  const correctAnswers = ref<Record<number, number>>({}) // levelId -> count of correct answers
  const hiddenBonusFound = ref(false)
  const wrongAnswerPenalties = ref(0) // Count of wrong answer penalties applied

  // Getters
  const completionPercentage = computed(() => {
    return Math.round((levelsCompleted.value.length / 11) * 100)
  })

  const elapsedTime = computed(() => {
    if (!startTime.value) return 0
    const end = endTime.value || new Date()
    return Math.floor((end.getTime() - startTime.value.getTime()) / 1000)
  })

  const formattedTime = computed(() => {
    const seconds = elapsedTime.value
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })
  
  // Scoring getters
  const levelCompletionPoints = computed(() => {
    return levelsCompleted.value.length * POINTS_PER_LEVEL
  })
  
  const correctAnswerPoints = computed(() => {
    // Exclude Level 12 bonus from regular answer points
    return Object.entries(correctAnswers.value)
      .filter(([levelId]) => levelId !== '12')
      .reduce((sum, [, count]) => sum + count * POINTS_PER_CORRECT_ANSWER, 0)
  })
  
  // Level 12 bonus points (separate from regular scoring)
  const level12BonusPoints = computed(() => {
    return correctAnswers.value[12] || 0
  })
  
  const hintPenaltyPoints = computed(() => {
    return hintsUsed.value.length * POINTS_HINT_PENALTY
  })
  
  const hiddenBonusPoints = computed(() => {
    return hiddenBonusFound.value ? POINTS_HIDDEN_BONUS : 0
  })
  
  const wrongAnswerPenaltyPoints = computed(() => {
    return wrongAnswerPenalties.value * POINTS_WRONG_ANSWER_PENALTY
  })
  
  const totalScore = computed(() => {
    return Math.max(0, levelCompletionPoints.value + correctAnswerPoints.value + hintPenaltyPoints.value + hiddenBonusPoints.value + level12BonusPoints.value + wrongAnswerPenaltyPoints.value)
  })
  
  const totalCorrectAnswers = computed(() => {
    // Exclude Level 12 bonus from correct answer count
    return Object.entries(correctAnswers.value)
      .filter(([levelId]) => levelId !== '12')
      .reduce((sum, [, count]) => sum + count, 0)
  })
  
  const scoreBreakdown = computed(() => ({
    levelsCompleted: levelsCompleted.value.length,
    levelPoints: levelCompletionPoints.value,
    correctAnswers: totalCorrectAnswers.value,
    answerPoints: correctAnswerPoints.value,
    hintsUsed: hintsUsed.value.length,
    hintPenalty: hintPenaltyPoints.value,
    wrongAnswers: wrongAnswerPenalties.value,
    wrongAnswerPenalty: wrongAnswerPenaltyPoints.value,
    hiddenBonus: hiddenBonusFound.value,
    bonusPoints: hiddenBonusPoints.value,
    level12Completed: levelsCompleted.value.includes(12),
    level12Bonus: level12BonusPoints.value,
    total: totalScore.value,
  }))

  const gameState = computed<GameState>(() => ({
    currentLevel: currentLevel.value,
    levelsCompleted: levelsCompleted.value,
    startTime: startTime.value,
    endTime: endTime.value,
    hintsUsed: hintsUsed.value,
    isComplete: isComplete.value,
    totalAttempts: totalAttempts.value,
  }))

  // Actions
  function startGame() {
    currentLevel.value = 1
    startTime.value = new Date()
    levelsCompleted.value = []
    hintsUsed.value = []
    isComplete.value = false
    totalAttempts.value = 0
    correctAnswers.value = {}
    hiddenBonusFound.value = false
    saveToStorage()
  }

  function completeLevel(levelId: number) {
    if (!levelsCompleted.value.includes(levelId)) {
      levelsCompleted.value.push(levelId)
    }

    if (levelId < 11) {
      currentLevel.value = levelId + 1
    } else {
      // All levels complete
      currentLevel.value = 12
      endTime.value = new Date()
      isComplete.value = true
    }
    saveToStorage()
    syncProgressToBackend()
  }

  /**
   * Sync current game progress to the backend
   */
  function syncProgressToBackend() {
    const playerStore = usePlayerStore()
    
    if (!playerStore.email) {
      console.warn('No player email - skipping progress sync')
      return
    }

    updateProgress({
      playerName: playerStore.name,
      email: playerStore.email,
      score: totalScore.value,
      levelsCompleted: levelsCompleted.value.length,
      currentLevel: currentLevel.value,
      hintsUsed: hintsUsed.value.length,
      totalAttempts: totalAttempts.value,
      completionTime: elapsedTime.value,
      isComplete: isComplete.value,
      scoreBreakdown: {
        levelPoints: levelCompletionPoints.value,
        answerPoints: correctAnswerPoints.value,
        hintPenalty: hintPenaltyPoints.value,
        bonusPoints: hiddenBonusPoints.value,
        level12Bonus: level12BonusPoints.value,
      },
    }).catch((err) => {
      console.error('Failed to sync progress:', err)
    })
  }

  function useHint(levelId: number) {
    if (!hintsUsed.value.includes(levelId)) {
      hintsUsed.value.push(levelId)
      saveToStorage()
      syncProgressToBackend()
    }
  }

  function addAttempt() {
    totalAttempts.value++
    saveToStorage()
    // Don't sync on every attempt to avoid too many API calls
  }
  
  function addCorrectAnswer(levelId: number, count: number = 1) {
    if (!correctAnswers.value[levelId]) {
      correctAnswers.value[levelId] = 0
    }
    correctAnswers.value[levelId] += count
    saveToStorage()
    syncProgressToBackend()
  }
  
  function setLevelCorrectAnswers(levelId: number, count: number) {
    correctAnswers.value[levelId] = count
    saveToStorage()
    syncProgressToBackend()
  }
  
  function findHiddenBonus() {
    hiddenBonusFound.value = true
    saveToStorage()
    syncProgressToBackend()
  }
  
  function deductPoints(points: number = 5) {
    // Each call to deductPoints adds one wrong answer penalty
    // The points parameter is ignored - we use a fixed penalty per wrong answer
    wrongAnswerPenalties.value++
    saveToStorage()
    syncProgressToBackend()
  }

  function goToLevel(levelId: number) {
    currentLevel.value = levelId
    saveToStorage()
  }

  function saveToStorage() {
    const data = {
      currentLevel: currentLevel.value,
      levelsCompleted: levelsCompleted.value,
      startTime: startTime.value?.toISOString() || null,
      endTime: endTime.value?.toISOString() || null,
      hintsUsed: hintsUsed.value,
      isComplete: isComplete.value,
      totalAttempts: totalAttempts.value,
      correctAnswers: correctAnswers.value,
      hiddenBonusFound: hiddenBonusFound.value,
      wrongAnswerPenalties: wrongAnswerPenalties.value,
    }
    localStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(data))
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEYS.GAME)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        currentLevel.value = data.currentLevel || 0
        levelsCompleted.value = data.levelsCompleted || []
        startTime.value = data.startTime ? new Date(data.startTime) : null
        endTime.value = data.endTime ? new Date(data.endTime) : null
        hintsUsed.value = data.hintsUsed || []
        isComplete.value = data.isComplete || false
        totalAttempts.value = data.totalAttempts || 0
        correctAnswers.value = data.correctAnswers || {}
        hiddenBonusFound.value = data.hiddenBonusFound || false
        wrongAnswerPenalties.value = data.wrongAnswerPenalties || 0
      } catch (e) {
        console.error('Failed to parse game data from storage:', e)
      }
    }
  }

  function resetGame() {
    currentLevel.value = 0
    levelsCompleted.value = []
    startTime.value = null
    endTime.value = null
    hintsUsed.value = []
    isComplete.value = false
    totalAttempts.value = 0
    correctAnswers.value = {}
    hiddenBonusFound.value = false
    wrongAnswerPenalties.value = 0
    localStorage.removeItem(STORAGE_KEYS.GAME)
  }

  return {
    // State
    currentLevel,
    levelsCompleted,
    startTime,
    endTime,
    hintsUsed,
    isComplete,
    totalAttempts,
    correctAnswers,
    hiddenBonusFound,
    wrongAnswerPenalties,
    // Getters
    completionPercentage,
    elapsedTime,
    formattedTime,
    gameState,
    totalScore,
    scoreBreakdown,
    levelCompletionPoints,
    correctAnswerPoints,
    hintPenaltyPoints,
    hiddenBonusPoints,
    wrongAnswerPenaltyPoints,
    level12BonusPoints,
    totalCorrectAnswers,
    // Actions
    startGame,
    completeLevel,
    useHint,
    addAttempt,
    addCorrectAnswer,
    setLevelCorrectAnswers,
    findHiddenBonus,
    deductPoints,
    goToLevel,
    saveToStorage,
    loadFromStorage,
    resetGame,
    syncProgressToBackend,
  }
})
