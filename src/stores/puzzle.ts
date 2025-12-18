import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Puzzle, PuzzleState } from '@/types/puzzle'

// Puzzle configurations for all 11 levels
const puzzleConfigs: Puzzle[] = [
  {
    id: 1,
    type: 'pattern',
    title: 'Intelligence Briefing',
    missionBrief: 'Analyze gold standard RFP requirements for Intelligent Print Automation.',
    question: 'Sort the intercepted intelligence into the correct categories.',
    answer: 'DOCUMENT_SORT',
    hint: 'MODERNIZE = Cloud/Security, CONSOLIDATE = Unified platform, AUTOMATE = AI/Workflows',
    acceptableAnswers: ['DOCUMENT_SORT'],
  },
  {
    id: 2,
    type: 'network',
    title: 'Eliminate the Threat',
    missionBrief: 'Remove legacy print server infrastructure and build cloud-native architecture.',
    question: 'Build the correct architecture: Endpoint → ? → Printer',
    answer: 'CLOUD',
    hint: 'The flow is: Endpoint → Cloud (TLS 443) → Printer (Port 9100). No servers needed!',
    acceptableAnswers: ['CLOUD', 'ARCHITECTURE'],
  },
  {
    id: 3,
    type: 'binary',
    title: 'Digital Dead Drop',
    missionBrief: 'Binary data recovered from a compromised server.',
    question: '01001000 01001001',
    answer: 'HI',
    hint: 'Convert each 8-bit binary number to its ASCII character.',
  },
  {
    id: 4,
    type: 'hex',
    title: 'Memory Dump Analysis',
    missionBrief: 'Hexadecimal data extracted from a suspicious device.',
    question: '4B 45 59',
    answer: 'KEY',
    hint: 'Convert each hex pair to ASCII. 4B = 75 in decimal = K',
  },
  {
    id: 5,
    type: 'ports',
    title: 'Network Reconnaissance',
    missionBrief: 'Identify the service running on this common port.',
    question: 'Which service typically runs on port 443?',
    answer: 'HTTPS',
    hint: 'This is the secure version of web traffic.',
    acceptableAnswers: ['HTTPS', 'SSL', 'TLS', 'SECURE HTTP'],
  },
  {
    id: 6,
    type: 'pattern',
    title: 'Sequence Analysis',
    missionBrief: 'Complete the pattern to unlock the next phase.',
    question: '2, 4, 8, 16, ?',
    answer: '32',
    hint: 'Each number is doubled (multiplied by 2).',
  },
  {
    id: 7,
    type: 'substitution',
    title: 'Cipher Wheel',
    missionBrief: 'A simple substitution cipher. A=Z, B=Y, C=X...',
    question: 'XLWV',
    answer: 'CODE',
    hint: 'Reverse the alphabet. X=C, L=O, W=D, V=E',
  },
  {
    id: 8,
    type: 'logic',
    title: 'Security Protocol',
    missionBrief: 'Answer this security question correctly.',
    question: 'What does the "S" in HTTPS stand for?',
    answer: 'SECURE',
    hint: 'It means the connection is protected by encryption.',
  },
  {
    id: 9,
    type: 'network',
    title: 'IP Investigation',
    missionBrief: 'Identify the type of this IP address.',
    question: 'What type of IP is 192.168.1.1?',
    answer: 'PRIVATE',
    hint: '192.168.x.x addresses are reserved for internal networks.',
    acceptableAnswers: ['PRIVATE', 'INTERNAL', 'LOCAL', 'LAN'],
  },
  {
    id: 10,
    type: 'visual',
    title: 'Access Credentials',
    missionBrief: 'The default port for SSH connections.',
    question: 'What port does SSH use by default?',
    answer: '22',
    hint: "It's a low-numbered well-known port.",
  },
  {
    id: 11,
    type: 'final',
    title: 'Final Transmission',
    missionBrief: 'Decrypt this final message to complete your mission.',
    question: 'NJTTJPO DPNQMFUF',
    answer: 'MISSION COMPLETE',
    hint: 'Caesar cipher, shift back by 1.',
    acceptableAnswers: ['MISSION COMPLETE', 'MISSIONCOMPLETE'],
  },
]

export const usePuzzleStore = defineStore('puzzle', () => {
  // State
  const puzzles = ref<Puzzle[]>(puzzleConfigs)
  const currentPuzzleId = ref<number | null>(null)
  const attempts = ref(0)

  // Getters
  const currentPuzzle = computed(() => {
    if (currentPuzzleId.value === null) return null
    return puzzles.value.find((p) => p.id === currentPuzzleId.value) || null
  })

  const getPuzzleById = computed(() => {
    return (id: number) => puzzles.value.find((p) => p.id === id) || null
  })

  // Actions
  function setPuzzle(id: number) {
    currentPuzzleId.value = id
    attempts.value = 0
  }

  function validateAnswer(puzzleId: number, answer: string): boolean {
    const puzzle = puzzles.value.find((p) => p.id === puzzleId)
    if (!puzzle) return false

    const normalizedAnswer = answer.toUpperCase().trim()

    // Check main answer
    if (normalizedAnswer === puzzle.answer.toUpperCase()) {
      return true
    }

    // Check acceptable alternatives
    if (puzzle.acceptableAnswers) {
      return puzzle.acceptableAnswers.some((alt) => normalizedAnswer === alt.toUpperCase())
    }

    return false
  }

  function incrementAttempts() {
    attempts.value++
  }

  function resetAttempts() {
    attempts.value = 0
  }

  return {
    // State
    puzzles,
    currentPuzzleId,
    attempts,
    // Getters
    currentPuzzle,
    getPuzzleById,
    // Actions
    setPuzzle,
    validateAnswer,
    incrementAttempts,
    resetAttempts,
  }
})
