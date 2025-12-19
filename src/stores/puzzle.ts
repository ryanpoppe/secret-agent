import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Puzzle } from '@/types/puzzle'

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
    type: 'pattern',
    title: 'Universal Compatibility Protocol',
    missionBrief: 'Verify Vasion platform compatibility across all systems and technologies.',
    question: 'Verify compatibility with 9 OS types and answer 6 questions.',
    answer: 'COMPATIBLE',
    hint: 'Vasion is truly agnostic—supports all OS types, printer manufacturers, and identity providers.',
    acceptableAnswers: ['COMPATIBLE', 'AGNOSTIC'],
  },
  {
    id: 4,
    type: 'interactive',
    title: 'Zero Trust Initialization',
    missionBrief: 'Activate zero-trust security architecture for Apex Industries.',
    question: 'Complete MFA authentication and deploy secure off-network printing architecture.',
    answer: 'ZEROTRUST',
    hint: 'MFA Code: 742963. Architecture: Remote User → TLS → Gateway → Edge Service → Printer',
    acceptableAnswers: ['ZEROTRUST', 'ZERO_TRUST'],
  },
  {
    id: 5,
    type: 'interactive',
    title: 'Certification Vault',
    missionBrief: 'Verify enterprise security certifications to unlock the compliance vault.',
    question: 'Match each certification to its requirement to unlock the vault.',
    answer: 'CERTIFICATIONS',
    hint: 'FedRAMP for federal, SOC 2 Type 2 for enterprise, ISO 27001 for global, ISO 42001 for AI.',
    acceptableAnswers: ['CERTIFICATIONS', 'VAULT'],
  },
  {
    id: 6,
    type: 'interactive',
    title: 'Secure Release Protocol',
    missionBrief: 'Deploy secure release printing and simplified scanning to prevent document theft.',
    question: 'Demonstrate MFD authentication, secure release, and scan to cloud.',
    answer: 'SECURE_RELEASE',
    hint: 'Complete all three auth methods, print all jobs, and scan to OneDrive.',
    acceptableAnswers: ['SECURE_RELEASE', 'PULL_PRINT'],
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
