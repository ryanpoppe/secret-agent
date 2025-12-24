import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePuzzleStore } from '@/stores/puzzle'

export function usePuzzle(puzzleId: number) {
  const gameStore = useGameStore()
  const puzzleStore = usePuzzleStore()

  // State
  const userAnswer = ref('')
  const feedback = ref('')
  const hintShown = ref(false)
  const isCorrect = ref(false)
  const isSubmitting = ref(false)

  // Get puzzle data
  const puzzle = computed(() => puzzleStore.getPuzzleById(puzzleId))

  // Getters
  const attempts = computed(() => puzzleStore.attempts)
  const hint = computed(() => puzzle.value?.hint || '')
  const question = computed(() => puzzle.value?.question || '')
  const title = computed(() => puzzle.value?.title || '')
  const missionBrief = computed(() => puzzle.value?.missionBrief || '')

  // Actions
  function checkAnswer(): boolean {
    if (!puzzle.value || isCorrect.value) return false

    isSubmitting.value = true
    puzzleStore.incrementAttempts()
    gameStore.addAttempt()

    const correct = puzzleStore.validateAnswer(puzzleId, userAnswer.value)

    if (correct) {
      isCorrect.value = true
      feedback.value = 'Mission accomplished! Proceeding to next objective...'
      gameStore.completeLevel(puzzleId)
    } else {
      feedback.value = 'Incorrect. Try again, Agent.'
      // Clear feedback after a moment
      setTimeout(() => {
        feedback.value = ''
      }, 2000)
    }

    isSubmitting.value = false
    return correct
  }

  function showHint() {
    if (!hintShown.value) {
      hintShown.value = true
      gameStore.useHint(puzzleId)
    }
  }

  function resetPuzzle() {
    userAnswer.value = ''
    feedback.value = ''
    hintShown.value = false
    isCorrect.value = false
    puzzleStore.resetAttempts()
  }

  return {
    // State
    userAnswer,
    feedback,
    hintShown,
    isCorrect,
    isSubmitting,
    // Computed
    puzzle,
    attempts,
    hint,
    question,
    title,
    missionBrief,
    // Actions
    checkAnswer,
    showHint,
    resetPuzzle,
  }
}
