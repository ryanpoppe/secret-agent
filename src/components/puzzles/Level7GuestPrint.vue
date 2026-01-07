<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Quiz state
interface QuizQuestion {
  id: number
  part: string
  question: string
  options: { id: string; text: string }[]
  correctAnswer: string
  explanation: string
  answered: boolean
  selectedAnswer: string | null
  isCorrect: boolean
}

const questions = ref<QuizQuestion[]>([
  {
    id: 1,
    part: 'A',
    question: 'What is the key benefit of the Web Print interface for guests, contractors, and BYOD users?',
    options: [
      { id: 'a', text: 'Requires installing a desktop client before printing' },
      { id: 'b', text: 'Only works on corporate-managed laptops' },
      { id: 'c', text: 'No software installation required; works from any browser on or off the network' },
      { id: 'd', text: 'Requires a VPN connection to print securely' },
    ],
    correctAnswer: 'c',
    explanation:
      'Web Print is genius in its simplicity: Access via web browser (any device), no software to install, works on-network or off-network, no VPN required, no IT support needed. A guest can use their phone, tablet, or laptop to print—immediately.',
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
  {
    id: 2,
    part: 'A',
    question: 'Can Web Print be used from outside the corporate network?',
    options: [
      { id: 'a', text: 'No, must be on-site' },
      { id: 'b', text: 'Yes, works from anywhere (on or off network)' },
      { id: 'c', text: 'Only with VPN' },
      { id: 'd', text: 'Only from company-provided devices' },
    ],
    correctAnswer: 'b',
    explanation:
      'Web Print works from anywhere because it uses the same secure architecture as remote printing: HTTPS/TLS connection (port 443), Secure Gateway in cloud, Edge Service pulls job. No network access required.',
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
  {
    id: 3,
    part: 'B',
    question: 'How can a user authenticate to the Web Print interface?',
    options: [
      { id: 'a', text: 'Only with a corporate smartcard' },
      { id: 'b', text: 'Only with a local device account' },
      { id: 'c', text: 'Via identity provider (like Okta) OR as a guest with email address' },
      { id: 'd', text: 'With a phone call to IT support' },
    ],
    correctAnswer: 'c',
    explanation:
      'Web Print offers flexible authentication: Identity Provider (Okta, Azure AD) for known users with SSO experience, or Continue as Guest with just an email address for visitors. This flexibility handles both employees working remotely and true guests.',
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
  {
    id: 4,
    part: 'E',
    question:
      'True or False: A guest can upload documents, choose a Pull Printer to hold the job for secure release, and admins control which printers are visible to Web Print users.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      'This is the security model: Guests can upload and submit jobs, jobs are held (not printed immediately), admins control which printers appear in Web Print, guests never get network access, secure perimeter maintained.',
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
  {
    id: 5,
    part: 'E',
    question: 'After submitting a held job, how does the guest user release it at an MFD?',
    options: [
      { id: 'a', text: 'The job auto-prints without user action' },
      { id: 'b', text: "By emailing the printer's inbox" },
      { id: 'c', text: 'By calling the help desk to release the job' },
      { id: 'd', text: "Use the emailed release code at the MFD's Control Panel Application to release the job" },
    ],
    correctAnswer: 'd',
    explanation:
      "The secure release workflow ensures: Job doesn't print automatically (security), guest must be physically present at MFD, release code proves authorization, no help desk interaction needed (self-service).",
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
  {
    id: 6,
    part: 'E',
    question: 'True or False: Web Print supports basic print options like color versus black-and-white and layout selection before printing.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      'Guests get essential print options: Color vs B&W, page range, layout (1-up, 2-up), number of copies. This prevents waste and gives guests control without overwhelming complexity.',
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
  },
])

const currentQuestionIndex = ref(0)

// Workflow sequence state (click-to-order like Level 11)
interface WorkflowStep {
  id: string
  label: string
  description: string
  icon: string
  order: number | null
}

const workflowSteps = ref<WorkflowStep[]>([
  { id: 'a', label: 'Access Web Print Portal', description: 'Guest opens browser to print URL', icon: '🌐', order: null },
  { id: 'b', label: 'Authenticate', description: 'IdP login or continue as guest with email', icon: '🔐', order: null },
  { id: 'c', label: 'Upload Document', description: 'PDF, Word, or other supported format', icon: '📤', order: null },
  { id: 'd', label: 'Select Pull Printer', description: 'Choose printer for secure hold', icon: '🖨️', order: null },
  { id: 'e', label: 'Receive Email', description: 'Get release code and instructions', icon: '📧', order: null },
  { id: 'f', label: 'Go to MFD', description: 'Enter release code on Control Panel App', icon: '🚶', order: null },
  { id: 'g', label: 'Document Prints', description: 'Secure release at MFD', icon: '✅', order: null },
])

const correctWorkflowOrder = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
const currentOrderStep = ref(1)
const workflowVerified = ref(false)
const workflowComplete = ref(false)

const workflowCorrect = computed(() => {
  const userOrder = workflowSteps.value
    .filter((s) => s.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => s.id)
  return JSON.stringify(userOrder) === JSON.stringify(correctWorkflowOrder)
})

const allWorkflowStepsSelected = computed(() => {
  return workflowSteps.value.every((s) => s.order !== null)
})

// Interactive simulation state
type SimPhase = 'portal' | 'email' | 'generate' | 'enter-code' | 'release' | 'complete'
const simPhase = ref<SimPhase>('portal')
const guestEmail = ref('')
const generatedCode = ref('')
const enteredCode = ref('')
const codeError = ref(false)
const printProgress = ref(0)

// Overall state
const phase = ref<'quiz-a' | 'quiz-b' | 'workflow' | 'simulation' | 'quiz-e' | 'success'>('quiz-a')
const showSuccess = ref(false)

// Computed
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] as QuizQuestion)
const correctAnswers = computed(() => questions.value.filter((q) => q.isCorrect).length)
const partAComplete = computed(() => questions.value.filter((q) => q.part === 'A').every((q) => q.answered))
const partBComplete = computed(() => questions.value.filter((q) => q.part === 'B').every((q) => q.answered))
const partEComplete = computed(() => questions.value.filter((q) => q.part === 'E').every((q) => q.answered))

const baseUrl = import.meta.env.BASE_URL

// Quiz methods
function selectAnswer(answerId: string) {
  const q = currentQuestion.value
  if (q.answered) return
  q.selectedAnswer = answerId
}

function submitAnswer() {
  const q = currentQuestion.value
  if (!q.selectedAnswer || q.answered) return

  q.answered = true
  q.isCorrect = q.selectedAnswer === q.correctAnswer
  playSound(q.isCorrect ? 'bling1.mp3' : 'bling1.mp3')
}

function nextQuestion() {
  // Find next unanswered question in current part
  const currentPart = currentQuestion.value.part
  const nextInPart = questions.value.findIndex((q, i) => i > currentQuestionIndex.value && q.part === currentPart && !q.answered)

  if (nextInPart !== -1) {
    currentQuestionIndex.value = nextInPart
  } else {
    // Move to next phase
    if (currentPart === 'A' && partAComplete.value) {
      phase.value = 'quiz-b'
      currentQuestionIndex.value = questions.value.findIndex((q) => q.part === 'B')
    } else if (currentPart === 'B' && partBComplete.value) {
      phase.value = 'workflow'
      initWorkflow()
    } else if (currentPart === 'E' && partEComplete.value) {
      showSuccess.value = true
    }
  }
}

// Workflow methods (click-to-order like Level 11)
function initWorkflow() {
  // Shuffle workflow steps for display
  workflowSteps.value = workflowSteps.value.sort(() => Math.random() - 0.5)
  currentOrderStep.value = 1
  workflowVerified.value = false
}

function selectWorkflowStep(step: WorkflowStep) {
  if (workflowVerified.value) return
  if (step.order !== null) {
    // Remove this step and reorder others
    const removedOrder = step.order
    step.order = null
    workflowSteps.value.forEach((s) => {
      if (s.order !== null && s.order > removedOrder) {
        s.order--
      }
    })
    currentOrderStep.value--
  } else if (currentOrderStep.value <= 7) {
    step.order = currentOrderStep.value
    currentOrderStep.value++
    playSound('bling1.mp3')
  }
}

function verifyWorkflow() {
  workflowVerified.value = true
  workflowComplete.value = true
  playSound('bling1.mp3')

  if (workflowCorrect.value) {
    // Correct - proceed after short delay
    setTimeout(() => {
      phase.value = 'simulation'
    }, 2000)
  }
  // If incorrect, user must click proceed button
}

function proceedAfterIncorrectWorkflow() {
  gameStore.deductPoints(5)
  phase.value = 'simulation'
}

// Simulation methods
function continueAsGuest() {
  if (!guestEmail.value.trim() || !guestEmail.value.includes('@')) return
  simPhase.value = 'email'
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  generatedCode.value = code
  simPhase.value = 'generate'
  playSound('bling1.mp3')
}

function submitCode() {
  if (enteredCode.value.toUpperCase() === generatedCode.value) {
    codeError.value = false
    simPhase.value = 'release'
    playSound('bling1.mp3')
  } else {
    codeError.value = true
    setTimeout(() => (codeError.value = false), 500)
  }
}

function releasePrint() {
  printProgress.value = 0
  const interval = setInterval(() => {
    printProgress.value += 5
    if (printProgress.value >= 100) {
      clearInterval(interval)
      simPhase.value = 'complete'
      playSound('bling1.mp3')

      setTimeout(() => {
        phase.value = 'quiz-e'
        currentQuestionIndex.value = questions.value.findIndex((q) => q.part === 'E')
      }, 2000)
    }
  }, 100)
}

function playSound(filename: string) {
  try {
    const audio = new Audio(`${baseUrl}sounds/${filename}`)
    audio.volume = 0.4
    audio.play().catch(() => {})
  } catch {
    // Audio not available
  }
}

function proceed() {
  // Report score to game store
  gameStore.setLevelCorrectAnswers(7, correctAnswers.value)
  gameStore.completeLevel(7)
  router.push({ name: 'level', params: { id: '8' } })
}
</script>

<template>
  <div class="level7-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Visitor Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="scenario-box">
        <div class="scenario-header">SCENARIO: Guest Contractor Visit</div>
        <div class="scenario-content">
          <div class="guest-info">
            <p><strong>Name:</strong> Marcus Rivera</p>
            <p><strong>Company:</strong> BuildTech Construction</p>
            <p><strong>Purpose:</strong> Final project presentation</p>
            <p><strong>Need:</strong> Print 20-page presentation</p>
          </div>
          <div class="security-reqs">
            <div class="req-item bad">❌ Cannot grant network access</div>
            <div class="req-item bad">❌ Cannot provide login credentials</div>
            <div class="req-item bad">❌ Cannot expose internal systems</div>
            <div class="req-item good">✓ Must enable printing capability</div>
            <div class="req-item good">✓ Must maintain security perimeter</div>
          </div>
        </div>
        <p class="mission-task">Your mission: Deploy <strong>Web Print</strong> for secure guest printing without compromising the network.</p>
      </div>
    </div>

    <!-- Score display -->
    <div class="score-display">
      <span class="score-label">SCORE:</span>
      <span class="score-value">{{ correctAnswers }}/{{ questions.length }}</span>
    </div>

    <!-- Quiz Section (Parts A, B, E) -->
    <div v-if="phase === 'quiz-a' || phase === 'quiz-b' || phase === 'quiz-e'" class="quiz-section">
      <div class="part-header">
        <span class="part-label">PART {{ currentQuestion.part }}</span>
        <h3 class="part-title">
          {{ currentQuestion.part === 'A' ? 'WEB PRINT FUNDAMENTALS' : currentQuestion.part === 'B' ? 'AUTHENTICATION OPTIONS' : 'SECURITY VERIFICATION' }}
        </h3>
      </div>

      <div class="question-card">
        <div class="question-number">QUESTION {{ currentQuestion.id }}</div>
        <p class="question-text">{{ currentQuestion.question }}</p>

        <div class="options-list">
          <button
            v-for="option in currentQuestion.options"
            :key="option.id"
            class="option-btn"
            :class="{
              selected: currentQuestion.selectedAnswer === option.id,
              correct: currentQuestion.answered && option.id === currentQuestion.correctAnswer,
              incorrect: currentQuestion.answered && currentQuestion.selectedAnswer === option.id && option.id !== currentQuestion.correctAnswer,
            }"
            :disabled="currentQuestion.answered"
            @click="selectAnswer(option.id)"
          >
            <span class="option-letter">{{ option.id.toUpperCase() }})</span>
            <span class="option-text">{{ option.text }}</span>
            <span v-if="currentQuestion.answered && option.id === currentQuestion.correctAnswer" class="option-check">✓</span>
          </button>
        </div>

        <button v-if="!currentQuestion.answered" class="btn btn-primary submit-btn" :disabled="!currentQuestion.selectedAnswer" @click="submitAnswer">
          SUBMIT ANSWER
        </button>

        <!-- Answer feedback -->
        <div v-if="currentQuestion.answered" class="answer-feedback" :class="{ correct: currentQuestion.isCorrect }">
          <div class="feedback-header">
            <span v-if="currentQuestion.isCorrect" class="feedback-icon">✓</span>
            <span v-else class="feedback-icon">✗</span>
            <span class="feedback-text">{{ currentQuestion.isCorrect ? 'CORRECT!' : 'INCORRECT' }}</span>
          </div>
          <div class="feedback-explanation">
            <strong>EXPLANATION:</strong>
            <p>{{ currentQuestion.explanation }}</p>
          </div>
          <button class="btn btn-primary next-btn" @click="nextQuestion">CONTINUE →</button>
        </div>
      </div>
    </div>

    <!-- Workflow Section (Part C) -->
    <div v-else-if="phase === 'workflow'" class="workflow-section">
      <div class="part-header">
        <span class="part-label">PART C</span>
        <h3 class="part-title">GUEST PRINTING WORKFLOW</h3>
      </div>

      <p class="workflow-instruction">Click steps in the correct order (1-7) to build the secure guest printing workflow:</p>

      <!-- Workflow components (click-to-order like Level 11) -->
      <div class="workflow-components">
        <div
          v-for="step in workflowSteps"
          :key="step.id"
          class="workflow-component"
          :class="{ 
            selected: step.order !== null, 
            verified: workflowVerified, 
            correct: workflowVerified && correctWorkflowOrder.indexOf(step.id) + 1 === step.order, 
            incorrect: workflowVerified && step.order !== null && correctWorkflowOrder.indexOf(step.id) + 1 !== step.order 
          }"
          @click="selectWorkflowStep(step)"
        >
          <div class="comp-order" v-if="step.order">{{ step.order }}</div>
          <div class="comp-icon">{{ step.icon }}</div>
          <div class="comp-label">{{ step.label }}</div>
          <div class="comp-desc">{{ step.description }}</div>
        </div>
      </div>

      <!-- Result after verification -->
      <div v-if="workflowVerified" class="workflow-result" :class="{ correct: workflowCorrect }">
        <div class="result-header">
          <span class="result-icon">{{ workflowCorrect ? '✓' : '✗' }}</span>
          <span class="result-text">{{ workflowCorrect ? 'CORRECT SEQUENCE!' : 'INCORRECT SEQUENCE (-5 points)' }}</span>
        </div>
        <div class="correct-sequence">
          <p><strong>Correct flow:</strong></p>
          <div class="sequence-flow">
            <span class="seq-item">🌐 Access Portal</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🔐 Authenticate</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">📤 Upload</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🖨️ Select Printer</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">📧 Get Email</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🚶 Go to MFD</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">✅ Print</span>
          </div>
        </div>
        <button v-if="!workflowCorrect" class="btn btn-primary" @click="proceedAfterIncorrectWorkflow">
          PROCEED →
        </button>
      </div>

      <!-- Verify button -->
      <button 
        v-if="!workflowVerified" 
        class="btn btn-primary check-btn" 
        :disabled="!allWorkflowStepsSelected" 
        @click="verifyWorkflow"
      >
        VERIFY SEQUENCE →
      </button>
    </div>

    <!-- Interactive Simulation (Part D) -->
    <div v-else-if="phase === 'simulation'" class="simulation-section">
      <div class="part-header">
        <span class="part-label">PART D</span>
        <h3 class="part-title">INTERACTIVE SIMULATION</h3>
      </div>

      <!-- Web Portal -->
      <div class="sim-screen">
        <!-- Portal Login -->
        <div v-if="simPhase === 'portal'" class="portal-screen">
          <div class="portal-header">
            <span class="portal-logo">APEX INDUSTRIES</span>
            <span class="portal-title">Web Print</span>
          </div>
          <p class="portal-tagline">Print from any device, anywhere, anytime</p>

          <div class="portal-options">
            <button class="portal-btn disabled">Sign in with Okta</button>
            <button class="portal-btn guest-btn" @click="simPhase = 'email' as SimPhase">Continue as Guest ←</button>
          </div>
        </div>

        <!-- Guest Email Entry -->
        <div v-if="simPhase === 'email'" class="email-screen">
          <div class="email-header">GUEST WEB PRINT</div>
          <p class="email-instruction">To receive your print release code, please enter your email address:</p>

          <input v-model="guestEmail" type="email" class="email-input" placeholder="marcus.rivera@buildtech.com" />

          <button class="btn btn-primary" :disabled="!guestEmail.includes('@')" @click="continueAsGuest">CONTINUE</button>

          <p class="email-note">Your email will only be used to send the print release code.</p>
        </div>

        <!-- Email Preview & Code Generation -->
        <div v-if="simPhase === 'generate' || (simPhase === 'email' && guestEmail)" class="upload-screen">
          <div v-if="simPhase !== 'generate'" class="upload-section">
            <div class="upload-header">Welcome, {{ guestEmail.split('@')[0] }}</div>
            <p>Upload Your Document:</p>

            <div class="upload-area" @click="generateCode">
              <span class="upload-icon">📤</span>
              <span class="upload-text">Click to simulate uploading<br />Project_Presentation.pdf</span>
            </div>
          </div>

          <div v-else class="code-generated">
            <div class="code-header">✓ PRINT JOB SUBMITTED</div>

            <div class="job-summary">
              <p>Document: Project_Presentation.pdf</p>
              <p>Printer: Visitor-Center-Lobby</p>
              <p>Pages: 20 (color)</p>
            </div>

            <div class="email-preview">
              <div class="email-preview-header">📧 EMAIL SENT</div>
              <div class="email-content">
                <p>Your release code:</p>
                <div class="release-code">{{ generatedCode }}</div>
                <p class="code-info">Valid for 24 hours • One-time use</p>
              </div>
            </div>

            <button class="btn btn-primary" @click="simPhase = 'enter-code' as SimPhase">PROCEED TO MFD →</button>
          </div>
        </div>

        <!-- Code Entry -->
        <div v-if="simPhase === 'enter-code'" class="code-entry-screen">
          <div class="mfd-header">VASION CONTROL PANEL APP</div>
          <p class="code-instruction">Enter your release code:</p>

          <input
            v-model="enteredCode"
            type="text"
            class="code-input"
            :class="{ error: codeError }"
            placeholder="XXX-XXX"
            maxlength="7"
            @keyup.enter="submitCode"
          />

          <p class="code-hint">Your code: {{ generatedCode }}</p>

          <button class="btn btn-primary" :disabled="enteredCode.length < 7" @click="submitCode">SUBMIT CODE</button>
        </div>

        <!-- Release & Print -->
        <div v-if="simPhase === 'release'" class="release-screen">
          <div class="mfd-header">✓ RELEASE CODE VERIFIED</div>

          <div class="job-ready">
            <p>Code: {{ generatedCode }}</p>
            <p>Guest: {{ guestEmail }}</p>
            <div class="doc-info">
              <span class="doc-icon">📄</span>
              <span>Project_Presentation.pdf</span>
            </div>
            <p class="doc-meta">Pages: 20 | Color | 8.2 MB</p>
          </div>

          <button class="btn btn-primary print-btn" @click="releasePrint">PRINT NOW</button>
        </div>

        <!-- Print Complete -->
        <div v-if="simPhase === 'complete'" class="complete-screen">
          <div class="print-header">🖨️ PRINTING COMPLETE</div>

          <div class="print-progress-bar">
            <div class="progress-fill" :style="{ width: '100%' }"></div>
          </div>

          <div class="print-details">
            <p>✓ Project_Presentation.pdf printed successfully</p>
            <p>✓ Code {{ generatedCode }} has been deactivated</p>
            <p class="retrieve-msg">Please retrieve your document from the output tray</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 7: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">GUEST PRINTING SECURED</div>

            <div class="final-score">
              <span class="score-label">FINAL SCORE:</span>
              <span class="score-value">{{ correctAnswers }}/{{ questions.length }}</span>
            </div>

            <div class="success-checklist">
              <div class="check-item">✓ Understood Web Print benefits (no install, anywhere)</div>
              <div class="check-item">✓ Configured flexible authentication (IdP or guest)</div>
              <div class="check-item">✓ Built secure guest workflow (7 steps)</div>
              <div class="check-item">✓ Generated and verified release codes</div>
              <div class="check-item">✓ Maintained security perimeter</div>
            </div>

            <div class="comparison-section">
              <div class="compare-col before">
                <h4>❌ BEFORE (Insecure Options)</h4>
                <ul>
                  <li>Grant network access (security risk)</li>
                  <li>Email to employee (inefficient)</li>
                  <li>USB drive sneakernet (malware risk)</li>
                </ul>
              </div>
              <div class="compare-col after">
                <h4>✓ AFTER (Web Print)</h4>
                <ul>
                  <li>No network access granted</li>
                  <li>No software installation</li>
                  <li>Works from any device/browser</li>
                  <li>Secure release with one-time codes</li>
                  <li>Self-service (no IT support)</li>
                </ul>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>Web Print requires NO software installation and works from any browser</li>
                <li>Authentication: Identity provider (SSO) OR guest with email</li>
                <li>Workflow: Portal → Auth → Upload → Select printer → Email → Code at MFD → Print</li>
                <li>Release codes are one-time use, expire after 24hrs</li>
                <li>Admins control which printers are visible to Web Print users</li>
              </ul>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 8 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level7-puzzle {
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

.scenario-box {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.scenario-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
}

.scenario-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.guest-info p {
  font-size: 0.8rem;
  color: var(--color-text);
  margin: var(--space-xs) 0;
}

.security-reqs {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.req-item {
  font-size: 0.75rem;
}

.req-item.bad {
  color: var(--color-accent);
}

.req-item.good {
  color: var(--color-primary);
}

.mission-task {
  color: var(--color-primary);
  font-size: 0.9rem;
  margin: 0;
}

/* Score display */
.score-display {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.score-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.score-value {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
}

/* Part headers */
.part-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.part-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-secondary);
  padding: 2px 8px;
  background: var(--color-secondary-dim);
  border-radius: 2px;
}

.part-title {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
}

/* Quiz section */
.quiz-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.question-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.question-number {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-sm);
}

.question-text {
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.option-btn {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.option-btn:hover:not(:disabled) {
  border-color: var(--color-text-dim);
}

.option-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.option-btn.correct {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.2);
}

.option-btn.incorrect {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
}

.option-btn:disabled {
  cursor: default;
}

.option-letter {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  min-width: 24px;
}

.option-text {
  flex: 1;
  font-size: 0.9rem;
}

.option-check {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.submit-btn {
  width: 100%;
}

/* Answer feedback */
.answer-feedback {
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
}

.answer-feedback.correct {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--color-primary);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.feedback-icon {
  font-size: 1.5rem;
}

.answer-feedback.correct .feedback-icon {
  color: var(--color-primary);
}

.answer-feedback:not(.correct) .feedback-icon {
  color: var(--color-accent);
}

.feedback-text {
  font-family: var(--font-display);
  font-size: 1rem;
}

.answer-feedback.correct .feedback-text {
  color: var(--color-primary);
}

.answer-feedback:not(.correct) .feedback-text {
  color: var(--color-accent);
}

.feedback-explanation {
  margin-bottom: var(--space-lg);
}

.feedback-explanation strong {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.feedback-explanation p {
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.5;
}

.next-btn {
  width: 100%;
}

/* Workflow section */
.workflow-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.workflow-instruction {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
}

/* Workflow components (click-to-order like Level 11) */
.workflow-components {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.workflow-component {
  background: var(--color-surface-elevated);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.workflow-component:hover:not(.verified) {
  border-color: var(--color-primary);
}

.workflow-component.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.workflow-component.verified.correct {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.2);
}

.workflow-component.verified.incorrect {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
}

.workflow-component .comp-order {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-background);
}

.workflow-component .comp-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.workflow-component .comp-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.workflow-component .comp-desc {
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.check-btn {
  width: 100%;
}

.workflow-result {
  padding: var(--space-lg);
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  text-align: center;
  margin-bottom: var(--space-lg);
}

.workflow-result.correct {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--color-primary);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.result-icon {
  font-size: 1.5rem;
}

.result-text {
  font-family: var(--font-display);
  font-size: 1rem;
}

.workflow-result.correct .result-icon,
.workflow-result.correct .result-text {
  color: var(--color-primary);
}

.workflow-result:not(.correct) .result-icon,
.workflow-result:not(.correct) .result-text {
  color: var(--color-accent);
}

.correct-sequence {
  margin-bottom: var(--space-lg);
}

.correct-sequence p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.sequence-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-xs);
  justify-content: center;
}

.seq-item {
  font-size: 0.7rem;
  color: var(--color-text);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.seq-arrow {
  color: var(--color-primary);
  font-size: 0.8rem;
}

/* Simulation section */
.simulation-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.sim-screen {
  max-width: 450px;
  margin: 0 auto;
  background: linear-gradient(180deg, #0d1117, #161b22);
  border: 2px solid #333;
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
}

/* Portal screen */
.portal-header {
  margin-bottom: var(--space-md);
}

.portal-logo {
  display: block;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  letter-spacing: 0.2em;
}

.portal-title {
  display: block;
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-primary);
}

.portal-tagline {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-xl);
}

.portal-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.portal-btn {
  padding: var(--space-md);
  font-size: 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
}

.portal-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.portal-btn.guest-btn {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.portal-btn.guest-btn:hover {
  background: var(--color-primary-glow);
}

/* Email screen */
.email-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.email-instruction {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-lg);
}

.email-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
  margin-bottom: var(--space-md);
  text-align: center;
}

.email-note {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: var(--space-md);
}

/* Upload screen */
.upload-header {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  cursor: pointer;
  margin-bottom: var(--space-md);
  transition: all var(--transition-fast);
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.upload-icon {
  display: block;
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.upload-text {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

/* Code generated */
.code-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.job-summary {
  background: var(--color-surface);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
}

.job-summary p {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin: var(--space-xs) 0;
}

.email-preview {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.email-preview-header {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: #333;
  margin-bottom: var(--space-sm);
}

.email-content {
  color: #333;
}

.email-content p {
  font-size: 0.8rem;
  margin: var(--space-xs) 0;
}

.release-code {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
  background: var(--color-primary-glow);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin: var(--space-md) 0;
}

.code-info {
  font-size: 0.7rem;
  color: #666;
}

/* Code entry */
.mfd-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.code-instruction {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
}

.code-input {
  width: 100%;
  padding: var(--space-lg);
  font-family: var(--font-display);
  font-size: 1.5rem;
  text-align: center;
  text-transform: uppercase;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.code-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.code-input.error {
  border-color: var(--color-accent);
  animation: shake 0.5s ease;
}

.code-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
}

/* Release screen */
.job-ready {
  background: var(--color-surface);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
}

.job-ready p {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin: var(--space-xs) 0;
}

.doc-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
}

.doc-icon {
  font-size: 1.5rem;
}

.doc-meta {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* Complete screen */
.print-header {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
}

.print-progress-bar {
  height: 8px;
  background: var(--color-surface);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.print-details p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin: var(--space-sm) 0;
}

.retrieve-msg {
  color: var(--color-primary) !important;
  font-weight: 500;
  margin-top: var(--space-md) !important;
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
  max-width: 650px;
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
  margin-bottom: var(--space-md);
}

.final-score {
  text-align: center;
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

.final-score .score-label {
  display: block;
  font-size: 0.75rem;
  margin-bottom: var(--space-xs);
}

.final-score .score-value {
  font-size: 2rem;
}

.success-checklist {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.check-item {
  color: var(--color-primary);
  font-size: 0.85rem;
  padding: var(--space-xs) 0;
}

.comparison-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.compare-col {
  padding: var(--space-md);
  border-radius: var(--radius-sm);
}

.compare-col.before {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.compare-col.after {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.compare-col h4 {
  font-size: 0.7rem;
  margin-bottom: var(--space-sm);
}

.compare-col.before h4 {
  color: var(--color-accent);
}

.compare-col.after h4 {
  color: var(--color-primary);
}

.compare-col ul {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.compare-col li {
  margin-bottom: 2px;
}

.learnings-box {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.learnings-box h4 {
  font-size: 0.75rem;
  color: var(--color-warning);
  margin-bottom: var(--space-sm);
}

.learnings-box ul {
  list-style: none;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.learnings-box li {
  margin-bottom: var(--space-xs);
}

.success-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@media (max-width: 600px) {
  .scenario-content {
    grid-template-columns: 1fr;
  }

  .comparison-section {
    grid-template-columns: 1fr;
  }

  .workflow-components {
    grid-template-columns: 1fr;
  }

  .sequence-flow {
    flex-direction: column;
    align-items: center;
  }

  .seq-arrow {
    transform: rotate(90deg);
  }
}
</style>

