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
    type: 'interactive',
    title: 'Guest Infiltration Prevention',
    missionBrief: 'Enable secure guest printing without compromising network security.',
    question: 'Complete the Web Print workflow and verification quiz.',
    answer: 'WEB_PRINT',
    hint: 'Web Print requires no software installation and works from any browser, on or off network.',
    acceptableAnswers: ['WEB_PRINT', 'GUEST_PRINT'],
  },
  {
    id: 8,
    type: 'interactive',
    title: 'AI Management Deployment',
    missionBrief: 'Deploy AI-powered intelligent management to automate print tasks.',
    question: 'Interact with AI agent and identify automation opportunities.',
    answer: 'AI_MANAGEMENT',
    hint: 'AI can automate driver updates, dynamic deployment, and self-service workflows.',
    acceptableAnswers: ['AI_MANAGEMENT', 'AI_AUTOMATION'],
  },
  {
    id: 9,
    type: 'interactive',
    title: 'Legacy System Analysis',
    missionBrief: 'Analyze legacy output management to understand the complexity before consolidation.',
    question: 'Identify teams, analyze architecture, calculate costs, and find problems.',
    answer: 'LEGACY_ANALYSIS',
    hint: 'Two teams (backend/frontend), 10 servers, $18K-$50K/year in costs.',
    acceptableAnswers: ['LEGACY_ANALYSIS', 'LEGACY'],
  },
  {
    id: 10,
    type: 'interactive',
    title: 'Unified Output Platform',
    missionBrief: 'Deploy Vasion Output to consolidate all backend and frontend printing.',
    question: 'Configure Vasion Output, build architecture, and test failover.',
    answer: 'UNIFIED_OUTPUT',
    hint: '4 steps: Routing → Output Service → Edge Service → EHR/ERP. Both flows use same Edge Service.',
    acceptableAnswers: ['UNIFIED_OUTPUT', 'VASION_OUTPUT'],
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
