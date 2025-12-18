import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GameState } from '@/types/game'
import { STORAGE_KEYS } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  // State
  const currentLevel = ref(0) // 0 = intro, 1-11 = levels, 12 = debrief
  const levelsCompleted = ref<number[]>([])
  const startTime = ref<Date | null>(null)
  const endTime = ref<Date | null>(null)
  const hintsUsed = ref<number[]>([])
  const isComplete = ref(false)
  const totalAttempts = ref(0)

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
  }

  function useHint(levelId: number) {
    if (!hintsUsed.value.includes(levelId)) {
      hintsUsed.value.push(levelId)
      saveToStorage()
    }
  }

  function addAttempt() {
    totalAttempts.value++
    saveToStorage()
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
    // Getters
    completionPercentage,
    elapsedTime,
    formattedTime,
    gameState,
    // Actions
    startGame,
    completeLevel,
    useHint,
    addAttempt,
    goToLevel,
    saveToStorage,
    loadFromStorage,
    resetGame,
  }
})

