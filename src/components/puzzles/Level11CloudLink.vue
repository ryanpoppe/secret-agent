<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Overall state
const phase = ref<'architecture' | 'api' | 'edge' | 'trueFalse' | 'animation' | 'complete'>('architecture')
const score = ref(0)
const totalQuestions = ref(7)
const showSuccess = ref(false)

// Part A: Architecture Builder
interface ArchStep {
  id: string
  label: string
  description: string
  icon: string
  order: number | null
}

const archSteps = ref<ArchStep[]>([
  { id: 'cloud-ehr', label: 'Cloud EHR/ERP', description: 'Epic Cloud, SAP Cloud, Workday, etc.', icon: '☁️', order: null },
  { id: 'api-link', label: 'API Cloud Link', description: "Vasion's API endpoint", icon: '🔗', order: null },
  { id: 'gateway', label: 'Secure Gateway', description: 'Cloud-hosted secure storage', icon: '🔐', order: null },
  { id: 'edge', label: 'Edge Service', description: 'Pulls jobs from gateway', icon: '📡', order: null },
  { id: 'printer', label: 'Local Printer', description: 'On-premise in clinic/office', icon: '🖨️', order: null },
])

const currentOrderStep = ref(1)
const archComplete = ref(false)
const archVerified = ref(false)

const correctOrder = ['cloud-ehr', 'api-link', 'gateway', 'edge', 'printer']

const archCorrect = computed(() => {
  const userOrder = archSteps.value
    .filter((s) => s.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => s.id)
  return JSON.stringify(userOrder) === JSON.stringify(correctOrder)
})

// Part B: API Payload
interface ApiParam {
  id: string
  name: string
  value: string | null
  options: { id: string; text: string }[]
  correctAnswer: string
  explanation: string
  answered: boolean
}

const apiParams = ref<ApiParam[]>([
  {
    id: 'printer',
    name: 'printer',
    value: null,
    options: [
      { id: 'a', text: '"192.168.1.50" (IP address)' },
      { id: 'b', text: '"HP-Floor2-Printer01" (Printer name)' },
      { id: 'c', text: '"LPT1" (Legacy port)' },
      { id: 'd', text: '"Cloud-Printer"' },
    ],
    correctAnswer: 'b',
    explanation: 'The API specifies the Vasion-managed printer name. The Edge Service knows how to route to this printer on the local network.',
    answered: false,
  },
  {
    id: 'gateway',
    name: 'gateway',
    value: null,
    options: [
      { id: 'a', text: '"localhost"' },
      { id: 'b', text: '"apex.com"' },
      { id: 'c', text: '"secure.vasion.cloud"' },
      { id: 'd', text: '"10.0.0.1"' },
    ],
    correctAnswer: 'c',
    explanation: "The Secure Gateway is Vasion's cloud infrastructure that securely holds jobs until the Edge Service pulls them.",
    answered: false,
  },
  {
    id: 'auth',
    name: 'auth',
    value: null,
    options: [
      { id: 'a', text: '"Basic Auth" (username/password)' },
      { id: 'b', text: '"Bearer token" (JWT/API key)' },
      { id: 'c', text: '"No authentication"' },
      { id: 'd', text: '"Cookie-based session"' },
    ],
    correctAnswer: 'b',
    explanation: 'API authentication uses Bearer tokens (JWT) for secure, stateless authentication. The token is included in the Authorization header.',
    answered: false,
  },
])

const currentApiIndex = ref(0)
const currentApiParam = computed(() => apiParams.value[currentApiIndex.value] || null)
const apiComplete = ref(false)

// Part C & D: Quiz Questions
interface Question {
  id: string
  part: string
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
  explanation: string
  userAnswer: string | null
  answered: boolean
}

const questions = ref<Question[]>([
  {
    id: 'edge-location',
    part: 'C',
    text: 'Where can the Edge Service be hosted?',
    options: [
      { id: 'a', text: 'On-premise server (VM or physical)' },
      { id: 'b', text: 'Virtual machine in data center' },
      { id: 'c', text: 'Embedded in printer as Control Panel Application (CPA)' },
      { id: 'd', text: 'All of the above' },
    ],
    correctAnswer: 'd',
    explanation:
      'Edge Service can be deployed on-premise, in a VM, OR embedded in the printer CPA. The CPA option is best—zero additional infrastructure needed!',
    userAnswer: null,
    answered: false,
  },
  {
    id: 'cpa-benefit',
    part: 'C',
    text: 'When the Edge Service is embedded in the printer CPA, which statement is TRUE?',
    options: [
      { id: 'a', text: 'It still requires a separate server' },
      { id: 'b', text: 'It eliminates the need for additional infrastructure' },
      { id: 'c', text: 'It only works with HP printers' },
      { id: 'd', text: 'It requires local IT to manage' },
    ],
    correctAnswer: 'b',
    explanation:
      'When embedded in printer CPA: Zero infrastructure (no server needed), works with any MFD manufacturer, cloud-managed with automatic updates.',
    userAnswer: null,
    answered: false,
  },
  {
    id: 'no-vpn',
    part: 'D',
    text: 'True or False: Cloud ERP/EHR can print to local printers without VPN.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      'Cloud app sends job to Vasion API (outbound HTTPS). Edge Service pulls job (outbound connection). No inbound connections needed = No VPN, no firewall changes!',
    userAnswer: null,
    answered: false,
  },
  {
    id: 'zero-infra',
    part: 'D',
    text: 'True or False: API Cloud Link requires additional customer infrastructure (beyond the Edge Service which can embed in printer).',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'When Edge Service embeds in printer CPA: ZERO infrastructure. Cloud-to-cloud communication (app → Vasion API), printer pulls jobs. No VPN, no firewall rules, no servers.',
    userAnswer: null,
    answered: false,
  },
])

const currentQuestionIndex = ref(0)
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)
const quizComplete = ref(false)

// Part E: Animation
interface AnimStep {
  id: number
  title: string
  description: string
  icon: string
  progress: number
  complete: boolean
}

const animSteps = ref<AnimStep[]>([
  { id: 1, title: 'Epic Cloud generates patient discharge summary', description: '📄 Patient_Discharge_Summary_47291.pdf created', icon: '☁️', progress: 0, complete: false },
  { id: 2, title: 'Epic sends API request to Vasion', description: '🔐 HTTPS POST to api.vasion.cloud', icon: '📤', progress: 0, complete: false },
  { id: 3, title: 'API Cloud Link receives job', description: '✓ Job validated, encrypted, stored in Secure Gateway', icon: '🔗', progress: 0, complete: false },
  { id: 4, title: 'Edge Service polls Secure Gateway', description: '🔍 Found 1 job for HP-Floor2-Printer01', icon: '📡', progress: 0, complete: false },
  { id: 5, title: 'Edge Service decrypts and routes', description: '🔓 Routing to HP-Floor2-Printer01', icon: '🔄', progress: 0, complete: false },
  { id: 6, title: 'Printer receives and prints', description: '🖨️ Printing pages 1-4...', icon: '🖨️', progress: 0, complete: false },
])

const animationStarted = ref(false)
const animationComplete = ref(false)

const baseUrl = import.meta.env.BASE_URL

// Part A methods
function selectStep(step: ArchStep) {
  if (archVerified.value) return
  if (step.order !== null) {
    // Remove this step and reorder others
    const removedOrder = step.order
    step.order = null
    archSteps.value.forEach((s) => {
      if (s.order !== null && s.order > removedOrder) {
        s.order--
      }
    })
    currentOrderStep.value--
  } else if (currentOrderStep.value <= 5) {
    step.order = currentOrderStep.value
    currentOrderStep.value++
    playSound('bling1.mp3')
  }
}

function verifyArchitecture() {
  archVerified.value = true
  archComplete.value = true
  if (archCorrect.value) {
    score.value++
  }
  playSound('bling1.mp3')
}

function proceedToApi() {
  phase.value = 'api'
}

// Part B methods
function selectApiAnswer(answer: string) {
  if (!currentApiParam.value || currentApiParam.value.answered) return
  currentApiParam.value.value = answer
}

function submitApiAnswer() {
  if (!currentApiParam.value || !currentApiParam.value.value) return
  currentApiParam.value.answered = true
  if (currentApiParam.value.value === currentApiParam.value.correctAnswer) {
    score.value++
  }
  playSound('bling1.mp3')
}

function nextApiParam() {
  if (currentApiIndex.value < apiParams.value.length - 1) {
    currentApiIndex.value++
  } else {
    apiComplete.value = true
    phase.value = 'edge'
  }
}

// Part C & D methods
function selectAnswer(answer: string) {
  if (!currentQuestion.value || currentQuestion.value.answered) return
  currentQuestion.value.userAnswer = answer
}

function submitAnswer() {
  if (!currentQuestion.value || !currentQuestion.value.userAnswer) return
  currentQuestion.value.answered = true
  if (currentQuestion.value.userAnswer === currentQuestion.value.correctAnswer) {
    score.value++
  }
  playSound('bling1.mp3')
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    // Check if switching parts
    const nextQ = questions.value[currentQuestionIndex.value]
    if (nextQ && nextQ.part === 'D' && currentQuestion.value?.part === 'C') {
      phase.value = 'trueFalse'
    }
  } else {
    quizComplete.value = true
    phase.value = 'animation'
  }
}

// Part E methods
function startAnimation() {
  animationStarted.value = true
  let stepIndex = 0

  const animateStep = () => {
    if (stepIndex >= animSteps.value.length) {
      setTimeout(() => {
        animationComplete.value = true
        phase.value = 'complete'
        setTimeout(() => {
          showSuccess.value = true
        }, 1000)
      }, 500)
      return
    }

    const step = animSteps.value[stepIndex]
    if (!step) return

    const progressInterval = setInterval(() => {
      step.progress += 5
      if (step.progress >= 100) {
        step.complete = true
        clearInterval(progressInterval)
        stepIndex++
        setTimeout(animateStep, 300)
      }
    }, 50)
  }

  animateStep()
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
  // Report final score to game store
  gameStore.setLevelCorrectAnswers(11, score.value)
  gameStore.completeLevel(11)
  // Go to bonus level 12 instead of debrief
  router.push({ name: 'level', params: { id: '12' } })
}

onMounted(() => {
  // Shuffle arch steps for initial display
  archSteps.value = archSteps.value.sort(() => Math.random() - 0.5)
})
</script>

<template>
  <div class="level11-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Cloud Operations Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐⭐ Advanced</span>
      </div>

      <div class="narrative-box">
        <p><strong>FINAL OBJECTIVE</strong> - Apex is migrating Epic EHR to <strong>Epic Cloud</strong> (SaaS). But printers are still on-premise.</p>
        <p><strong>THE PROBLEM:</strong> Cloud EHR cannot directly reach on-premise printers (firewall/NAT). Traditional solutions require complex VPN tunnels.</p>
        <p class="mission-task"><strong>THE SOLUTION:</strong> API Cloud Link enables cloud-to-local printing. No VPN. No firewall changes. No infrastructure.</p>
      </div>

      <div class="score-display">
        Score: {{ score }}/{{ totalQuestions }}
      </div>
    </div>

    <!-- Part A: Build Architecture -->
    <div v-if="phase === 'architecture'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">BUILD THE CLOUD ARCHITECTURE</h3>
      </div>

      <p class="instruction">Click components in the correct order (1-5) to build the cloud printing flow:</p>

      <div class="arch-components">
        <div
          v-for="step in archSteps"
          :key="step.id"
          class="arch-component"
          :class="{ selected: step.order !== null, verified: archVerified, correct: archVerified && correctOrder.indexOf(step.id) + 1 === step.order, incorrect: archVerified && step.order !== null && correctOrder.indexOf(step.id) + 1 !== step.order }"
          @click="selectStep(step)"
        >
          <div class="comp-order" v-if="step.order">{{ step.order }}</div>
          <div class="comp-icon">{{ step.icon }}</div>
          <div class="comp-label">{{ step.label }}</div>
          <div class="comp-desc">{{ step.description }}</div>
        </div>
      </div>

      <div v-if="archVerified" class="arch-result">
        <div class="result-header" :class="{ correct: archCorrect }">
          {{ archCorrect ? '✓ CORRECT SEQUENCE!' : '✗ INCORRECT SEQUENCE' }}
        </div>
        <div class="correct-sequence">
          <p><strong>Correct flow:</strong></p>
          <div class="sequence-flow">
            <span class="seq-item">☁️ Cloud EHR/ERP</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🔗 API Cloud Link</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🔐 Secure Gateway</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">📡 Edge Service</span>
            <span class="seq-arrow">→</span>
            <span class="seq-item">🖨️ Local Printer</span>
          </div>
        </div>
        <button class="btn btn-primary" @click="proceedToApi">CONTINUE TO PART B →</button>
      </div>

      <button v-else class="btn btn-primary" :disabled="currentOrderStep <= 5" @click="verifyArchitecture">
        VERIFY SEQUENCE →
      </button>
    </div>

    <!-- Part B: API Payload -->
    <div v-if="phase === 'api'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART B</span>
        <h3 class="part-title">API PAYLOAD DECRYPTION</h3>
        <span class="progress-indicator">{{ currentApiIndex + 1 }}/{{ apiParams.length }}</span>
      </div>

      <div class="api-intercept">
        <div class="intercept-header">🔐 ENCRYPTED API TRANSMISSION</div>
        <p>Intercepting API call from Epic Cloud...</p>
      </div>

      <div class="api-payload">
        <pre class="payload-code"><code>POST https://api.vasion.com/v1/print
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1...

{
  "document": "Patient_Discharge_Summary_47291.pdf",
  "document_base64": "JVBERi0xLjQKJeLjz9...",
  "printer": "<span :class="{ filled: apiParams[0]?.answered }">{{ apiParams[0]?.answered ? (apiParams[0]?.value === 'b' ? 'HP-Floor2-Printer01' : '???') : '________' }}</span>",
  "location": "Apex-Clinic-Building-A",
  "gateway": "<span :class="{ filled: apiParams[1]?.answered }">{{ apiParams[1]?.answered ? (apiParams[1]?.value === 'c' ? 'secure.vasion.cloud' : '???') : '________' }}</span>",
  "auth": "<span :class="{ filled: apiParams[2]?.answered }">{{ apiParams[2]?.answered ? (apiParams[2]?.value === 'b' ? 'Bearer token' : '???') : '________' }}</span>",
  "options": { "copies": 1, "color": false, "duplex": true }
}</code></pre>
      </div>

      <div v-if="currentApiParam && !apiComplete" class="param-question">
        <div class="param-header">Parameter: "{{ currentApiParam.name }}"</div>
        <p class="param-prompt">What should this be set to?</p>

        <div class="options-list">
          <button
            v-for="opt in currentApiParam.options"
            :key="opt.id"
            class="option-btn"
            :class="{
              selected: currentApiParam.value === opt.id,
              correct: currentApiParam.answered && opt.id === currentApiParam.correctAnswer,
              incorrect: currentApiParam.answered && currentApiParam.value === opt.id && opt.id !== currentApiParam.correctAnswer
            }"
            :disabled="currentApiParam.answered"
            @click="selectApiAnswer(opt.id)"
          >
            {{ opt.text }}
          </button>
        </div>

        <button v-if="!currentApiParam.answered" class="btn btn-primary" :disabled="!currentApiParam.value" @click="submitApiAnswer">
          SUBMIT
        </button>

        <div v-if="currentApiParam.answered" class="answer-feedback" :class="{ correct: currentApiParam.value === currentApiParam.correctAnswer }">
          <div class="feedback-header">
            {{ currentApiParam.value === currentApiParam.correctAnswer ? '✓ CORRECT!' : '✗ INCORRECT' }}
          </div>
          <p>{{ currentApiParam.explanation }}</p>
          <button class="btn btn-primary" @click="nextApiParam">
            {{ currentApiIndex < apiParams.length - 1 ? 'NEXT PARAMETER →' : 'CONTINUE TO PART C →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Part C & D: Quiz Questions -->
    <div v-if="phase === 'edge' || phase === 'trueFalse'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART {{ currentQuestion?.part }}</span>
        <h3 class="part-title">{{ phase === 'edge' ? 'EDGE SERVICE DEPLOYMENT' : 'TRUE/FALSE VERIFICATION' }}</h3>
      </div>

      <div v-if="currentQuestion" class="question-card">
        <p class="question-text">{{ currentQuestion.text }}</p>

        <div class="options-list" :class="{ 'tf-options': phase === 'trueFalse' }">
          <button
            v-for="opt in currentQuestion.options"
            :key="opt.id"
            class="option-btn"
            :class="{
              selected: currentQuestion.userAnswer === opt.id,
              correct: currentQuestion.answered && opt.id === currentQuestion.correctAnswer,
              incorrect: currentQuestion.answered && currentQuestion.userAnswer === opt.id && opt.id !== currentQuestion.correctAnswer
            }"
            :disabled="currentQuestion.answered"
            @click="selectAnswer(opt.id)"
          >
            {{ opt.text }}
          </button>
        </div>

        <button v-if="!currentQuestion.answered" class="btn btn-primary" :disabled="!currentQuestion.userAnswer" @click="submitAnswer">
          SUBMIT
        </button>

        <div v-if="currentQuestion.answered" class="answer-feedback" :class="{ correct: currentQuestion.userAnswer === currentQuestion.correctAnswer }">
          <div class="feedback-header">
            {{ currentQuestion.userAnswer === currentQuestion.correctAnswer ? '✓ CORRECT!' : '✗ INCORRECT' }}
          </div>
          <p>{{ currentQuestion.explanation }}</p>
          <button class="btn btn-primary" @click="nextQuestion">
            {{ currentQuestionIndex < questions.length - 1 ? 'NEXT QUESTION →' : 'CONTINUE TO ANIMATION →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Part E: Animation -->
    <div v-if="phase === 'animation'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART E</span>
        <h3 class="part-title">CLOUD-TO-LOCAL PRINT JOB FLOW</h3>
      </div>

      <div v-if="!animationStarted" class="animation-start">
        <p>Watch the complete cloud-to-local print flow in action:</p>
        <button class="btn btn-primary btn-lg" @click="startAnimation">▶ START ANIMATION</button>
      </div>

      <div v-else class="animation-steps">
        <div v-for="step in animSteps" :key="step.id" class="anim-step" :class="{ active: step.progress > 0, complete: step.complete }">
          <div class="step-icon">{{ step.icon }}</div>
          <div class="step-content">
            <div class="step-title">Step {{ step.id }}: {{ step.title }}</div>
            <div class="step-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${step.progress}%` }"></div>
              </div>
              <span class="progress-label">{{ step.complete ? 'Complete' : step.progress > 0 ? 'Processing...' : 'Pending' }}</span>
            </div>
            <div v-if="step.complete" class="step-desc">{{ step.description }}</div>
          </div>
        </div>

        <div v-if="animationComplete" class="animation-summary">
          <div class="summary-stat">⏱️ Total time: 8.2 seconds</div>
          <div class="summary-stat">🖥️ Infrastructure required: 0 servers</div>
          <div class="summary-stat">🔒 Firewall changes: 0</div>
          <div class="summary-stat">🔗 VPN tunnels: 0</div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 11: COMPLETE</h2>
            <div class="final-badge">🎉 MISSION SUCCESS 🎉</div>
          </div>

          <div class="success-content">
            <div class="success-message">API CLOUD LINK ACTIVATED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Built cloud-to-local printing architecture</div>
              <div class="check-item">✓ Decrypted API payload and understood parameters</div>
              <div class="check-item">✓ Configured Edge Service deployment options</div>
              <div class="check-item">✓ Verified zero-infrastructure capability</div>
            </div>

            <!-- Comparison -->
            <div class="comparison">
              <div class="comparison-col traditional">
                <h4>TRADITIONAL (Complex)</h4>
                <ul>
                  <li>❌ Site-to-site VPN required</li>
                  <li>❌ Firewall rules and port forwarding</li>
                  <li>❌ Security team approvals (weeks)</li>
                  <li>❌ Complex routing and NAT</li>
                  <li>❌ High infrastructure costs</li>
                </ul>
              </div>
              <div class="comparison-col cloudlink">
                <h4>API CLOUD LINK (Simple)</h4>
                <ul>
                  <li>✓ Cloud app calls Vasion API (HTTPS)</li>
                  <li>✓ Job stored in Secure Gateway</li>
                  <li>✓ Edge Service pulls (outbound only)</li>
                  <li>✓ No firewall changes needed</li>
                  <li>✓ Zero infrastructure (CPA)</li>
                </ul>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>Flow: Cloud EHR → API Cloud Link → Secure Gateway → Edge Service → Local Printer</li>
                <li>API params: printer name, gateway (secure.vasion.cloud), Bearer token auth</li>
                <li>Edge Service can embed in printer CPA = ZERO infrastructure</li>
                <li>No VPN required—all outbound connections (firewall-friendly)</li>
              </ul>
            </div>

            <div class="final-score">
              Final Score: {{ score }}/{{ totalQuestions }}
            </div>

            <div class="congratulations">
              <h3>🎉 CONGRATULATIONS, AGENT ZERO! 🎉</h3>
              <p>You have successfully completed all 11 objectives. Apex Industries is now fully modernized, secured, and automated.</p>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO MISSION DEBRIEF →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level11-puzzle {
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
  color: var(--color-accent);
}

.narrative-box p {
  color: var(--color-text);
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
}

.mission-task {
  color: var(--color-primary) !important;
}

.score-display {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  text-align: center;
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

.progress-indicator {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
}

.instruction {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
}

/* Architecture components */
.arch-components {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.arch-component {
  background: var(--color-surface-elevated);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.arch-component:hover:not(.verified) {
  border-color: var(--color-primary);
}

.arch-component.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.arch-component.verified.correct {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.2);
}

.arch-component.verified.incorrect {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
}

.comp-order {
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

.comp-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.comp-label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.comp-desc {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

/* Architecture result */
.arch-result {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.result-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-accent);
  margin-bottom: var(--space-md);
}

.result-header.correct {
  color: var(--color-primary);
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
  gap: var(--space-sm);
}

.seq-item {
  font-size: 0.8rem;
  color: var(--color-text);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.seq-arrow {
  color: var(--color-primary);
}

/* API Payload */
.api-intercept {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.intercept-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-warning);
  margin-bottom: var(--space-xs);
}

.intercept-header + p {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin: 0;
}

.api-payload {
  background: #1a1a2e;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
}

.payload-code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.payload-code span {
  color: var(--color-warning);
}

.payload-code span.filled {
  color: var(--color-primary);
}

.param-question {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.param-header {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.param-prompt {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.options-list.tf-options {
  flex-direction: row;
}

.options-list.tf-options .option-btn {
  flex: 1;
  text-align: center;
}

.option-btn {
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
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

/* Question card */
.question-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.question-text {
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
  line-height: 1.5;
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
  font-family: var(--font-display);
  font-size: 1rem;
  margin-bottom: var(--space-md);
}

.answer-feedback.correct .feedback-header {
  color: var(--color-primary);
}

.answer-feedback:not(.correct) .feedback-header {
  color: var(--color-accent);
}

.answer-feedback p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

/* Animation */
.animation-start {
  text-align: center;
  padding: var(--space-2xl);
}

.animation-start p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

.animation-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.anim-step {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  opacity: 0.5;
  transition: all var(--transition-fast);
}

.anim-step.active {
  opacity: 1;
  border-color: var(--color-primary);
}

.anim-step.complete {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.step-icon {
  font-size: 1.5rem;
  min-width: 40px;
  text-align: center;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.step-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-surface);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.05s linear;
}

.progress-label {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  min-width: 80px;
}

.step-desc {
  font-size: 0.75rem;
  color: var(--color-primary);
  margin-top: var(--space-xs);
}

.animation-summary {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
}

.summary-stat {
  font-size: 0.85rem;
  color: var(--color-text);
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
  margin: 0 0 var(--space-sm) 0;
}

.final-badge {
  font-size: 1.5rem;
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

/* Comparison */
.comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.comparison-col {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.comparison-col h4 {
  font-size: 0.8rem;
  margin-bottom: var(--space-sm);
}

.comparison-col.traditional h4 {
  color: var(--color-accent);
}

.comparison-col.cloudlink h4 {
  color: var(--color-primary);
}

.comparison-col ul {
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.comparison-col li {
  margin-bottom: var(--space-xs);
}

/* Learnings */
.learnings-box {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
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

.final-score {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-lg);
}

.congratulations {
  text-align: center;
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary-glow), var(--color-secondary-dim));
  border-radius: var(--radius-md);
}

.congratulations h3 {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.congratulations p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0;
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

@media (max-width: 600px) {
  .comparison {
    grid-template-columns: 1fr;
  }

  .arch-components {
    grid-template-columns: 1fr;
  }

  .options-list.tf-options {
    flex-direction: column;
  }

  .sequence-flow {
    flex-direction: column;
    align-items: flex-start;
  }

  .seq-arrow {
    transform: rotate(90deg);
    padding: var(--space-xs) 0;
  }
}
</style>

