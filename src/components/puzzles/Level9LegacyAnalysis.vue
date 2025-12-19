<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Part A: Team identification
const teamAnswer = ref<string | null>(null)
const teamAnswered = ref(false)
const teamCorrect = computed(() => teamAnswer.value === 'c')

// Part B: Architecture
const selectedComponent = ref<string | null>(null)
const architectureAnswer = ref<boolean | null>(null)
const architectureAnswered = ref(false)

const componentInfoMap: Record<string, { title: string; description: string[] }> = {
  ehrSystem: {
    title: 'EHR/ERP System',
    description: ['Epic (healthcare)', 'Cerner (healthcare)', 'SAP (ERP)', 'Oracle (database/ERP)', 'Generates automated documents for printing'],
  },
  backendServer: {
    title: 'Backend Print Server',
    description: [
      'Dedicated server for application printing',
      'Spools and renders system-generated jobs',
      'Routes to designated printers',
      'Managed by EHR/ERP team',
    ],
  },
  workstation: {
    title: 'User Workstation',
    description: [
      'Windows, Mac, or Linux desktop',
      'User prints from Word, Excel, email, browser',
      'Sends job to frontend print server',
    ],
  },
  frontendServer: {
    title: 'Frontend Print Server',
    description: [
      'Dedicated server for user printing',
      'Spools and renders user-initiated jobs',
      'Routes to designated printers',
      'Managed by infrastructure/help desk team',
    ],
  },
}

// Computed property to safely access component info
const selectedComponentInfo = computed(() => {
  if (!selectedComponent.value) return null
  return componentInfoMap[selectedComponent.value] || null
})

// Part C: Cost calculator
const backendServers = ref<string>('')
const frontendServers = ref<string>('')
const totalServers = ref<string>('')
const lowEndCost = ref<string>('')
const highEndCost = ref<string>('')
const costCalculated = ref(false)
const costCorrect = ref(false)

// Part D: Problem identification
interface ProblemItem {
  id: string
  text: string
  isProblem: boolean
  userAnswer: boolean | null
}

const problems = ref<ProblemItem[]>([
  { id: 'teams', text: 'Two different teams managing two different systems', isProblem: true, userAnswer: null },
  { id: 'costs', text: 'Duplicate infrastructure costs', isProblem: true, userAnswer: null },
  { id: 'troubleshoot', text: 'Complex troubleshooting across systems', isProblem: true, userAnswer: null },
  { id: 'security', text: 'Multiple attack vectors (more servers = more risk)', isProblem: true, userAnswer: null },
  { id: 'automation', text: 'Too much automation', isProblem: false, userAnswer: null },
  { id: 'cloud', text: 'Cloud-based architecture', isProblem: false, userAnswer: null },
])

// Overall state
const phase = ref<'teams' | 'architecture' | 'cost' | 'problems' | 'review'>('teams')
const showSuccess = ref(false)

// Computed
const allProblemsAnswered = computed(() => problems.value.every((p) => p.userAnswer !== null))
const correctProblems = computed(() => problems.value.filter((p) => p.userAnswer === p.isProblem).length)

const baseUrl = import.meta.env.BASE_URL

// Part A methods
function selectTeamAnswer(answer: string) {
  if (teamAnswered.value) return
  teamAnswer.value = answer
}

function submitTeamAnswer() {
  if (!teamAnswer.value) return
  teamAnswered.value = true
  playSound('bling1.mp3')
}

function proceedToArchitecture() {
  phase.value = 'architecture'
}

// Part B methods
function clickComponent(componentId: string) {
  selectedComponent.value = selectedComponent.value === componentId ? null : componentId
}

function selectArchitectureAnswer(answer: boolean) {
  if (architectureAnswered.value) return
  architectureAnswer.value = answer
}

function submitArchitectureAnswer() {
  if (architectureAnswer.value === null) return
  architectureAnswered.value = true
  playSound('bling1.mp3')
}

function proceedToCost() {
  phase.value = 'cost'
}

// Part C methods
function calculateCosts() {
  const backend = parseInt(backendServers.value) || 0
  const frontend = parseInt(frontendServers.value) || 0
  const total = parseInt(totalServers.value) || 0
  const lowCost = parseInt(lowEndCost.value.replace(/[,$]/g, '')) || 0
  const highCost = parseInt(highEndCost.value.replace(/[,$]/g, '')) || 0

  // Check if calculations are correct
  const correctBackend = backend === 5
  const correctFrontend = frontend === 5
  const correctTotal = total === 10
  const correctLow = lowCost === 18000
  const correctHigh = highCost === 50000

  costCorrect.value = correctBackend && correctFrontend && correctTotal && correctLow && correctHigh
  costCalculated.value = true
  playSound('bling1.mp3')
}

function proceedToProblems() {
  phase.value = 'problems'
}

// Part D methods
function answerProblem(problem: ProblemItem, answer: boolean) {
  if (problem.userAnswer !== null) return
  problem.userAnswer = answer
  playSound('bling1.mp3')

  if (allProblemsAnswered.value) {
    setTimeout(() => {
      phase.value = 'review'
      setTimeout(() => {
        showSuccess.value = true
      }, 1500)
    }, 1000)
  }
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
  gameStore.completeLevel(9)
  router.push({ name: 'level', params: { id: '10' } })
}
</script>

<template>
  <div class="level9-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Data Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="narrative-box">
        <p>Agent, we've secured the frontend (end-user) printing. But there's another critical system: <strong>backend output management</strong> for EHR/ERP systems.</p>
        <p>Apex's legacy architecture has separate teams managing separate systems for backend and frontend printing. It's expensive, complex, and inefficient.</p>
        <p class="mission-task">Your mission: <strong>Analyze the legacy output management</strong> to understand the problem before consolidation.</p>
      </div>
    </div>

    <!-- Part A: Team Identification -->
    <div v-if="phase === 'teams'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">IDENTIFY THE TEAMS</h3>
      </div>

      <!-- Org chart -->
      <div class="org-chart">
        <div class="chart-title">APEX INDUSTRIES IT STRUCTURE</div>
        <div class="chart-container">
          <div class="chart-node director">
            <span class="node-title">IT DIRECTOR</span>
          </div>
          <div class="chart-connector"></div>
          <div class="chart-row">
            <div class="chart-node team">
              <span class="node-icon">⚙️</span>
              <span class="node-title">BACKEND TEAM</span>
              <span class="node-desc">EHR/ERP Applications</span>
            </div>
            <div class="chart-node team">
              <span class="node-icon">🖥️</span>
              <span class="node-title">FRONTEND TEAM</span>
              <span class="node-desc">Infrastructure/Help Desk</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Question -->
      <div class="question-card">
        <div class="question-number">QUESTION 1</div>
        <p class="question-text">Which teams are typically involved in managing a legacy print environment?</p>

        <div class="options-list">
          <button
            v-for="option in [
              { id: 'a', text: 'Only the frontend/infrastructure team' },
              { id: 'b', text: 'Only the ERP/EHR application team' },
              { id: 'c', text: 'An ERP/EHR team AND a server/help desk/infrastructure team (two different teams)' },
              { id: 'd', text: 'A single unified team managing all printing' },
            ]"
            :key="option.id"
            class="option-btn"
            :class="{
              selected: teamAnswer === option.id,
              correct: teamAnswered && option.id === 'c',
              incorrect: teamAnswered && teamAnswer === option.id && option.id !== 'c',
            }"
            :disabled="teamAnswered"
            @click="selectTeamAnswer(option.id)"
          >
            <span class="option-letter">{{ option.id.toUpperCase() }})</span>
            <span class="option-text">{{ option.text }}</span>
          </button>
        </div>

        <button v-if="!teamAnswered" class="btn btn-primary submit-btn" :disabled="!teamAnswer" @click="submitTeamAnswer">SUBMIT ANSWER</button>

        <div v-if="teamAnswered" class="answer-feedback" :class="{ correct: teamCorrect }">
          <div class="feedback-header">
            <span class="feedback-icon">{{ teamCorrect ? '✓' : '✗' }}</span>
            <span class="feedback-text">{{ teamCorrect ? 'CORRECT!' : 'INCORRECT' }}</span>
          </div>
          <div class="feedback-explanation">
            <p><strong>Backend Team (ERP/EHR):</strong> Manages Epic, Cerner, SAP, Oracle. Responsible for application-generated output.</p>
            <p><strong>Frontend Team (Infrastructure):</strong> Manages Windows servers, endpoints, user support. Responsible for end-user printing.</p>
            <p>These teams often don't communicate well, leading to finger-pointing when issues arise.</p>
          </div>
          <button class="btn btn-primary" @click="proceedToArchitecture">CONTINUE →</button>
        </div>
      </div>
    </div>

    <!-- Part B: Architecture -->
    <div v-if="phase === 'architecture'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART B</span>
        <h3 class="part-title">LEGACY ARCHITECTURE DIAGRAM</h3>
      </div>

      <p class="instruction">Click on components to learn more:</p>

      <!-- Backend diagram -->
      <div class="architecture-diagram">
        <div class="diagram-title">BACKEND (EHR/ERP) PRINTING</div>
        <div class="diagram-flow">
          <div class="flow-node clickable" :class="{ active: selectedComponent === 'ehrSystem' }" @click="clickComponent('ehrSystem')">
            <span class="node-icon">🏥</span>
            <span class="node-label">EHR/ERP<br />System</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node clickable" :class="{ active: selectedComponent === 'backendServer' }" @click="clickComponent('backendServer')">
            <span class="node-icon">🖥️</span>
            <span class="node-label">Backend<br />Print Server</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node">
            <span class="node-icon">🖨️</span>
            <span class="node-label">Printer</span>
          </div>
        </div>
        <p class="diagram-desc">System-generated output (lab reports, invoices, etc.)</p>
      </div>

      <!-- Frontend diagram -->
      <div class="architecture-diagram">
        <div class="diagram-title">FRONTEND (END USER) PRINTING</div>
        <div class="diagram-flow">
          <div class="flow-node clickable" :class="{ active: selectedComponent === 'workstation' }" @click="clickComponent('workstation')">
            <span class="node-icon">💻</span>
            <span class="node-label">User<br />Workstation</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node clickable" :class="{ active: selectedComponent === 'frontendServer' }" @click="clickComponent('frontendServer')">
            <span class="node-icon">🖥️</span>
            <span class="node-label">Frontend<br />Print Server</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node">
            <span class="node-icon">🖨️</span>
            <span class="node-label">Printer</span>
          </div>
        </div>
        <p class="diagram-desc">User-initiated printing (documents, emails, etc.)</p>
      </div>

      <!-- Component info popup -->
      <Transition name="fade">
        <div v-if="selectedComponentInfo" class="component-info">
          <div class="info-header">{{ selectedComponentInfo.title }}</div>
          <ul class="info-list">
            <li v-for="(item, i) in selectedComponentInfo.description" :key="i">{{ item }}</li>
          </ul>
        </div>
      </Transition>

      <!-- Question 2 -->
      <div class="question-card">
        <div class="question-number">QUESTION 2</div>
        <p class="question-text">
          True or False: Legacy output management involves two different teams managing two different systems (backend and frontend print servers) and separate print queues.
        </p>

        <div class="tf-buttons">
          <button
            class="tf-btn"
            :class="{
              selected: architectureAnswer === true,
              correct: architectureAnswered && true === true,
            }"
            :disabled="architectureAnswered"
            @click="selectArchitectureAnswer(true)"
          >
            TRUE
          </button>
          <button
            class="tf-btn"
            :class="{
              selected: architectureAnswer === false,
              incorrect: architectureAnswered && architectureAnswer === false,
            }"
            :disabled="architectureAnswered"
            @click="selectArchitectureAnswer(false)"
          >
            FALSE
          </button>
        </div>

        <button v-if="!architectureAnswered" class="btn btn-primary submit-btn" :disabled="architectureAnswer === null" @click="submitArchitectureAnswer">
          SUBMIT ANSWER
        </button>

        <div v-if="architectureAnswered" class="answer-feedback correct">
          <div class="feedback-header">
            <span class="feedback-icon">{{ architectureAnswer === true ? '✓' : '✗' }}</span>
            <span class="feedback-text">{{ architectureAnswer === true ? 'CORRECT!' : 'INCORRECT - The answer is TRUE' }}</span>
          </div>
          <div class="feedback-explanation">
            <p>This is the core problem:</p>
            <ul>
              <li><strong>Two teams:</strong> Backend vs. Frontend</li>
              <li><strong>Two systems:</strong> Separate print servers</li>
              <li><strong>Two sets of print queues:</strong> Different management consoles</li>
              <li><strong>Two points of failure:</strong> Either can go down</li>
              <li><strong>Two sets of costs:</strong> Double the infrastructure</li>
            </ul>
          </div>
          <button class="btn btn-primary" @click="proceedToCost">CONTINUE →</button>
        </div>
      </div>
    </div>

    <!-- Part C: Cost Calculator -->
    <div v-if="phase === 'cost'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART C</span>
        <h3 class="part-title">COST CALCULATOR</h3>
      </div>

      <!-- Infrastructure info -->
      <div class="infrastructure-info">
        <div class="info-header">APEX INDUSTRIES - 5 OFFICE LOCATIONS</div>
        <div class="info-content">
          <p>Each location has:</p>
          <ul>
            <li>1 Backend print server (for EHR/ERP)</li>
            <li>1 Frontend print server (for user workstations)</li>
          </ul>
        </div>
      </div>

      <!-- Cost per server -->
      <div class="cost-reference">
        <div class="cost-header">COST PER SERVER</div>
        <div class="cost-grid">
          <div class="cost-col">
            <h4>LOW END: $1,800/year</h4>
            <ul>
              <li>Windows Server license: $500/year</li>
              <li>Hardware/VM costs: $800/year</li>
              <li>Maintenance/support: $500/year</li>
            </ul>
          </div>
          <div class="cost-col">
            <h4>HIGH END: $5,000/year</h4>
            <ul>
              <li>Windows Server license: $1,500/year</li>
              <li>Hardware/VM costs: $2,000/year</li>
              <li>Maintenance/support: $1,500/year</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Calculator -->
      <div v-if="!costCalculated" class="calculator">
        <div class="calc-header">CALCULATION CHALLENGE</div>

        <div class="calc-section">
          <label>Backend servers (1 per location × 5 locations):</label>
          <input v-model="backendServers" type="number" class="calc-input" placeholder="?" />
        </div>

        <div class="calc-section">
          <label>Frontend servers (1 per location × 5 locations):</label>
          <input v-model="frontendServers" type="number" class="calc-input" placeholder="?" />
        </div>

        <div class="calc-section">
          <label>TOTAL servers:</label>
          <input v-model="totalServers" type="number" class="calc-input" placeholder="?" />
        </div>

        <div class="calc-divider"></div>

        <div class="calc-section">
          <label>Low End Cost ({{ totalServers || '?' }} servers × $1,800):</label>
          <input v-model="lowEndCost" type="text" class="calc-input" placeholder="$?" />
        </div>

        <div class="calc-section">
          <label>High End Cost ({{ totalServers || '?' }} servers × $5,000):</label>
          <input v-model="highEndCost" type="text" class="calc-input" placeholder="$?" />
        </div>

        <button class="btn btn-primary submit-btn" @click="calculateCosts">CHECK CALCULATIONS</button>
      </div>

      <!-- Calculator result -->
      <div v-else class="calc-result" :class="{ correct: costCorrect }">
        <div class="result-header">
          <span class="result-icon">{{ costCorrect ? '✓' : '~' }}</span>
          <span class="result-text">{{ costCorrect ? 'CALCULATIONS CORRECT!' : 'CALCULATIONS SUBMITTED' }}</span>
        </div>

        <div class="correct-answers">
          <p><strong>Correct Answers:</strong></p>
          <ul>
            <li>Backend servers: 5</li>
            <li>Frontend servers: 5</li>
            <li>Total servers: 10</li>
            <li>Low End Cost: $18,000/year</li>
            <li>High End Cost: $50,000/year</li>
          </ul>
        </div>

        <!-- Cost visualization -->
        <div class="cost-visualization">
          <div class="cost-bar">
            <div class="bar-label">Low End: $18,000/year</div>
            <div class="bar-fill low"></div>
          </div>
          <div class="cost-bar">
            <div class="bar-label">High End: $50,000/year</div>
            <div class="bar-fill high"></div>
          </div>
          <p class="cost-note">10 servers = $18K-$50K/year just for OUTPUT management</p>
          <p class="cost-note secondary">This doesn't include IT staff time, power, cooling, or data center space!</p>
        </div>

        <button class="btn btn-primary" @click="proceedToProblems">CONTINUE →</button>
      </div>
    </div>

    <!-- Part D: Problem Identification -->
    <div v-if="phase === 'problems' || phase === 'review'" class="part-section">
      <div class="part-header">
        <span class="part-label">PART D</span>
        <h3 class="part-title">IDENTIFY PROBLEMS</h3>
        <span class="part-progress">{{ problems.filter(p => p.userAnswer !== null).length }}/{{ problems.length }}</span>
      </div>

      <p class="instruction">Select whether each item is a PROBLEM with legacy output management:</p>

      <div class="problems-list">
        <div v-for="problem in problems" :key="problem.id" class="problem-card" :class="{ answered: problem.userAnswer !== null }">
          <div class="problem-text">{{ problem.text }}</div>

          <div v-if="problem.userAnswer === null" class="problem-buttons">
            <button class="problem-btn yes" @click="answerProblem(problem, true)">✓ IS A PROBLEM</button>
            <button class="problem-btn no" @click="answerProblem(problem, false)">✗ NOT A PROBLEM</button>
          </div>

          <div v-else class="problem-result" :class="{ correct: problem.userAnswer === problem.isProblem }">
            <span class="result-icon">{{ problem.userAnswer === problem.isProblem ? '✓' : '✗' }}</span>
            <span class="result-label">
              {{ problem.isProblem ? 'IS A PROBLEM' : 'NOT A PROBLEM' }}
              {{ !problem.isProblem ? '(this is actually needed or is the solution!)' : '' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="phase === 'review'" class="review-summary">
        <div class="summary-score">{{ correctProblems }}/{{ problems.length }} correct</div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 9: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">LEGACY OUTPUT COMPLEXITY ANALYZED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Identified two-team structure (Backend + Frontend)</div>
              <div class="check-item">✓ Mapped legacy architecture (separate systems)</div>
              <div class="check-item">✓ Calculated infrastructure costs ($18K-$50K/year)</div>
              <div class="check-item">✓ Recognized problems with current approach</div>
            </div>

            <div class="problem-summary">
              <h4>THE LEGACY OUTPUT PROBLEM:</h4>

              <div class="problem-category">
                <strong>ORGANIZATIONAL:</strong>
                <ul>
                  <li>Backend team manages EHR/ERP printing</li>
                  <li>Frontend team manages user printing</li>
                  <li>Teams work in silos, finger-pointing when issues arise</li>
                </ul>
              </div>

              <div class="problem-category">
                <strong>TECHNICAL:</strong>
                <ul>
                  <li>Separate print servers for backend vs frontend</li>
                  <li>Different management tools/consoles</li>
                  <li>Two points of failure</li>
                </ul>
              </div>

              <div class="problem-category">
                <strong>FINANCIAL:</strong>
                <ul>
                  <li>$18,000-$50,000/year just for servers</li>
                  <li>Double the licensing, maintenance, and IT staff time</li>
                </ul>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>Legacy environments have separate teams for backend (ERP/EHR) and frontend (user) printing</li>
                <li>10 servers (5 locations × 2) = $18K-$50K/year in infrastructure costs</li>
                <li>Problems: Two teams, two systems, duplicate costs, complex troubleshooting</li>
                <li>Now we can deploy Vasion Output to consolidate onto ONE unified platform</li>
              </ul>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 10 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level9-puzzle {
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

.narrative-box p {
  color: var(--color-text);
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
}

.mission-task {
  color: var(--color-primary) !important;
  margin-top: var(--space-md) !important;
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

.part-progress {
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

/* Org chart */
.org-chart {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.chart-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text);
  text-align: center;
  margin-bottom: var(--space-lg);
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-node {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  text-align: center;
}

.chart-node.director {
  border-color: var(--color-primary);
}

.chart-node.team {
  min-width: 150px;
}

.node-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: var(--space-xs);
}

.node-title {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
}

.node-desc {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin-top: var(--space-xs);
}

.chart-connector {
  width: 2px;
  height: 30px;
  background: var(--color-border);
  position: relative;
}

.chart-connector::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -75px;
  right: -75px;
  height: 2px;
  background: var(--color-border);
}

.chart-row {
  display: flex;
  gap: var(--space-xl);
  margin-top: 30px;
}

/* Question card */
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

.submit-btn {
  width: 100%;
}

/* T/F buttons */
.tf-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.tf-btn {
  padding: var(--space-lg);
  font-family: var(--font-display);
  font-size: 1rem;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tf-btn:hover:not(:disabled) {
  border-color: var(--color-text-dim);
}

.tf-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.tf-btn.correct {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.2);
}

.tf-btn.incorrect {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
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

.answer-feedback.correct .feedback-icon,
.answer-feedback.correct .feedback-text {
  color: var(--color-primary);
}

.answer-feedback:not(.correct) .feedback-icon,
.answer-feedback:not(.correct) .feedback-text {
  color: var(--color-accent);
}

.feedback-text {
  font-family: var(--font-display);
  font-size: 1rem;
}

.feedback-explanation {
  margin-bottom: var(--space-lg);
}

.feedback-explanation p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.feedback-explanation ul {
  list-style: none;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.feedback-explanation li {
  margin-bottom: var(--space-xs);
}

/* Architecture diagrams */
.architecture-diagram {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.diagram-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-secondary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.diagram-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.flow-node {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  text-align: center;
  min-width: 100px;
}

.flow-node.clickable {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.flow-node.clickable:hover {
  border-color: var(--color-primary);
}

.flow-node.active {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.flow-node .node-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: var(--space-xs);
}

.flow-node .node-label {
  font-size: 0.75rem;
  color: var(--color-text);
  line-height: 1.3;
}

.flow-arrow {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.diagram-desc {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  text-align: center;
  margin-top: var(--space-md);
}

/* Component info */
.component-info {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.info-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.info-list {
  list-style: none;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.info-list li {
  margin-bottom: 2px;
  padding-left: var(--space-md);
  position: relative;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

/* Cost calculator */
.infrastructure-info,
.cost-reference {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.infrastructure-info .info-header,
.cost-reference .cost-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
}

.infrastructure-info p,
.infrastructure-info li {
  font-size: 0.85rem;
  color: var(--color-text);
}

.cost-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.cost-col h4 {
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.cost-col ul {
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.calculator {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.calc-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-lg);
}

.calc-section {
  margin-bottom: var(--space-md);
}

.calc-section label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.calc-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 1rem;
  text-align: center;
}

.calc-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.calc-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-lg) 0;
}

/* Calc result */
.calc-result {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.calc-result.correct {
  border-color: var(--color-primary);
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.result-icon {
  font-size: 1.5rem;
}

.calc-result.correct .result-icon,
.calc-result.correct .result-text {
  color: var(--color-primary);
}

.result-text {
  font-family: var(--font-display);
}

.correct-answers {
  margin-bottom: var(--space-lg);
}

.correct-answers p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.correct-answers ul {
  list-style: none;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

/* Cost visualization */
.cost-visualization {
  margin-bottom: var(--space-lg);
}

.cost-bar {
  margin-bottom: var(--space-md);
}

.bar-label {
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.bar-fill {
  height: 20px;
  border-radius: var(--radius-sm);
}

.bar-fill.low {
  width: 36%;
  background: var(--color-secondary);
}

.bar-fill.high {
  width: 100%;
  background: var(--color-accent);
}

.cost-note {
  font-size: 0.8rem;
  color: var(--color-text);
  margin-top: var(--space-md);
}

.cost-note.secondary {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

/* Problems list */
.problems-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.problem-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.problem-card.answered {
  border-color: var(--color-text-dim);
}

.problem-text {
  font-size: 0.95rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.problem-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.problem-btn {
  padding: var(--space-md);
  font-size: 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.problem-btn.yes {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
}

.problem-btn.yes:hover {
  background: rgba(255, 0, 102, 0.1);
}

.problem-btn.no {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.problem-btn.no:hover {
  background: var(--color-primary-glow);
}

.problem-result {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
}

.problem-result.correct {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--color-primary);
}

.problem-result .result-icon {
  font-size: 1.25rem;
}

.problem-result.correct .result-icon,
.problem-result.correct .result-label {
  color: var(--color-primary);
}

.problem-result:not(.correct) .result-icon,
.problem-result:not(.correct) .result-label {
  color: var(--color-accent);
}

.result-label {
  font-size: 0.85rem;
}

.review-summary {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  text-align: center;
}

.summary-score {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-primary);
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

.problem-summary {
  margin-bottom: var(--space-lg);
}

.problem-summary h4 {
  font-size: 0.8rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
}

.problem-category {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.problem-category strong {
  display: block;
  font-size: 0.75rem;
  color: var(--color-accent);
  margin-bottom: var(--space-xs);
}

.problem-category ul {
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-dim);
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .chart-row {
    flex-direction: column;
    gap: var(--space-md);
  }

  .chart-connector::after {
    display: none;
  }

  .cost-grid {
    grid-template-columns: 1fr;
  }

  .problem-buttons {
    grid-template-columns: 1fr;
  }

  .tf-buttons {
    grid-template-columns: 1fr;
  }
}
</style>

