<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Part A: Authentication state
type AuthMethod = 'badge' | 'pin' | 'credentials'
const authMethodsCompleted = ref<AuthMethod[]>([])
const currentAuthMethod = ref<AuthMethod | null>(null)
const authAnimating = ref(false)
const authSuccess = ref(false)

// PIN entry state
const pinDigits = ref(['', '', '', '', '', ''])
const pinError = ref(false)

// Credentials state
const username = ref('')
const password = ref('')

// Part B: Secure Release state
const printQueueVisible = ref(false)
const printJobs = ref([
  { id: 1, name: 'Patient_Chart_47291.pdf', pages: 8, color: true, time: '2:14 PM', printed: false },
  { id: 2, name: 'Lab_Results_Chen_S.pdf', pages: 3, color: false, time: '1:42 PM', printed: false },
  { id: 3, name: 'Treatment_Plan_Summary.pdf', pages: 12, color: true, time: '11:28 AM', printed: false },
])
const printingJob = ref<number | null>(null)

// Part C & D: Scanning state
const scanningPhase = ref<'menu' | 'qr' | 'connected' | 'scanning' | 'complete'>('menu')
const scanProgress = ref(0)
const uploadProgress = ref(0)

// Overall progress
const showSuccess = ref(false)

const allAuthCompleted = computed(() => authMethodsCompleted.value.length === 3)
const allJobsPrinted = computed(() => printJobs.value.every((job) => job.printed))
const scanComplete = computed(() => scanningPhase.value === 'complete')

const isLevelComplete = computed(() => {
  return allAuthCompleted.value && allJobsPrinted.value && scanComplete.value
})

const baseUrl = import.meta.env.BASE_URL

// Authentication methods
function startAuth(method: AuthMethod) {
  if (authMethodsCompleted.value.includes(method)) return
  currentAuthMethod.value = method
  authSuccess.value = false

  if (method === 'badge') {
    // Badge tap starts immediately
  } else if (method === 'pin') {
    pinDigits.value = ['', '', '', '', '', '']
    pinError.value = false
  } else if (method === 'credentials') {
    username.value = ''
    password.value = ''
  }
}

function simulateBadgeTap() {
  authAnimating.value = true
  playSound('bling1.mp3')

  setTimeout(() => {
    authSuccess.value = true
    authAnimating.value = false
    completeAuth('badge')
  }, 1500)
}

function handlePinInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 1)
  pinDigits.value[index] = value

  if (value && index < 5) {
    const nextInput = document.querySelector(`input[data-pin-index="${index + 1}"]`) as HTMLInputElement
    nextInput?.focus()
  }
}

function handlePinKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) {
    const prevInput = document.querySelector(`input[data-pin-index="${index - 1}"]`) as HTMLInputElement
    prevInput?.focus()
  }
}

function submitPin() {
  const pin = pinDigits.value.join('')
  if (pin.length !== 6) {
    pinError.value = true
    return
  }

  authAnimating.value = true
  playSound('bling1.mp3')

  setTimeout(() => {
    authSuccess.value = true
    authAnimating.value = false
    completeAuth('pin')
  }, 1500)
}

function submitCredentials() {
  if (!username.value.trim() || !password.value.trim()) return

  authAnimating.value = true
  playSound('bling1.mp3')

  setTimeout(() => {
    authSuccess.value = true
    authAnimating.value = false
    completeAuth('credentials')
  }, 1500)
}

function completeAuth(method: AuthMethod) {
  if (!authMethodsCompleted.value.includes(method)) {
    authMethodsCompleted.value.push(method)
  }

  setTimeout(() => {
    currentAuthMethod.value = null
    authSuccess.value = false

    // After all auth methods, show print queue
    if (allAuthCompleted.value) {
      setTimeout(() => {
        printQueueVisible.value = true
      }, 500)
    }
  }, 2000)
}

// Print queue methods
function printJob(jobId: number) {
  if (printingJob.value !== null) return

  printingJob.value = jobId
  playSound('bling1.mp3')

  setTimeout(() => {
    const job = printJobs.value.find((j) => j.id === jobId)
    if (job) {
      job.printed = true
    }
    printingJob.value = null

    // Check if all printed, show scanning
    if (allJobsPrinted.value) {
      setTimeout(() => {
        scanningPhase.value = 'menu'
      }, 1000)
    }
  }, 2000)
}

function deleteJob(jobId: number) {
  const job = printJobs.value.find((j) => j.id === jobId)
  if (job) {
    job.printed = true // Mark as "handled"
  }
}

// Scanning methods
function selectScanToStorage() {
  scanningPhase.value = 'qr'
}

function simulateQRScan() {
  playSound('bling1.mp3')
  setTimeout(() => {
    scanningPhase.value = 'connected'
  }, 1500)
}

function startScanning() {
  scanningPhase.value = 'scanning'
  scanProgress.value = 0
  uploadProgress.value = 0

  // Simulate scanning pages
  const scanInterval = setInterval(() => {
    scanProgress.value += 33
    if (scanProgress.value >= 100) {
      clearInterval(scanInterval)
      scanProgress.value = 100

      // Simulate upload
      const uploadInterval = setInterval(() => {
        uploadProgress.value += 20
        if (uploadProgress.value >= 100) {
          clearInterval(uploadInterval)
          uploadProgress.value = 100
          playSound('bling1.mp3')

          setTimeout(() => {
            scanningPhase.value = 'complete'
            checkCompletion()
          }, 500)
        }
      }, 300)
    }
  }, 500)
}

function checkCompletion() {
  if (isLevelComplete.value) {
    setTimeout(() => {
      showSuccess.value = true
    }, 1500)
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
  gameStore.completeLevel(6)
  router.push({ name: 'level', params: { id: '7' } })
}
</script>

<template>
  <div class="level6-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries MFD Floor</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="incident-report">
        <div class="incident-header">⚠️ SECURITY INCIDENT REPORT ⚠️</div>
        <div class="incident-content">
          <p><strong>Incident:</strong> Confidential patient medical records found abandoned on printer tray.</p>
          <p class="incident-highlight">Time on printer tray: 47 minutes unattended</p>
          <p class="incident-action">Your mission: Deploy <strong>Secure Release</strong> printing to prevent document theft.</p>
        </div>
      </div>
    </div>

    <!-- Part A: MFD Authentication -->
    <div class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">MFD AUTHENTICATION</h3>
        <span class="part-progress">{{ authMethodsCompleted.length }}/3</span>
      </div>

      <!-- MFD Screen -->
      <div class="mfd-device">
        <div class="mfd-bezel">
          <div class="mfd-screen">
            <div class="mfd-header">
              <span class="mfd-logo">VASION CONTROL PANEL APP</span>
              <span class="mfd-subtitle">Welcome to Apex Industries MFD</span>
            </div>

            <!-- Auth method selection -->
            <div v-if="!currentAuthMethod" class="auth-selection">
              <div class="auth-prompt">👤 Please Authenticate</div>
              <p class="auth-instruction">Demonstrate all three authentication methods:</p>

              <div class="auth-methods">
                <button
                  class="auth-method-btn"
                  :class="{ completed: authMethodsCompleted.includes('badge') }"
                  @click="startAuth('badge')"
                >
                  <span class="method-icon">📡</span>
                  <span class="method-name">Badge Tap</span>
                  <span v-if="authMethodsCompleted.includes('badge')" class="method-check">✓</span>
                </button>

                <button
                  class="auth-method-btn"
                  :class="{ completed: authMethodsCompleted.includes('pin') }"
                  @click="startAuth('pin')"
                >
                  <span class="method-icon">🔢</span>
                  <span class="method-name">PIN Entry</span>
                  <span v-if="authMethodsCompleted.includes('pin')" class="method-check">✓</span>
                </button>

                <button
                  class="auth-method-btn"
                  :class="{ completed: authMethodsCompleted.includes('credentials') }"
                  @click="startAuth('credentials')"
                >
                  <span class="method-icon">🔐</span>
                  <span class="method-name">Username/Password</span>
                  <span v-if="authMethodsCompleted.includes('credentials')" class="method-check">✓</span>
                </button>
              </div>
            </div>

            <!-- Badge Tap Interface -->
            <div v-else-if="currentAuthMethod === 'badge'" class="auth-interface">
              <div v-if="!authSuccess" class="badge-tap-area" :class="{ animating: authAnimating }" @click="simulateBadgeTap">
                <div class="nfc-rings">
                  <div class="nfc-ring"></div>
                  <div class="nfc-ring"></div>
                  <div class="nfc-ring"></div>
                </div>
                <span class="badge-icon">🪪</span>
                <span class="badge-text">{{ authAnimating ? 'Reading badge...' : 'TAP YOUR BADGE HERE' }}</span>
              </div>

              <div v-else class="auth-result">
                <div class="result-header">📡 NFC DETECTED</div>
                <div class="result-progress">[████████████████] 100%</div>
                <div class="result-details">
                  <p>✓ Badge ID: 47291</p>
                  <p>✓ User: Dr. Sarah Chen</p>
                  <p>✓ Department: Cardiology</p>
                  <p>✓ Authorized</p>
                </div>
                <div class="result-success">Authentication successful</div>
              </div>
            </div>

            <!-- PIN Entry Interface -->
            <div v-else-if="currentAuthMethod === 'pin'" class="auth-interface">
              <div v-if="!authSuccess" class="pin-entry">
                <div class="pin-header">PIN Entry</div>
                <div class="pin-display" :class="{ error: pinError }">
                  <input
                    v-for="(digit, index) in pinDigits"
                    :key="index"
                    :value="digit"
                    :data-pin-index="index"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="pin-digit"
                    @input="handlePinInput(index, $event)"
                    @keydown="handlePinKeydown(index, $event)"
                  />
                </div>
                <div class="pin-pad">
                  <button v-for="n in 9" :key="n" class="pin-btn" @click="() => {
                    const emptyIndex = pinDigits.findIndex(d => d === '')
                    if (emptyIndex !== -1) pinDigits[emptyIndex] = String(n)
                  }">{{ n }}</button>
                  <button class="pin-btn"></button>
                  <button class="pin-btn" @click="() => {
                    const emptyIndex = pinDigits.findIndex(d => d === '')
                    if (emptyIndex !== -1) pinDigits[emptyIndex] = '0'
                  }">0</button>
                  <button class="pin-btn" @click="() => {
                    const lastIndex = pinDigits.map((d, i) => d ? i : -1).filter(i => i !== -1).pop()
                    if (lastIndex !== undefined) pinDigits[lastIndex] = ''
                  }">←</button>
                </div>
                <button class="submit-btn" :disabled="pinDigits.some(d => !d)" @click="submitPin">SUBMIT</button>
              </div>

              <div v-else class="auth-result">
                <div class="result-header">🔢 PIN VERIFIED</div>
                <div class="result-progress">[████████████████] 100%</div>
                <div class="result-details">
                  <p>✓ PIN: {{ pinDigits.join('') }}</p>
                  <p>✓ User: Dr. Sarah Chen</p>
                  <p>✓ Department: Cardiology</p>
                  <p>✓ Authorized</p>
                </div>
                <div class="result-success">Authentication successful</div>
              </div>
            </div>

            <!-- Credentials Interface -->
            <div v-else-if="currentAuthMethod === 'credentials'" class="auth-interface">
              <div v-if="!authSuccess" class="credentials-entry">
                <div class="cred-header">Login</div>
                <div class="cred-form">
                  <label class="cred-label">Username:</label>
                  <input v-model="username" type="text" class="cred-input" placeholder="schen@apex.com" />

                  <label class="cred-label">Password:</label>
                  <input v-model="password" type="password" class="cred-input" placeholder="••••••••" />
                </div>
                <button class="submit-btn" :disabled="!username.trim() || !password.trim()" @click="submitCredentials">LOGIN</button>
              </div>

              <div v-else class="auth-result">
                <div class="result-header">🔐 CREDENTIALS VERIFIED</div>
                <div class="result-progress">[████████████████] 100%</div>
                <div class="result-details">
                  <p>✓ Username: {{ username || 'schen@apex.com' }}</p>
                  <p>✓ User: Dr. Sarah Chen</p>
                  <p>✓ Department: Cardiology</p>
                  <p>✓ Authorized</p>
                </div>
                <div class="result-success">Authentication successful</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unified CPA info -->
      <div v-if="allAuthCompleted" class="info-box">
        <div class="info-header">🎯 UNIFIED CONTROL PANEL APPLICATION (CPA)</div>
        <p>The same interface works across ALL MFD manufacturers:</p>
        <div class="manufacturer-list">
          <span>HP</span><span>Canon</span><span>Xerox</span><span>Ricoh</span>
          <span>Lexmark</span><span>Konica</span><span>Sharp</span><span>Kyocera</span>
          <span>FujiXerox</span><span>Fujifilm</span><span>Epson</span>
        </div>
        <p class="info-benefit">Users only learn ONE interface. IT only trains users once!</p>
      </div>
    </div>

    <!-- Part B: Secure Release Print Queue -->
    <Transition name="expand">
      <div v-if="printQueueVisible" class="part-section">
        <div class="part-header">
          <span class="part-label">PART B</span>
          <h3 class="part-title">SECURE RELEASE PRINTING</h3>
          <span class="part-progress">{{ printJobs.filter(j => j.printed).length }}/{{ printJobs.length }}</span>
        </div>

        <div class="mfd-device">
          <div class="mfd-bezel">
            <div class="mfd-screen">
              <div class="queue-header">
                <span class="welcome-text">Welcome, Dr. Sarah Chen</span>
                <span class="queue-title">Your Held Print Jobs:</span>
              </div>

              <div class="print-queue">
                <div v-for="job in printJobs" :key="job.id" class="print-job" :class="{ printed: job.printed, printing: printingJob === job.id }">
                  <div class="job-info">
                    <span class="job-icon">📄</span>
                    <div class="job-details">
                      <span class="job-name">{{ job.name }}</span>
                      <span class="job-meta">Pages: {{ job.pages }} │ {{ job.color ? 'Color' : 'B&W' }} │ Confidential</span>
                      <span class="job-time">Sent: {{ job.time }}</span>
                    </div>
                  </div>

                  <div v-if="printingJob === job.id" class="job-printing">
                    <span class="printing-text">🖨️ PRINTING...</span>
                    <div class="printing-progress">[████████████████]</div>
                  </div>

                  <div v-else-if="job.printed" class="job-printed">
                    <span class="printed-icon">✓</span>
                    <span class="printed-text">Released</span>
                  </div>

                  <div v-else class="job-actions">
                    <button class="job-btn print-btn" @click="printJob(job.id)">PRINT NOW</button>
                    <button class="job-btn delete-btn" @click="deleteJob(job.id)">DELETE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="allJobsPrinted" class="security-comparison">
          <div class="compare-header">SECURITY IMPROVEMENT</div>
          <div class="compare-grid">
            <div class="compare-before">
              <h4>❌ BEFORE (Insecure)</h4>
              <ul>
                <li>Documents print immediately</li>
                <li>Sensitive docs sit unattended</li>
                <li>Anyone can grab materials</li>
                <li>No audit trail</li>
              </ul>
            </div>
            <div class="compare-after">
              <h4>✓ AFTER (Secure Release)</h4>
              <ul>
                <li>Jobs held until authenticated</li>
                <li>User physically present</li>
                <li>Release at ANY MFD</li>
                <li>Full audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Part C & D: Scanning to Cloud -->
    <Transition name="expand">
      <div v-if="allJobsPrinted" class="part-section">
        <div class="part-header">
          <span class="part-label">PART C</span>
          <h3 class="part-title">SIMPLIFIED SCANNING TO CLOUD</h3>
        </div>

        <div class="mfd-device">
          <div class="mfd-bezel">
            <div class="mfd-screen">
              <!-- Scan Menu -->
              <div v-if="scanningPhase === 'menu'" class="scan-menu">
                <div class="scan-header">Welcome, Dr. Sarah Chen</div>
                <div class="scan-options">
                  <div class="scan-title">Scan Options:</div>
                  <button class="scan-option-btn" disabled>Scan to Email</button>
                  <button class="scan-option-btn highlight" @click="selectScanToStorage">Scan to Storage ←</button>
                  <button class="scan-option-btn" disabled>Scan to Folder</button>
                </div>
              </div>

              <!-- QR Code Setup -->
              <div v-else-if="scanningPhase === 'qr'" class="qr-setup">
                <div class="qr-header">🔗 CONNECT YOUR ONEDRIVE</div>
                <p class="qr-instruction">First time setup: Link your OneDrive account</p>

                <div class="qr-code-area" @click="simulateQRScan">
                  <div class="qr-placeholder">
                    <div class="qr-pattern">
                      <div class="qr-row"><span>███</span><span>▀▀▀</span><span>▀▀</span></div>
                      <div class="qr-row"><span>█ █</span><span>▀ █</span><span>█▀█</span></div>
                      <div class="qr-row"><span>█▀█</span><span> ▀█</span><span>▀ ▀</span></div>
                    </div>
                  </div>
                  <span class="qr-tap-hint">TAP TO SIMULATE QR SCAN</span>
                </div>

                <div class="qr-alt">
                  <span>Or enter code:</span>
                  <span class="qr-code-text">APEX-4729</span>
                </div>
              </div>

              <!-- Connected -->
              <div v-else-if="scanningPhase === 'connected'" class="scan-connected">
                <div class="connected-header">✓ ONEDRIVE CONNECTED</div>
                <div class="connected-details">
                  <p>Account: schen@apex.com</p>
                  <p>Default folder: OneDrive/Documents/Scanned Files</p>
                </div>
                <p class="connected-info">You can now scan documents directly to your OneDrive!</p>
                <button class="start-scan-btn" @click="startScanning">START SCANNING</button>
              </div>

              <!-- Scanning in progress -->
              <div v-else-if="scanningPhase === 'scanning'" class="scanning-progress">
                <div class="scanning-header">📄 SCANNING...</div>

                <div class="scan-pages">
                  <div class="page-progress" :class="{ complete: scanProgress >= 33 }">
                    Page 1: [{{ scanProgress >= 33 ? '████████████████' : '████████' }}] {{ scanProgress >= 33 ? '100%' : '...' }}
                  </div>
                  <div class="page-progress" :class="{ complete: scanProgress >= 66 }">
                    Page 2: [{{ scanProgress >= 66 ? '████████████████' : scanProgress >= 33 ? '████████' : '' }}] {{ scanProgress >= 66 ? '100%' : '...' }}
                  </div>
                  <div class="page-progress" :class="{ complete: scanProgress >= 100 }">
                    Page 3: [{{ scanProgress >= 100 ? '████████████████' : scanProgress >= 66 ? '████████' : '' }}] {{ scanProgress >= 100 ? '100%' : '...' }}
                  </div>
                </div>

                <div v-if="scanProgress >= 100" class="upload-section">
                  <div class="upload-header">📤 Uploading to OneDrive...</div>
                  <div class="upload-bar">
                    <div class="upload-fill" :style="{ width: uploadProgress + '%' }"></div>
                  </div>
                </div>
              </div>

              <!-- Scan Complete -->
              <div v-else-if="scanningPhase === 'complete'" class="scan-complete">
                <div class="complete-header">✓ COMPLETE</div>
                <div class="complete-details">
                  <p>✓ 3 pages scanned</p>
                  <p class="file-name">File saved: 2025-12-18_14-32_schen_scan.pdf</p>
                  <p class="file-location">Location: OneDrive/Documents/Scanned Files/</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 6: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">SECURE RELEASE & SIMPLIFIED SCANNING DEPLOYED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Demonstrated three authentication methods</div>
              <div class="check-item">✓ Activated secure release (pull print)</div>
              <div class="check-item">✓ Set up simplified scanning to OneDrive</div>
              <div class="check-item">✓ Completed user first-time QR code setup</div>
            </div>

            <div class="improvements-section">
              <div class="improvement-box">
                <h4>SECURE RELEASE BENEFITS:</h4>
                <ul>
                  <li>Jobs held until user authenticates at MFD</li>
                  <li>User physically present to retrieve documents</li>
                  <li>Can release jobs at ANY MFD (mobility)</li>
                  <li>Full audit trail of all print releases</li>
                  <li>HIPAA/compliance requirements met</li>
                </ul>
              </div>

              <div class="improvement-box">
                <h4>SIMPLIFIED SCANNING BENEFITS:</h4>
                <ul>
                  <li>Unified CPA interface on all MFDs</li>
                  <li>One-time QR code setup per user</li>
                  <li>Scan directly to cloud storage</li>
                  <li>Works with OneDrive, SharePoint, Google Drive</li>
                  <li>Consistent interface - no training needed</li>
                </ul>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>Three authentication methods: Badge tap, PIN, username/password</li>
                <li>Secure release holds jobs until user authenticates—prevents document theft</li>
                <li>CPA provides unified interface across all MFD manufacturers</li>
                <li>Simplified scanning: QR code setup, then scan directly to cloud</li>
              </ul>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 7 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level6-puzzle {
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

.incident-report {
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 100, 0, 0.1));
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.incident-header {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-accent);
  text-align: center;
  margin-bottom: var(--space-md);
  letter-spacing: 0.1em;
}

.incident-content p {
  color: var(--color-text);
  font-size: 0.85rem;
  margin-bottom: var(--space-sm);
}

.incident-highlight {
  color: var(--color-accent) !important;
  font-weight: bold;
}

.incident-action {
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

/* MFD Device */
.mfd-device {
  max-width: 500px;
  margin: 0 auto var(--space-lg);
}

.mfd-bezel {
  background: linear-gradient(145deg, #2a2a3a, #1a1a2a);
  border: 3px solid #444;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.mfd-screen {
  background: linear-gradient(180deg, #0d1117, #161b22);
  border: 2px solid #333;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  min-height: 300px;
}

.mfd-header {
  text-align: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.mfd-logo {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
}

.mfd-subtitle {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin-top: var(--space-xs);
}

/* Auth Selection */
.auth-selection {
  text-align: center;
}

.auth-prompt {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.auth-instruction {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-lg);
}

.auth-methods {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.auth-method-btn {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auth-method-btn:hover:not(.completed) {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.auth-method-btn.completed {
  border-color: var(--color-primary);
  opacity: 0.7;
}

.method-icon {
  font-size: 1.5rem;
}

.method-name {
  flex: 1;
  text-align: left;
  font-size: 0.9rem;
}

.method-check {
  color: var(--color-primary);
  font-size: 1.25rem;
}

/* Badge Tap */
.badge-tap-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--color-surface);
  border: 3px dashed var(--color-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.badge-tap-area:hover {
  border-color: var(--color-primary);
}

.badge-tap-area.animating {
  border-style: solid;
  border-color: var(--color-primary);
}

.nfc-rings {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nfc-ring {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  opacity: 0;
}

.badge-tap-area.animating .nfc-ring {
  animation: nfc-pulse 1.5s ease-out infinite;
}

.badge-tap-area.animating .nfc-ring:nth-child(2) {
  animation-delay: 0.3s;
}

.badge-tap-area.animating .nfc-ring:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes nfc-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.badge-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
  z-index: 1;
}

.badge-text {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  z-index: 1;
}

/* Auth Result */
.auth-result {
  text-align: center;
  padding: var(--space-lg);
}

.result-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.result-progress {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.result-details {
  text-align: left;
  background: var(--color-surface);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.result-details p {
  font-size: 0.8rem;
  color: var(--color-text);
  margin: var(--space-xs) 0;
}

.result-success {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-primary);
}

/* PIN Entry */
.pin-entry {
  text-align: center;
}

.pin-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.pin-display.error {
  animation: shake 0.5s ease;
}

.pin-digit {
  width: 40px;
  height: 50px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.5rem;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  padding: 0px;
}

.pin-digit:focus {
  border-color: var(--color-primary);
  outline: none;
}

.pin-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
  max-width: 200px;
  margin: 0 auto var(--space-md);
}

.pin-btn {
  padding: var(--space-md);
  font-family: var(--font-display);
  font-size: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
}

.pin-btn:hover {
  background: var(--color-surface-elevated);
}

.submit-btn {
  padding: var(--space-md) var(--space-xl);
  font-family: var(--font-display);
  font-size: 0.85rem;
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Credentials Entry */
.credentials-entry {
  text-align: center;
}

.cred-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.cred-form {
  text-align: left;
  margin-bottom: var(--space-md);
}

.cred-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-xs);
}

.cred-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
  margin-bottom: var(--space-md);
}

.cred-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

/* Info Box */
.info-box {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
}

.info-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
}

.info-box p {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  margin-bottom: var(--space-md);
}

.manufacturer-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.manufacturer-list span {
  padding: 4px 8px;
  background: var(--color-surface);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--color-text);
}

.info-benefit {
  color: var(--color-primary) !important;
  font-weight: 600;
}

/* Print Queue */
.queue-header {
  margin-bottom: var(--space-md);
}

.welcome-text {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.queue-title {
  display: block;
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-text);
  margin-top: var(--space-xs);
}

.print-queue {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.print-job {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  transition: all var(--transition-fast);
}

.print-job.printed {
  opacity: 0.6;
}

.print-job.printing {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.job-info {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.job-icon {
  font-size: 1.5rem;
}

.job-details {
  flex: 1;
}

.job-name {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text);
  font-weight: 500;
}

.job-meta {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin-top: 2px;
}

.job-time {
  display: block;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.job-actions {
  display: flex;
  gap: var(--space-sm);
}

.job-btn {
  flex: 1;
  padding: var(--space-sm);
  font-family: var(--font-display);
  font-size: 0.7rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.print-btn {
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
}

.delete-btn {
  background: transparent;
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
}

.job-printing {
  text-align: center;
}

.printing-text {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-primary);
  margin-bottom: var(--space-xs);
}

.printing-progress {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary);
}

.job-printed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.printed-icon {
  color: var(--color-primary);
}

.printed-text {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

/* Security Comparison */
.security-comparison {
  margin-top: var(--space-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.compare-header {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-secondary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.compare-before,
.compare-after {
  padding: var(--space-md);
  border-radius: var(--radius-sm);
}

.compare-before {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.compare-after {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.compare-before h4 {
  color: var(--color-accent);
  font-size: 0.75rem;
  margin-bottom: var(--space-sm);
}

.compare-after h4 {
  color: var(--color-primary);
  font-size: 0.75rem;
  margin-bottom: var(--space-sm);
}

.compare-before ul,
.compare-after ul {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.compare-before li,
.compare-after li {
  margin-bottom: 2px;
}

/* Scanning */
.scan-menu,
.qr-setup,
.scan-connected,
.scanning-progress,
.scan-complete {
  text-align: center;
}

.scan-header {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
}

.scan-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.scan-option-btn {
  display: block;
  width: 100%;
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
}

.scan-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scan-option-btn.highlight {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.scan-option-btn.highlight:hover {
  background: var(--color-primary-glow);
}

/* QR Setup */
.qr-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.qr-instruction {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-lg);
}

.qr-code-area {
  background: white;
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  display: inline-block;
  cursor: pointer;
  margin-bottom: var(--space-md);
}

.qr-placeholder {
  margin-bottom: var(--space-sm);
}

.qr-pattern {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  line-height: 1.2;
  color: #000;
}

.qr-tap-hint {
  display: block;
  font-size: 0.7rem;
  color: #666;
}

.qr-alt {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.qr-code-text {
  display: block;
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-primary);
  margin-top: var(--space-xs);
}

/* Connected */
.connected-header {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.connected-details {
  background: var(--color-surface);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.connected-details p {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin: var(--space-xs) 0;
}

.connected-info {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

.start-scan-btn {
  padding: var(--space-md) var(--space-xl);
  font-family: var(--font-display);
  font-size: 0.9rem;
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Scanning Progress */
.scanning-header {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
}

.scan-pages {
  text-align: left;
  margin-bottom: var(--space-lg);
}

.page-progress {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.page-progress.complete {
  color: var(--color-primary);
}

.upload-section {
  margin-top: var(--space-lg);
}

.upload-header {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.upload-bar {
  height: 8px;
  background: var(--color-surface);
  border-radius: 4px;
  overflow: hidden;
}

.upload-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

/* Scan Complete */
.complete-header {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
}

.complete-details {
  background: var(--color-surface);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
}

.complete-details p {
  font-size: 0.85rem;
  color: var(--color-text);
  margin: var(--space-xs) 0;
}

.file-name {
  font-family: var(--font-mono);
  color: var(--color-primary) !important;
}

.file-location {
  color: var(--color-text-dim) !important;
  font-size: 0.75rem !important;
}

/* Success Modal */
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

.improvements-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.improvement-box {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.improvement-box h4 {
  font-size: 0.7rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.improvement-box ul {
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.improvement-box li {
  margin-bottom: 2px;
  padding-left: var(--space-sm);
  position: relative;
}

.improvement-box li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-size: 0.6rem;
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
.expand-enter-active,
.expand-leave-active {
  transition: all 0.5s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

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
  .compare-grid {
    grid-template-columns: 1fr;
  }

  .improvements-section {
    grid-template-columns: 1fr;
  }

  .pin-digit {
    width: 35px;
    height: 45px;
    font-size: 1.25rem;
  }
}
</style>

