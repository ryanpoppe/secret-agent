<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Overall state
const currentStep = ref(1)
const configComplete = ref(false)
const architectureComplete = ref(false)
const failoverComplete = ref(false)
const quizComplete = ref(false)
const showSuccess = ref(false)

// Part A: Configuration Steps
// Step 1: Routing Logic
const routingRules = ref([
  { id: 1, name: 'Epic Lab Reports', condition: 'LabReport', target: 'Lab-Floor2-Printer01' },
  { id: 2, name: 'SAP Invoices', condition: 'Invoice', target: 'Accounting-Printer02' },
])
const step1Complete = ref(false)

// Step 2: Output Service
const outputPort = ref('')
const serverLocation = ref<string | null>(null)
const serverName = ref('')
const serverIP = ref('')
const step2Complete = ref(false)

// Step 3: Edge Service
const edgeEnabled = ref(false)
const edgeServiceName = ref('')
const edgeLocation = ref('')
const step3Complete = ref(false)

// Step 4: EHR/ERP Connection
const systemType = ref<string | null>(null)
const step4Complete = ref(false)

// Part B: Architecture Builder - Simplified selection approach
interface ArchOption {
  id: string
  label: string
  icon: string
}

const archOptions: ArchOption[] = [
  { id: 'ehr', label: 'EHR/ERP System', icon: '🏥' },
  { id: 'workstation', label: 'User Workstation', icon: '💻' },
  { id: 'edge', label: 'Edge Service', icon: '☁️' },
  { id: 'printer', label: 'Printer', icon: '🖨️' },
  { id: 'server', label: 'Print Server', icon: '🖥️' },
]

// Backend flow: Source → Middle → Destination
const backendSource = ref<string | null>(null)
const backendMiddle = ref<string | null>(null)
const backendDest = ref<string | null>(null)

// Frontend flow: Source → Middle → Destination
const frontendSource = ref<string | null>(null)
const frontendMiddle = ref<string | null>(null)
const frontendDest = ref<string | null>(null)

// Part C: Failover
const failoverAction = ref<string | null>(null)
const alternatePrinter = ref<string | null>(null)
const failoverApplied = ref(false)
const failoverAnimating = ref(false)

interface PrintJob {
  id: number
  name: string
  status: 'queued' | 'spooling' | 'printing' | 'complete'
  progress: number
}

const failoverJobs = ref<PrintJob[]>([
  { id: 1, name: 'LabReport_Patient_4729.pdf', status: 'queued', progress: 0 },
  { id: 2, name: 'LabReport_Patient_4730.pdf', status: 'queued', progress: 0 },
  { id: 3, name: 'LabReport_Patient_4731.pdf', status: 'queued', progress: 0 },
])

// Part D: Quiz
interface Question {
  id: number
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
  explanation: string
  userAnswer: string | null
  answered: boolean
}

const questions = ref<Question[]>([
  {
    id: 1,
    text: 'Does Vasion Output provide agnostic EHR/ERP support?',
    options: [
      { id: 'a', text: 'No, only supports Epic' },
      { id: 'b', text: 'Yes, supports Epic, Cerner, SAP, Oracle, and other EHR/ERP systems' },
      { id: 'c', text: 'Only supports healthcare systems' },
      { id: 'd', text: 'Requires custom development for each system' },
    ],
    correctAnswer: 'b',
    explanation:
      'Vasion Output is agnostic—it works with any system that can send print jobs via standard protocols (LPR/LPD, port 9100, etc.). This includes Epic, Cerner, SAP, Oracle, Workday, and custom applications.',
    userAnswer: null,
    answered: false,
  },
  {
    id: 2,
    text: 'How many systems do both teams (backend + frontend) now manage?',
    options: [
      { id: 'a', text: 'Still two separate systems' },
      { id: 'b', text: 'Three systems (one for each location)' },
      { id: 'c', text: 'One unified platform (Vasion Output)' },
      { id: 'd', text: 'Five systems (one per office)' },
    ],
    correctAnswer: 'c',
    explanation:
      'This is the consolidation benefit: Before: 2 systems (backend + frontend). After: 1 platform (Vasion Output). Teams can merge or collaborate seamlessly with a single pane of glass.',
    userAnswer: null,
    answered: false,
  },
])

const currentQuestionIndex = ref(0)
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)
const score = ref(0)

const baseUrl = import.meta.env.BASE_URL

// Computed
const architectureCorrect = computed(() => {
  // Backend should be: EHR/ERP → Edge Service → Printer
  const backendCorrect = backendSource.value === 'ehr' && backendMiddle.value === 'edge' && backendDest.value === 'printer'
  // Frontend should be: Workstation → Edge Service → Printer
  const frontendCorrect = frontendSource.value === 'workstation' && frontendMiddle.value === 'edge' && frontendDest.value === 'printer'
  return backendCorrect && frontendCorrect
})

const allSlotsSelected = computed(() => {
  return backendSource.value && backendMiddle.value && backendDest.value && frontendSource.value && frontendMiddle.value && frontendDest.value
})

function getOptionById(id: string | null): ArchOption | null {
  if (!id) return null
  return archOptions.find((o) => o.id === id) || null
}

// Step 1 methods
function completeStep1() {
  step1Complete.value = true
  playSound('bling1.mp3')
  currentStep.value = 2
}

// Step 2 methods
function validateStep2() {
  return outputPort.value === '9100' && serverLocation.value && serverName.value.trim() && serverIP.value.trim()
}

function completeStep2() {
  if (!validateStep2()) return
  step2Complete.value = true
  playSound('bling1.mp3')
  currentStep.value = 3
}

// Step 3 methods
function validateStep3() {
  return edgeEnabled.value && edgeServiceName.value.trim() && edgeLocation.value.trim()
}

function completeStep3() {
  if (!validateStep3()) return
  step3Complete.value = true
  playSound('bling1.mp3')
  currentStep.value = 4
}

// Step 4 methods
function completeStep4() {
  if (!systemType.value) return
  step4Complete.value = true
  playSound('bling1.mp3')
  configComplete.value = true
}

// Architecture methods
function verifyArchitecture() {
  architectureComplete.value = true
  playSound('bling1.mp3')
}

// Failover methods
function applyFailover() {
  if (!failoverAction.value || !alternatePrinter.value) return
  failoverApplied.value = true
  failoverAnimating.value = true
  playSound('bling1.mp3')

  // Animate the jobs
  let jobIndex = 0
  const animateJob = () => {
    if (jobIndex >= failoverJobs.value.length) {
      setTimeout(() => {
        failoverAnimating.value = false
        failoverComplete.value = true
      }, 500)
      return
    }

    const job = failoverJobs.value[jobIndex]
    if (!job) return
    job.status = 'spooling'

    const progressInterval = setInterval(() => {
      if (!job) return
      job.progress += 10
      if (job.progress >= 50 && job.status === 'spooling') {
        job.status = 'printing'
      }
      if (job.progress >= 100) {
        job.status = 'complete'
        clearInterval(progressInterval)
        jobIndex++
        setTimeout(animateJob, 300)
      }
    }, 100)
  }

  setTimeout(animateJob, 500)
}

// Quiz methods
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
  } else {
    quizComplete.value = true
    setTimeout(() => {
      showSuccess.value = true
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
  gameStore.completeLevel(10)
  router.push({ name: 'level', params: { id: '11' } })
}
</script>

<template>
  <div class="level10-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Unified Operations Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐⭐ Advanced</span>
      </div>

      <div class="narrative-box">
        <p>Agent, you've analyzed the legacy complexity. Now it's time to <strong>eliminate it</strong>.</p>
        <p>
          Vasion Output consolidates both backend (EHR/ERP) and frontend (user) printing onto a <strong>single SaaS platform</strong>.
        </p>
        <p class="mission-task">Your mission: <strong>Configure Vasion Output</strong> to replace all 10 legacy print servers.</p>
      </div>
    </div>

    <!-- Part A: 4-Step Configuration -->
    <div v-if="!configComplete" class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">4-STEP CONFIGURATION</h3>
        <span class="step-indicator">STEP {{ currentStep }} OF 4</span>
      </div>

      <!-- Step progress -->
      <div class="step-progress">
        <div v-for="step in 4" :key="step" class="step-dot" :class="{ active: currentStep === step, complete: currentStep > step }">
          {{ step }}
        </div>
      </div>

      <!-- Step 1: Routing Logic -->
      <div v-if="currentStep === 1" class="config-step">
        <div class="console-header">VASION ADMIN CONSOLE - ROUTING CONFIGURATION</div>

        <p class="console-desc">Configure how print jobs are routed from EHR/ERP systems to printers.</p>

        <div class="routing-rules">
          <div v-for="rule in routingRules" :key="rule.id" class="rule-card">
            <div class="rule-header">Rule {{ rule.id }}: {{ rule.name }}</div>
            <div class="rule-body">
              <div class="rule-line">IF document_type = "{{ rule.condition }}"</div>
              <div class="rule-line">THEN route_to = "{{ rule.target }}"</div>
            </div>
            <div class="rule-actions">
              <button class="rule-btn">EDIT</button>
              <button class="rule-btn">DELETE</button>
            </div>
          </div>
        </div>

        <button class="btn btn-secondary add-rule-btn">+ ADD NEW RULE</button>

        <div class="step-status">✓ Routing logic configured</div>

        <button class="btn btn-primary step-btn" @click="completeStep1">CONTINUE TO STEP 2 →</button>
      </div>

      <!-- Step 2: Output Service -->
      <div v-if="currentStep === 2" class="config-step">
        <div class="console-header">VASION OUTPUT SERVICE CONFIGURATION</div>

        <p class="console-desc">Configure the Vasion Output service that will receive print jobs from your EHR/ERP systems.</p>

        <div class="config-group">
          <label class="config-label">Port Configuration:</label>
          <div class="config-field">
            <span class="field-prefix">Listening Port:</span>
            <input v-model="outputPort" type="text" class="config-input small" placeholder="9100" />
            <span class="field-hint">(Standard printer port)</span>
          </div>
        </div>

        <div class="config-group">
          <label class="config-label">Server Location:</label>
          <div class="radio-options">
            <label class="radio-option" :class="{ selected: serverLocation === 'onprem' }">
              <input v-model="serverLocation" type="radio" value="onprem" />
              <span class="radio-text">On-premise server</span>
            </label>
            <label class="radio-option" :class="{ selected: serverLocation === 'cloud' }">
              <input v-model="serverLocation" type="radio" value="cloud" />
              <span class="radio-text">Cloud-hosted VM</span>
            </label>
            <label class="radio-option" :class="{ selected: serverLocation === 'edge' }">
              <input v-model="serverLocation" type="radio" value="edge" />
              <span class="radio-text">Edge Service (embedded in printer)</span>
            </label>
          </div>
        </div>

        <div class="config-group">
          <label class="config-label">Server Details:</label>
          <div class="config-field">
            <span class="field-prefix">Server Name:</span>
            <input v-model="serverName" type="text" class="config-input" placeholder="VASION-OUTPUT-01" />
          </div>
          <div class="config-field">
            <span class="field-prefix">IP Address:</span>
            <input v-model="serverIP" type="text" class="config-input" placeholder="10.0.1.100" />
          </div>
        </div>

        <div v-if="validateStep2()" class="step-status">✓ Vasion Output service configured</div>

        <button class="btn btn-primary step-btn" :disabled="!validateStep2()" @click="completeStep2">CONTINUE TO STEP 3 →</button>
      </div>

      <!-- Step 3: Edge Service -->
      <div v-if="currentStep === 3" class="config-step">
        <div class="console-header">EDGE SERVICE ACTIVATION</div>

        <p class="console-desc">The lightweight Edge Service client eliminates the need for legacy output solutions.</p>

        <div class="benefits-list">
          <div class="benefit">• Pull jobs from Vasion Output</div>
          <div class="benefit">• Route to designated printers</div>
          <div class="benefit">• Provide failover and redundancy</div>
        </div>

        <div class="config-group">
          <label class="toggle-option" :class="{ enabled: edgeEnabled }">
            <input v-model="edgeEnabled" type="checkbox" />
            <span class="toggle-switch"></span>
            <span class="toggle-text">Enable Edge Service</span>
          </label>
        </div>

        <div v-if="edgeEnabled" class="config-group">
          <div class="config-field">
            <span class="field-prefix">Edge Service Name:</span>
            <input v-model="edgeServiceName" type="text" class="config-input" placeholder="Apex-HQ-Edge" />
          </div>
          <div class="config-field">
            <span class="field-prefix">Location:</span>
            <input v-model="edgeLocation" type="text" class="config-input" placeholder="Headquarters Data Center" />
          </div>
        </div>

        <div v-if="edgeEnabled" class="benefits-box">
          <div class="benefit-item">✓ Replaces legacy output server</div>
          <div class="benefit-item">✓ Lightweight (minimal resources)</div>
          <div class="benefit-item">✓ Cloud-managed configuration</div>
          <div class="benefit-item">✓ Automatic updates</div>
        </div>

        <div v-if="validateStep3()" class="step-status">✓ Edge Service enabled</div>

        <button class="btn btn-primary step-btn" :disabled="!validateStep3()" @click="completeStep3">CONTINUE TO STEP 4 →</button>
      </div>

      <!-- Step 4: EHR/ERP Connection -->
      <div v-if="currentStep === 4" class="config-step">
        <div class="console-header">EHR/ERP INTEGRATION</div>

        <p class="console-desc">Configure your EHR/ERP system to send documents to the Vasion Output service.</p>

        <div class="config-group">
          <label class="config-label">System Type:</label>
          <div class="radio-options">
            <label class="radio-option" :class="{ selected: systemType === 'epic' }">
              <input v-model="systemType" type="radio" value="epic" />
              <span class="radio-text">Epic (EHR)</span>
            </label>
            <label class="radio-option" :class="{ selected: systemType === 'cerner' }">
              <input v-model="systemType" type="radio" value="cerner" />
              <span class="radio-text">Cerner (EHR)</span>
            </label>
            <label class="radio-option" :class="{ selected: systemType === 'sap' }">
              <input v-model="systemType" type="radio" value="sap" />
              <span class="radio-text">SAP (ERP)</span>
            </label>
            <label class="radio-option" :class="{ selected: systemType === 'oracle' }">
              <input v-model="systemType" type="radio" value="oracle" />
              <span class="radio-text">Oracle (ERP)</span>
            </label>
            <label class="radio-option" :class="{ selected: systemType === 'other' }">
              <input v-model="systemType" type="radio" value="other" />
              <span class="radio-text">Other</span>
            </label>
          </div>
        </div>

        <div v-if="systemType" class="connection-details">
          <div class="detail-header">Connection Details:</div>
          <div class="detail-item">Target IP: {{ serverIP || '10.0.1.100' }}</div>
          <div class="detail-item">Target Port: {{ outputPort || '9100' }}</div>
          <div class="detail-item">Protocol: LPR/LPD</div>
          <div class="detail-highlight">
            Configure {{ systemType === 'epic' ? 'Epic' : systemType === 'cerner' ? 'Cerner' : systemType === 'sap' ? 'SAP' : systemType === 'oracle' ? 'Oracle' : 'your system' }} to print to:
            <code>lpr://{{ serverIP || '10.0.1.100' }}:{{ outputPort || '9100' }}</code>
          </div>
        </div>

        <div v-if="systemType" class="step-status">✓ EHR/ERP connected to Vasion Output</div>

        <button class="btn btn-primary step-btn" :disabled="!systemType" @click="completeStep4">COMPLETE CONFIGURATION →</button>
      </div>
    </div>

    <!-- Part B: Architecture Builder -->
    <div v-if="configComplete && !architectureComplete" class="part-section">
      <div class="part-header">
        <span class="part-label">PART B</span>
        <h3 class="part-title">BUILD THE NEW ARCHITECTURE</h3>
      </div>

      <p class="instruction">Select the correct component for each step in the unified architecture:</p>

      <div class="arch-info-box">
        <p>With Vasion Output, both backend (EHR/ERP) and frontend (user) printing flow through a <strong>unified architecture</strong>.</p>
        <p>Build both flows by selecting the correct components below:</p>
      </div>

      <!-- Backend Flow -->
      <div class="arch-flow-builder">
        <div class="flow-header">
          <span class="flow-icon">🏥</span>
          <span class="flow-title">BACKEND (EHR/ERP) PRINTING</span>
        </div>
        <div class="flow-description">System-generated output (lab reports, invoices, etc.)</div>
        
        <div class="flow-slots">
          <div class="flow-slot">
            <label class="slot-label">Source</label>
            <select v-model="backendSource" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Routing</label>
            <select v-model="backendMiddle" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Destination</label>
            <select v-model="backendDest" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Show selected flow -->
        <div v-if="backendSource && backendMiddle && backendDest" class="flow-preview">
          <span class="preview-item">{{ getOptionById(backendSource)?.icon }} {{ getOptionById(backendSource)?.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-item">{{ getOptionById(backendMiddle)?.icon }} {{ getOptionById(backendMiddle)?.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-item">{{ getOptionById(backendDest)?.icon }} {{ getOptionById(backendDest)?.label }}</span>
        </div>
      </div>

      <!-- Frontend Flow -->
      <div class="arch-flow-builder">
        <div class="flow-header">
          <span class="flow-icon">💻</span>
          <span class="flow-title">FRONTEND (USER) PRINTING</span>
        </div>
        <div class="flow-description">User-initiated printing (documents, emails, etc.)</div>
        
        <div class="flow-slots">
          <div class="flow-slot">
            <label class="slot-label">Source</label>
            <select v-model="frontendSource" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Routing</label>
            <select v-model="frontendMiddle" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Destination</label>
            <select v-model="frontendDest" class="slot-select">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Show selected flow -->
        <div v-if="frontendSource && frontendMiddle && frontendDest" class="flow-preview">
          <span class="preview-item">{{ getOptionById(frontendSource)?.icon }} {{ getOptionById(frontendSource)?.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-item">{{ getOptionById(frontendMiddle)?.icon }} {{ getOptionById(frontendMiddle)?.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-item">{{ getOptionById(frontendDest)?.icon }} {{ getOptionById(frontendDest)?.label }}</span>
        </div>
      </div>

      <!-- Hint/Result -->
      <div v-if="allSlotsSelected" class="arch-hint">
        <template v-if="architectureCorrect">
          <span class="hint-success">✓ CORRECT! Both flows use the SAME Edge Service and the SAME printer fleet!</span>
        </template>
        <template v-else>
          <span class="hint-info">💡 Hint: Both flows should use Edge Service for routing (not a Print Server). Remember: Vasion Output eliminates print servers!</span>
        </template>
      </div>

      <button class="btn btn-primary" :disabled="!allSlotsSelected" @click="verifyArchitecture">
        VERIFY ARCHITECTURE →
      </button>
    </div>

    <!-- Part C: Failover Scenario -->
    <div v-if="architectureComplete && !failoverComplete" class="part-section">
      <div class="part-header">
        <span class="part-label">PART C</span>
        <h3 class="part-title">FAILOVER SCENARIO</h3>
      </div>

      <!-- Alert -->
      <div class="alert-box">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">PRINTER ALERT</div>
          <div class="alert-details">
            <p><strong>Printer:</strong> Lab-Floor2-Printer01</p>
            <p><strong>Status:</strong> <span class="status-offline">OFFLINE (paper jam)</span></p>
            <p><strong>Pending Jobs:</strong> 3 lab reports waiting</p>
          </div>
        </div>
      </div>

      <div v-if="!failoverApplied" class="failover-config">
        <div class="console-header">FAILOVER ROUTING CONFIGURATION</div>

        <p class="console-desc">Primary Printer: Lab-Floor2-Printer01 <span class="status-offline">(OFFLINE)</span></p>

        <div class="config-group">
          <label class="config-label">Select failover action:</label>
          <div class="radio-options">
            <label class="radio-option" :class="{ selected: failoverAction === 'redirect' }">
              <input v-model="failoverAction" type="radio" value="redirect" />
              <span class="radio-text">Redirect to alternate printer</span>
            </label>
            <label class="radio-option" :class="{ selected: failoverAction === 'hold' }">
              <input v-model="failoverAction" type="radio" value="hold" />
              <span class="radio-text">Hold jobs until primary is back online</span>
            </label>
            <label class="radio-option" :class="{ selected: failoverAction === 'manual' }">
              <input v-model="failoverAction" type="radio" value="manual" />
              <span class="radio-text">Alert user and require manual intervention</span>
            </label>
          </div>
        </div>

        <div v-if="failoverAction === 'redirect'" class="config-group">
          <label class="config-label">Alternate Printer:</label>
          <select v-model="alternatePrinter" class="config-select">
            <option :value="null">Select printer...</option>
            <option value="printer02">Lab-Floor2-Printer02</option>
            <option value="printer03">Lab-Floor3-Printer01</option>
          </select>
        </div>

        <button class="btn btn-primary" :disabled="!failoverAction || (failoverAction === 'redirect' && !alternatePrinter)" @click="applyFailover">
          APPLY FAILOVER
        </button>
      </div>

      <div v-else class="failover-result">
        <div class="result-header">✓ FAILOVER ACTIVATED</div>

        <div class="jobs-list">
          <div v-for="job in failoverJobs" :key="job.id" class="job-item">
            <div class="job-info">
              <span class="job-name">{{ job.name }}</span>
              <span class="job-routing">
                <span class="old-dest">Lab-Floor2-Printer01</span>
                →
                <span class="new-dest">Lab-Floor2-Printer02</span>
              </span>
            </div>
            <div class="job-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
              </div>
              <span class="progress-label">{{ job.status === 'complete' ? 'Complete' : job.status === 'printing' ? 'Printing...' : job.status === 'spooling' ? 'Spooling...' : 'Queued' }}</span>
            </div>
          </div>
        </div>

        <div v-if="!failoverAnimating" class="result-summary">
          <div class="summary-item">✓ All jobs automatically rerouted</div>
          <div class="summary-item">✓ No disruption to clinical workflow</div>
          <div class="summary-item">✓ No IT intervention required</div>
        </div>
      </div>
    </div>

    <!-- Part D: Verification Questions -->
    <div v-if="failoverComplete && !quizComplete" class="part-section">
      <div class="part-header">
        <span class="part-label">PART D</span>
        <h3 class="part-title">VERIFICATION QUESTIONS</h3>
        <span class="score-display">Score: {{ score }}/{{ questions.length }}</span>
      </div>

      <div v-if="currentQuestion" class="question-card">
        <div class="question-number">QUESTION {{ currentQuestionIndex + 1 }}</div>
        <p class="question-text">{{ currentQuestion.text }}</p>

        <div class="options-list">
          <button
            v-for="option in currentQuestion.options"
            :key="option.id"
            class="option-btn"
            :class="{
              selected: currentQuestion.userAnswer === option.id,
              correct: currentQuestion.answered && option.id === currentQuestion.correctAnswer,
              incorrect: currentQuestion.answered && currentQuestion.userAnswer === option.id && option.id !== currentQuestion.correctAnswer,
            }"
            :disabled="currentQuestion.answered"
            @click="selectAnswer(option.id)"
          >
            <span class="option-letter">{{ option.id.toUpperCase() }})</span>
            <span class="option-text">{{ option.text }}</span>
          </button>
        </div>

        <button v-if="!currentQuestion.answered" class="btn btn-primary submit-btn" :disabled="!currentQuestion.userAnswer" @click="submitAnswer">
          SUBMIT ANSWER
        </button>

        <div v-if="currentQuestion.answered" class="answer-feedback" :class="{ correct: currentQuestion.userAnswer === currentQuestion.correctAnswer }">
          <div class="feedback-header">
            <span class="feedback-icon">{{ currentQuestion.userAnswer === currentQuestion.correctAnswer ? '✓' : '✗' }}</span>
            <span class="feedback-text">{{ currentQuestion.userAnswer === currentQuestion.correctAnswer ? 'CORRECT!' : 'INCORRECT' }}</span>
          </div>
          <div class="feedback-explanation">
            <p>{{ currentQuestion.explanation }}</p>
          </div>
          <button class="btn btn-primary" @click="nextQuestion">
            {{ currentQuestionIndex < questions.length - 1 ? 'NEXT QUESTION →' : 'COMPLETE LEVEL →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 10: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">UNIFIED OUTPUT PLATFORM DEPLOYED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Configured routing logic for intelligent job handling</div>
              <div class="check-item">✓ Set up Vasion Output service (port, server)</div>
              <div class="check-item">✓ Enabled lightweight Edge Service client</div>
              <div class="check-item">✓ Connected EHR/ERP systems to Vasion Output</div>
              <div class="check-item">✓ Tested failover routing and redundancy</div>
            </div>

            <!-- Before/After comparison -->
            <div class="comparison">
              <div class="comparison-col before">
                <h4>BEFORE (Legacy)</h4>
                <ul>
                  <li>2 teams (backend + frontend)</li>
                  <li>2 systems (separate servers)</li>
                  <li>10 physical/virtual servers</li>
                  <li>$18K-$50K/year infrastructure</li>
                  <li>Complex troubleshooting</li>
                  <li>Manual failover</li>
                </ul>
              </div>
              <div class="comparison-col after">
                <h4>AFTER (Vasion Output)</h4>
                <ul>
                  <li>1 unified team</li>
                  <li>1 platform (SaaS)</li>
                  <li>0 print servers</li>
                  <li>$0 infrastructure cost</li>
                  <li>Simplified troubleshooting</li>
                  <li>Automatic failover</li>
                </ul>
              </div>
            </div>

            <div class="savings-highlight">
              <div class="saving-item">💰 ANNUAL SAVINGS: $18,000-$50,000</div>
              <div class="saving-item">🔧 COMPLEXITY REDUCTION: 90%</div>
              <div class="saving-item">👥 TEAM EFFICIENCY: 2 teams → 1 platform</div>
            </div>

            <div class="quiz-score">
              Quiz Score: {{ score }}/{{ questions.length }}
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO FINAL OBJECTIVE 11 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level10-puzzle {
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

.step-indicator,
.score-display {
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

/* Step progress */
.step-progress {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  position: relative;
}

.step-dot.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-glow);
}

.step-dot.complete {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-background);
}

.step-dot.complete::after {
  content: '✓';
}

/* Config step */
.config-step {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.console-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-md);
}

.console-desc {
  color: var(--color-text);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
}

/* Routing rules */
.routing-rules {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.rule-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.rule-header {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.rule-body {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.rule-line {
  margin-bottom: 2px;
}

.rule-actions {
  display: flex;
  gap: var(--space-sm);
}

.rule-btn {
  font-size: 0.7rem;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  color: var(--color-text-dim);
  cursor: pointer;
}

.add-rule-btn {
  width: 100%;
  margin-bottom: var(--space-lg);
}

/* Config groups */
.config-group {
  margin-bottom: var(--space-lg);
}

.config-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.config-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.field-prefix {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  min-width: 120px;
}

.config-input {
  flex: 1;
  min-width: 150px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
}

.config-input.small {
  max-width: 100px;
}

.config-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.config-select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
}

/* Radio options */
.radio-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.radio-option:hover {
  border-color: var(--color-text-dim);
}

.radio-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.radio-option input {
  display: none;
}

.radio-text {
  font-size: 0.85rem;
  color: var(--color-text);
}

/* Toggle option */
.toggle-option {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
}

.toggle-switch {
  width: 48px;
  height: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  position: relative;
  transition: all var(--transition-fast);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--color-text-dim);
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.toggle-option.enabled .toggle-switch {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-option.enabled .toggle-switch::after {
  left: 26px;
  background: var(--color-background);
}

.toggle-option input {
  display: none;
}

.toggle-text {
  font-size: 0.9rem;
  color: var(--color-text);
}

/* Benefits */
.benefits-list {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.benefit {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-xs);
}

.benefits-box {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.benefit-item {
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-bottom: var(--space-xs);
}

/* Connection details */
.connection-details {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.detail-header {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.detail-item {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-xs);
}

.detail-highlight {
  margin-top: var(--space-md);
  padding: var(--space-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--color-text);
}

.detail-highlight code {
  display: block;
  margin-top: var(--space-xs);
  color: var(--color-primary);
  font-family: var(--font-mono);
}

/* Step status */
.step-status {
  color: var(--color-primary);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
  padding: var(--space-sm);
  background: var(--color-primary-glow);
  border-radius: var(--radius-sm);
}

.step-btn {
  width: 100%;
}

/* Architecture builder */
.arch-info-box {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.arch-info-box p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.arch-info-box p:last-child {
  margin-bottom: 0;
}

.arch-flow-builder {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.flow-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.flow-icon {
  font-size: 1.25rem;
}

.flow-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
}

.flow-description {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-lg);
}

.flow-slots {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}

.flow-slot {
  flex: 1;
  min-width: 140px;
  max-width: 200px;
}

.slot-label {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-xs);
  text-align: center;
}

.slot-select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.slot-select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.slot-select:hover {
  border-color: var(--color-text-dim);
}

.flow-connector {
  font-size: 1.5rem;
  color: var(--color-primary);
  padding-bottom: var(--space-sm);
}

.flow-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.preview-item {
  font-size: 0.85rem;
  color: var(--color-text);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-primary-glow);
  border-radius: var(--radius-sm);
}

.preview-arrow {
  color: var(--color-primary);
  font-weight: bold;
}

.arch-hint {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  text-align: center;
}

.hint-success {
  color: var(--color-primary);
  font-weight: bold;
}

.hint-info {
  color: var(--color-warning);
}

/* Alert box */
.alert-box {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(255, 200, 0, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.alert-icon {
  font-size: 2rem;
}

.alert-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-warning);
  margin-bottom: var(--space-sm);
}

.alert-details p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.status-offline {
  color: var(--color-accent);
  font-weight: bold;
}

/* Failover config */
.failover-config {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

/* Failover result */
.failover-result {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.result-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.job-item {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.job-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.job-name {
  font-size: 0.85rem;
  color: var(--color-text);
}

.job-routing {
  font-size: 0.75rem;
}

.old-dest {
  color: var(--color-accent);
  text-decoration: line-through;
}

.new-dest {
  color: var(--color-primary);
}

.job-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-surface-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.1s ease;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  min-width: 80px;
}

.result-summary {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.summary-item {
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-bottom: var(--space-xs);
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

.comparison-col.before h4 {
  color: var(--color-accent);
}

.comparison-col.after h4 {
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

/* Savings highlight */
.savings-highlight {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.saving-item {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
}

.quiz-score {
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-secondary);
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

  .components-palette {
    grid-template-columns: 1fr;
  }
}
</style>

