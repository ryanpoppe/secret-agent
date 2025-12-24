<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Compatibility items for Part A
interface CompatibilityItem {
  id: string
  name: string
  icon: string
  verified: boolean
  details: string[]
}

const compatibilityItems = ref<CompatibilityItem[]>([
  {
    id: 'windows',
    name: 'Windows',
    icon: '🪟',
    verified: false,
    details: ['Windows 10, 11, Server editions', 'Vasion Print client for Windows', 'Full feature support', 'Active Directory integration'],
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: '🍎',
    verified: false,
    details: ['macOS 11+ (Big Sur and later)', 'Native Apple Silicon (M1/M2/M3+) support', 'Intel Mac support', 'Seamless user experience'],
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: '🐧',
    verified: false,
    details: ['Ubuntu, Red Hat', 'Various distributions supported', 'CUPS integration', 'Command-line tools available'],
  },
  {
    id: 'ios',
    name: 'iOS',
    icon: '📱',
    verified: false,
    details: ['iPhone and iPad devices', 'Web Print interface', 'Native printing from apps'],
  },
  {
    id: 'android',
    name: 'Android',
    icon: '🤖',
    verified: false,
    details: ['Android phones and tablets', 'Google Cloud Print alternative', 'Web Print interface', 'Native printing from apps'],
  },
  {
    id: 'chromeos',
    name: 'ChromeOS',
    icon: '💻',
    verified: false,
    details: ['Chromebooks for education/enterprise', 'Cloud-native printing', 'Zero client installation required', 'Perfect for schools and remote workers'],
  },
  {
    id: 'arm',
    name: 'ARM Devices',
    icon: '⚡',
    verified: false,
    details: ['Apple Silicon (M1/M2/M3+ Macs)', 'Windows on ARM laptops', 'Native ARM support (not emulation)', 'Full performance'],
  },
  {
    id: 'igel',
    name: 'IGEL OS',
    icon: '🖥️',
    verified: false,
    details: ['IGEL thin client endpoints', 'VDI optimization', 'Centrally managed', 'Secure endpoint computing'],
  },
  {
    id: 'vdi',
    name: 'VDI Environments',
    icon: '☁️',
    verified: false,
    details: ['Citrix Virtual Apps & Desktops', 'VMware Horizon', 'Windows Virtual Desktop (AVD)', 'Eliminates VDI printing headaches'],
  },
])

// Questions for Parts B-E
interface Question {
  id: string
  part: string
  question: string
  type: 'single' | 'multiple' | 'boolean'
  options: { id: string; text: string }[]
  correctAnswers: string[]
  explanation: string
  answered: boolean
  correct: boolean
  selectedAnswers: string[]
}

const questions = ref<Question[]>([
  {
    id: 'q1',
    part: 'B',
    question: 'Does Vasion support Multi-Function Devices (MFDs) from multiple manufacturers?',
    type: 'single',
    options: [
      { id: 'a', text: 'No, must standardize on one manufacturer' },
      { id: 'b', text: 'Supports up to 3 manufacturers maximum' },
      { id: 'c', text: 'Yes, supports mixed MFD fleets from any manufacturer with unified Control Panel Application (CPA)' },
      { id: 'd', text: 'Only supports HP and Canon' },
    ],
    correctAnswers: ['c'],
    explanation: "Vasion's Control Panel Application (CPA) provides a unified interface across all manufacturers (HP, Canon, Ricoh, Xerox, Konica Minolta, etc.), eliminating the need for users to learn different interfaces.",
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
  {
    id: 'q2',
    part: 'B',
    question: 'What types of printers does Vasion support? (Select all that apply)',
    type: 'multiple',
    options: [
      { id: 'a', text: 'Multi-Function Devices (MFDs)' },
      { id: 'b', text: 'Label printers' },
      { id: 'c', text: 'Desktop printers' },
      { id: 'd', text: 'Wide-format plotters' },
      { id: 'e', text: 'Legacy dot-matrix printers' },
    ],
    correctAnswers: ['a', 'b', 'c', 'd', 'e'],
    explanation: 'Vasion is truly agnostic—it supports MFDs, label printers (Zebra, Brother, DYMO), desktop printers, wide-format plotters, and even legacy dot-matrix printers. If it has an IP address or USB connection, Vasion can print to it.',
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
  {
    id: 'q3',
    part: 'C',
    question: "What balance does Vasion's platform strike regarding printing protocols?",
    type: 'single',
    options: [
      { id: 'a', text: 'Supports only legacy direct IP printing' },
      { id: 'b', text: 'Supports only modern driverless IPP protocols' },
      { id: 'c', text: 'Offers a uniform user experience while supporting BOTH legacy direct IP printing and modern driverless IPP workflows' },
      { id: 'd', text: 'Requires replacing all printers before enabling driverless printing' },
    ],
    correctAnswers: ['c'],
    explanation: 'Vasion supports both legacy direct IP printing (port 9100, requires drivers) and modern driverless IPP (Windows Protected Print, AirPrint, Mopria). The user experience is the same regardless of protocol—IT can modernize at their own pace.',
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
  {
    id: 'q4',
    part: 'D',
    question: "How does Vasion integrate with organizations' existing identity systems?",
    type: 'single',
    options: [
      { id: 'a', text: "Requires migrating to Vasion's proprietary identity system" },
      { id: 'b', text: 'Only supports Active Directory' },
      { id: 'c', text: 'Integrates with existing identity providers using industry standards like SAML 2.0, OIDC, and SCIM' },
      { id: 'd', text: 'No identity integration—users create separate accounts' },
    ],
    correctAnswers: ['c'],
    explanation: "Vasion integrates with existing identity providers via SAML 2.0, OIDC, and SCIM. This means it works with Okta, Azure AD/Microsoft Entra, Active Directory, Google Workspace, PingFederate, and any SAML/OIDC provider—no migration needed.",
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
  {
    id: 'q5',
    part: 'E',
    question: 'VDI (Virtual Desktop Infrastructure) centralizes desktops and apps on servers, which can complicate printing, and Vasion Print is designed to add value in these environments.',
    type: 'boolean',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswers: ['true'],
    explanation: 'VDI printing is notoriously difficult. Vasion solves this by enabling seamless printing from VDI sessions to any printer without complex redirection configurations.',
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
  {
    id: 'q6',
    part: 'E',
    question: 'Vasion requires all printers to be replaced with new models to support modern features.',
    type: 'boolean',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswers: ['false'],
    explanation: "Vasion works with existing printer fleets. You don't need to replace a single device. It supports both legacy printers (via direct IP/port 9100) and modern printers (via IPP/driverless).",
    answered: false,
    correct: false,
    selectedAnswers: [],
  },
])

// State
const expandedItem = ref<string | null>(null)
const showSuccess = ref(false)
const showHint = ref(false)
const feedback = ref<{ type: 'correct' | 'incorrect'; message: string } | null>(null)

// Computed
const verifiedCount = computed(() => compatibilityItems.value.filter((item) => item.verified).length)
const questionsAnswered = computed(() => questions.value.filter((q) => q.answered).length)
const questionsCorrect = computed(() => questions.value.filter((q) => q.correct).length)
const totalProgress = computed(() => verifiedCount.value + questionsAnswered.value)
const totalCorrect = computed(() => verifiedCount.value + questionsCorrect.value)
const allVerified = computed(() => verifiedCount.value === 9)
const allQuestionsAnswered = computed(() => questionsAnswered.value === 6)
// Complete when all platforms verified AND all questions answered (regardless of correctness)
const isComplete = computed(() => allVerified.value && allQuestionsAnswered.value)

// Methods
function verifyItem(item: CompatibilityItem) {
  if (item.verified) {
    expandedItem.value = expandedItem.value === item.id ? null : item.id
    return
  }

  item.verified = true
  expandedItem.value = item.id
  showFeedback('correct', `${item.name} - COMPATIBLE`)

  checkCompletion()
}

function toggleOption(question: Question, optionId: string) {
  if (question.answered) return

  if (question.type === 'multiple') {
    const index = question.selectedAnswers.indexOf(optionId)
    if (index === -1) {
      question.selectedAnswers.push(optionId)
    } else {
      question.selectedAnswers.splice(index, 1)
    }
  } else {
    question.selectedAnswers = [optionId]
  }
}

function submitAnswer(question: Question) {
  if (question.answered || question.selectedAnswers.length === 0) return

  question.answered = true

  // Check if correct
  const sortedSelected = [...question.selectedAnswers].sort()
  const sortedCorrect = [...question.correctAnswers].sort()

  if (sortedSelected.length === sortedCorrect.length && sortedSelected.every((val, idx) => val === sortedCorrect[idx])) {
    question.correct = true
    showFeedback('correct', 'Correct!')
  } else {
    question.correct = false
    showFeedback('incorrect', 'Incorrect - Review the explanation')
  }

  checkCompletion()
}

function checkCompletion() {
  if (isComplete.value) {
    setTimeout(() => {
      showSuccess.value = true
    }, 1000)
  }
}

function showFeedback(type: 'correct' | 'incorrect', message: string) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = null
  }, 2000)
}

function revealHint() {
  if (!showHint.value) {
    showHint.value = true
    gameStore.useHint(3)
  }
}

function proceed() {
  // Report score to game store (verified items + correct questions)
  gameStore.setLevelCorrectAnswers(3, totalCorrect.value)
  gameStore.completeLevel(3)
  router.push({ name: 'level', params: { id: '4' } })
}

function getPartLabel(part: string): string {
  switch (part) {
    case 'B':
      return 'PRINTER COMPATIBILITY'
    case 'C':
      return 'PROTOCOL COMPATIBILITY'
    case 'D':
      return 'IDENTITY INTEGRATION'
    case 'E':
      return 'TRUE/FALSE'
    default:
      return ''
  }
}
</script>

<template>
  <div class="level3-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries IT Infrastructure Map</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="briefing-content">
        <div class="environment-scan">
          <div class="scan-header">📊 ENVIRONMENT SCAN:</div>
          <ul class="scan-results">
            <li><span class="scan-value">5</span> different operating systems</li>
            <li><span class="scan-value">8</span> printer/MFD manufacturers</li>
            <li><span class="scan-value">3</span> identity providers</li>
            <li>VDI infrastructure, ARM devices, Legacy protocols</li>
          </ul>
        </div>

        <p class="task-description">
          <strong>YOUR MISSION:</strong> Verify Vasion's universal compatibility across all systems. Most vendors force standardization—Vasion's agnostic approach means
          <strong class="highlight">one platform, any technology</strong>.
        </p>
      </div>

      <!-- Hint section -->
      <div class="hint-section">
        <button v-if="!showHint" class="hint-btn" @click="revealHint">? REQUEST INTEL</button>
        <div v-else class="hint-content">
          <span class="hint-label">INTEL:</span>
          <p>All OS types are compatible. For questions: Vasion is truly agnostic—supports everything, integrates with existing identity, works with legacy AND modern protocols.</p>
        </div>
      </div>
    </div>

    <!-- Progress display -->
    <div class="progress-display">
      <span class="progress-label">PROGRESS:</span>
      <span class="progress-value">{{ totalProgress }}/15</span>
      <span class="progress-correct">({{ totalCorrect }} correct)</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(totalProgress / 15) * 100}%` }"></div>
      </div>
    </div>

    <!-- Feedback toast -->
    <Transition name="feedback">
      <div v-if="feedback" class="feedback-toast" :class="feedback.type">
        <span class="feedback-icon">{{ feedback.type === 'correct' ? '✓' : '✗' }}</span>
        <span class="feedback-text">{{ feedback.message }}</span>
      </div>
    </Transition>

    <!-- Part A: Compatibility Matrix -->
    <div class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">OPERATING SYSTEMS & ENDPOINTS</h3>
        <span class="part-progress">{{ verifiedCount }}/9 verified</span>
      </div>

      <p class="part-instruction">Click each platform to verify Vasion compatibility:</p>

      <div class="compatibility-grid">
        <div
          v-for="item in compatibilityItems"
          :key="item.id"
          class="compatibility-item"
          :class="{ verified: item.verified, expanded: expandedItem === item.id }"
          @click="verifyItem(item)"
        >
          <div class="item-main">
            <span class="item-icon">{{ item.icon }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-status">
              <span v-if="item.verified" class="status-verified">✓</span>
              <span v-else class="status-pending">○</span>
            </span>
          </div>

          <Transition name="expand">
            <div v-if="item.verified && expandedItem === item.id" class="item-details">
              <div class="details-header">✓ {{ item.name.toUpperCase() }} - COMPATIBLE</div>
              <ul class="details-list">
                <li v-for="(detail, i) in item.details" :key="i">{{ detail }}</li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>

      <div v-if="allVerified" class="all-verified-badge">
        <span class="badge-icon">✓</span>
        <span class="badge-text">ALL PLATFORMS VERIFIED</span>
      </div>
    </div>

    <!-- Parts B-E: Questions -->
    <div v-for="question in questions" :key="question.id" class="part-section question-section">
      <div class="part-header">
        <span class="part-label">PART {{ question.part }}</span>
        <span class="part-subtitle">{{ getPartLabel(question.part) }}</span>
      </div>

      <div class="question-card" :class="{ answered: question.answered, correct: question.correct, incorrect: question.answered && !question.correct }">
        <p class="question-text">{{ question.question }}</p>

        <div class="options-list">
          <div
            v-for="option in question.options"
            :key="option.id"
            class="option-item"
            :class="{
              selected: question.selectedAnswers.includes(option.id),
              correct: question.answered && question.correctAnswers.includes(option.id),
              incorrect: question.answered && question.selectedAnswers.includes(option.id) && !question.correctAnswers.includes(option.id),
            }"
            @click="toggleOption(question, option.id)"
          >
            <span class="option-checkbox">
              <span v-if="question.type === 'multiple'">
                {{ question.selectedAnswers.includes(option.id) ? '☑' : '☐' }}
              </span>
              <span v-else>
                {{ question.selectedAnswers.includes(option.id) ? '◉' : '○' }}
              </span>
            </span>
            <span class="option-letter">{{ option.id.toUpperCase() }})</span>
            <span class="option-text">{{ option.text }}</span>
          </div>
        </div>

        <div v-if="!question.answered" class="question-actions">
          <button class="btn btn-primary submit-btn" :disabled="question.selectedAnswers.length === 0" @click="submitAnswer(question)">SUBMIT ANSWER</button>
        </div>

        <Transition name="expand">
          <div v-if="question.answered" class="explanation-box" :class="{ correct: question.correct }">
            <div class="explanation-header">
              <span v-if="question.correct" class="explanation-icon correct">✓</span>
              <span v-else class="explanation-icon incorrect">✗</span>
              <span class="explanation-title">{{ question.correct ? 'CORRECT' : 'INCORRECT' }}</span>
            </div>
            <p class="explanation-text">{{ question.explanation }}</p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Success modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 3: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">UNIVERSAL COMPATIBILITY VERIFIED</div>

            <!-- Universal adapter visualization -->
            <div class="adapter-visualization">
              <div class="adapter-title">VASION UNIVERSAL COMPATIBILITY</div>

              <div class="adapter-diagram">
                <div class="adapter-center">
                  <div class="platform-box">
                    <span class="platform-icon">🏢</span>
                    <span class="platform-name">VASION PLATFORM</span>
                  </div>
                </div>

                <div class="adapter-branches">
                  <div class="branch endpoints">
                    <div class="branch-header">ENDPOINTS</div>
                    <div class="branch-items">
                      <span>Windows</span>
                      <span>macOS</span>
                      <span>Linux</span>
                      <span>iOS</span>
                      <span>Android</span>
                      <span>ChromeOS</span>
                      <span>ARM</span>
                      <span>IGEL</span>
                      <span>VDI</span>
                    </div>
                  </div>

                  <div class="branch printers">
                    <div class="branch-header">PRINTERS</div>
                    <div class="branch-items">
                      <span>HP MFDs</span>
                      <span>Canon</span>
                      <span>Ricoh</span>
                      <span>Xerox</span>
                      <span>Konica</span>
                      <span>Label</span>
                      <span>Desktop</span>
                      <span>Legacy</span>
                      <span>IPP/Modern</span>
                    </div>
                  </div>

                  <div class="branch identity">
                    <div class="branch-header">IDENTITY</div>
                    <div class="branch-items">
                      <span>SAML 2.0</span>
                      <span>OIDC</span>
                      <span>SCIM</span>
                      <span>AD</span>
                      <span>Okta</span>
                      <span>Azure AD</span>
                      <span>Google</span>
                      <span>Any IdP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="adapter-tagline">ONE PLATFORM - ANY TECHNOLOGY - UNIFIED EXPERIENCE</div>
            </div>

            <!-- Key learnings -->
            <div class="learnings-section">
              <h3>WHY AGNOSTIC MATTERS:</h3>
              <div class="learnings-grid">
                <div class="learning-item">
                  <span class="learning-icon">🔧</span>
                  <span class="learning-title">NO FORCED STANDARDIZATION</span>
                  <span class="learning-desc">Use the best tech for each department</span>
                </div>
                <div class="learning-item">
                  <span class="learning-icon">💰</span>
                  <span class="learning-title">NO UNNECESSARY REPLACEMENTS</span>
                  <span class="learning-desc">Keep existing infrastructure</span>
                </div>
                <div class="learning-item">
                  <span class="learning-icon">👥</span>
                  <span class="learning-title">UNIFIED USER EXPERIENCE</span>
                  <span class="learning-desc">Same CPA on all MFDs</span>
                </div>
                <div class="learning-item">
                  <span class="learning-icon">🚀</span>
                  <span class="learning-title">FUTURE-PROOF</span>
                  <span class="learning-desc">Legacy + modern protocols</span>
                </div>
              </div>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 4 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level3-puzzle {
  width: 100%;
}

/* Mission briefing */
.mission-briefing {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.briefing-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  font-size: 0.75rem;
}

.location-tag {
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.difficulty-tag {
  color: var(--color-warning);
}

/* Environment scan */
.environment-scan {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(157, 0, 255, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.scan-header {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.scan-results {
  list-style: none;
  font-size: 0.85rem;
}

.scan-results li {
  margin-bottom: var(--space-xs);
  color: var(--color-text-dim);
}

.scan-value {
  color: var(--color-secondary);
  font-weight: bold;
}

.task-description {
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  line-height: 1.7;
}

.highlight {
  color: var(--color-primary);
}

/* Hint section */
.hint-section {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.hint-btn {
  background: transparent;
  border: 1px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hint-btn:hover {
  background: var(--color-secondary-dim);
}

.hint-content {
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-secondary);
}

.hint-label {
  display: block;
  font-size: 0.65rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
}

.hint-content p {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

/* Progress display */
.progress-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.progress-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
}

.progress-correct {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.progress-bar {
  flex: 1;
  min-width: 100px;
  height: 6px;
  background: var(--color-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.5s ease;
}

/* Feedback toast */
.feedback-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.feedback-toast.correct {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.feedback-toast.incorrect {
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  color: var(--color-accent);
}

.feedback-icon {
  font-size: 1.25rem;
}

/* Part sections */
.part-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.part-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.part-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  padding: 2px 8px;
  background: var(--color-secondary-dim);
  border-radius: 2px;
}

.part-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: 0.1em;
  margin: 0;
}

.part-subtitle {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.part-progress {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-primary);
}

.part-instruction {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  margin-bottom: var(--space-md);
}

/* Compatibility grid */
.compatibility-grid {
  display: grid;
  gap: var(--space-sm);
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.compatibility-item {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.compatibility-item:hover {
  border-color: var(--color-primary);
}

.compatibility-item.verified {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.05);
}

.item-main {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.item-icon {
  font-size: 1.5rem;
}

.item-name {
  flex: 1;
  font-size: 0.85rem;
  color: var(--color-text);
}

.item-status {
  font-size: 1.25rem;
}

.status-verified {
  color: var(--color-primary);
}

.status-pending {
  color: var(--color-text-muted);
}

.item-details {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.details-header {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-sm);
}

.details-list {
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.details-list li {
  margin-bottom: 2px;
  padding-left: var(--space-sm);
  position: relative;
}

.details-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.all-verified-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.badge-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.badge-text {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

/* Question sections */
.question-section {
  border-left: 3px solid var(--color-secondary);
}

.question-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.question-text {
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--space-md);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-item:hover:not(.correct):not(.incorrect) {
  border-color: var(--color-primary);
}

.option-item.selected:not(.correct):not(.incorrect) {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.option-item.correct {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.1);
}

.option-item.incorrect {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.1);
}

.option-checkbox {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.option-item.selected .option-checkbox {
  color: var(--color-primary);
}

.option-letter {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 20px;
}

.option-text {
  flex: 1;
  font-size: 0.85rem;
  color: var(--color-text);
}

.question-actions {
  margin-top: var(--space-md);
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: var(--space-sm) var(--space-lg);
}

/* Explanation box */
.explanation-box {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-accent);
}

.explanation-box.correct {
  border-left-color: var(--color-primary);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.explanation-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.explanation-icon.correct {
  color: var(--color-primary);
}

.explanation-icon.incorrect {
  color: var(--color-accent);
}

.explanation-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.explanation-text {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  line-height: 1.6;
  margin: 0;
}

/* Success modal */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: 1000;
  overflow-y: auto;
}

.success-modal {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.success-header {
  padding: var(--space-lg);
  text-align: center;
  background: var(--color-primary-glow);
  border-bottom: 1px solid var(--color-border);
}

.success-header h2 {
  font-size: 1.25rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  margin: 0;
}

.success-content {
  padding: var(--space-lg);
}

.success-message {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
  letter-spacing: 0.1em;
}

/* Adapter visualization */
.adapter-visualization {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.adapter-title {
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
}

.adapter-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.adapter-center {
  display: flex;
  justify-content: center;
}

.platform-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-xl);
  background: var(--color-primary-glow);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.platform-icon {
  font-size: 2rem;
}

.platform-name {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

.adapter-branches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  width: 100%;
}

@media (max-width: 600px) {
  .adapter-branches {
    grid-template-columns: 1fr;
  }
}

.branch {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
}

.branch-header {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-align: center;
  padding-bottom: var(--space-xs);
  margin-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border);
}

.branch.endpoints .branch-header {
  color: #00d9ff;
}

.branch.printers .branch-header {
  color: #00ff41;
}

.branch.identity .branch-header {
  color: #9d00ff;
}

.branch-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.branch-items span {
  font-size: 0.6rem;
  color: var(--color-text-dim);
  background: var(--color-surface-elevated);
  padding: 2px 6px;
  border-radius: 2px;
}

.adapter-tagline {
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  margin-top: var(--space-md);
}

/* Learnings section */
.learnings-section {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.learnings-section h3 {
  font-size: 0.75rem;
  color: var(--color-warning);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: var(--space-md);
}

.learnings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

@media (max-width: 480px) {
  .learnings-grid {
    grid-template-columns: 1fr;
  }
}

.learning-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-sm);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.learning-icon {
  font-size: 1.5rem;
  margin-bottom: var(--space-xs);
}

.learning-title {
  font-family: var(--font-display);
  font-size: 0.6rem;
  color: var(--color-text);
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.learning-desc {
  font-size: 0.6rem;
  color: var(--color-text-muted);
}

.success-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

/* Transitions */
.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .success-modal,
.modal-leave-to .success-modal {
  transform: scale(0.9);
}
</style>

