<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Part A: Authentication state
const password = ref('')
const passwordVerified = ref(false)
const bonusAwarded = ref(false)
const mfaCode = ref(['', '', '', '', '', ''])
const mfaVerified = ref(false)
const mfaError = ref(false)
const showMorseChart = ref(true)
const isPlaying = ref(false)
const morseAudio = ref<HTMLAudioElement | null>(null)

// Part B: Architecture state (click-to-order like Level 11)
interface ArchStep {
  id: string
  label: string
  description: string
  icon: string
  order: number | null
}

const archSteps = ref<ArchStep[]>([
  { id: 'remote', label: 'REMOTE USER', description: 'Working from home, outside corporate network', icon: '🏠', order: null },
  { id: 'tls', label: 'TLS HANDSHAKE', description: 'Port 443, secure HTTPS encryption', icon: '🔒', order: null },
  { id: 'gateway', label: 'SECURE GATEWAY', description: 'Cloud infrastructure, stores encrypted job', icon: '☁️', order: null },
  { id: 'edge', label: 'EDGE SERVICE', description: 'On-premise or embedded, pulls from gateway', icon: '🔗', order: null },
  { id: 'printer', label: 'PRINTER', description: 'Office device, receives via port 9100', icon: '🖨️', order: null },
])

const correctOrder = ['remote', 'tls', 'gateway', 'edge', 'printer']
const currentOrderStep = ref(1)
const archVerified = ref(false)
const architectureComplete = ref(false)

const archCorrect = computed(() => {
  const userOrder = archSteps.value
    .filter((s) => s.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => s.id)
  return JSON.stringify(userOrder) === JSON.stringify(correctOrder)
})

// Animation state
const showSecurityAnimation = ref(false)
const animationStep = ref(0)
const showSuccess = ref(false)
const showHint = ref(false)
const feedback = ref<{ type: 'correct' | 'incorrect' | 'bonus'; message: string } | null>(null)

// Computed
const allStepsSelected = computed(() => {
  return archSteps.value.every((s) => s.order !== null)
})

// Morse code reference for display
const morseReference = [
  { char: 'A', code: '·−' },
  { char: 'B', code: '−···' },
  { char: 'C', code: '−·−·' },
  { char: 'D', code: '−··' },
  { char: 'E', code: '·' },
  { char: 'F', code: '··−·' },
  { char: 'G', code: '−−·' },
  { char: 'H', code: '····' },
  { char: 'I', code: '··' },
  { char: 'J', code: '·−−−' },
  { char: 'K', code: '−·−' },
  { char: 'L', code: '·−··' },
  { char: 'M', code: '−−' },
  { char: 'N', code: '−·' },
  { char: 'O', code: '−−−' },
  { char: 'P', code: '·−−·' },
  { char: 'Q', code: '−−·−' },
  { char: 'R', code: '·−·' },
  { char: 'S', code: '···' },
  { char: 'T', code: '−' },
  { char: 'U', code: '··−' },
  { char: 'V', code: '···−' },
  { char: 'W', code: '·−−' },
  { char: 'X', code: '−··−' },
  { char: 'Y', code: '−·−−' },
  { char: 'Z', code: '−−··' },
  { char: '0', code: '−−−−−' },
  { char: '1', code: '·−−−−' },
  { char: '2', code: '··−−−' },
  { char: '3', code: '···−−' },
  { char: '4', code: '····−' },
  { char: '5', code: '·····' },
  { char: '6', code: '−····' },
  { char: '7', code: '−−···' },
  { char: '8', code: '−−−··' },
  { char: '9', code: '−−−−·' },
]

// Methods
function verifyPassword() {
  if (!password.value.trim()) return

  // Check for bonus secret phrase
  if (password.value.toLowerCase() === 'i am a secret agent') {
    bonusAwarded.value = true
    playBonusSound()
    showFeedback('bonus', '🎉 BONUS! Secret phrase detected!')
  } else {
    showFeedback('correct', 'PASSWORD ACCEPTED')
  }

  passwordVerified.value = true
}

const baseUrl = import.meta.env.BASE_URL

function playBonusSound() {
  try {
    const audio = new Audio(`${baseUrl}sounds/bling1.mp3`)
    audio.volume = 0.5
    audio.play().catch(() => {
      // Audio play failed, ignore silently
    })
  } catch {
    // Audio not available, ignore
  }
}

function playMorseCode() {
  if (isPlaying.value && morseAudio.value) {
    morseAudio.value.pause()
    morseAudio.value.currentTime = 0
    isPlaying.value = false
    return
  }

  try {
    if (!morseAudio.value) {
      morseAudio.value = new Audio(`${baseUrl}sounds/morsecode.mp3`)
      morseAudio.value.addEventListener('ended', () => {
        isPlaying.value = false
      })
    }
    morseAudio.value.currentTime = 0
    morseAudio.value.volume = 0.7
    morseAudio.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {
      // Audio play failed
      isPlaying.value = false
    })
  } catch {
    // Audio not available
    isPlaying.value = false
  }
}

function handleMfaInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 1)
  mfaCode.value[index] = value

  // Auto-focus next input
  if (value && index < 5) {
    const nextInput = document.querySelector(`input[data-mfa-index="${index + 1}"]`) as HTMLInputElement
    nextInput?.focus()
  }
}

function handleMfaKeydown(index: number, event: KeyboardEvent) {
  // Handle backspace to go to previous input
  if (event.key === 'Backspace' && !mfaCode.value[index] && index > 0) {
    const prevInput = document.querySelector(`input[data-mfa-index="${index - 1}"]`) as HTMLInputElement
    prevInput?.focus()
  }
}

function verifyMfaCode() {
  const code = mfaCode.value.join('')
  if (code === '742963') {
    mfaVerified.value = true
    mfaError.value = false
    showFeedback('correct', 'MFA CODE VERIFIED')
  } else {
    mfaError.value = true
    showFeedback('incorrect', 'Invalid code. Listen to the morse transmission again.')
    // Clear after shake animation
    setTimeout(() => {
      mfaError.value = false
    }, 500)
  }
}

// Part B: Architecture methods (click-to-order like Level 11)
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
    playBonusSound()
  }
}

function verifyArchitecture() {
  archVerified.value = true
  if (archCorrect.value) {
    architectureComplete.value = true
    showFeedback('correct', 'SECURE ARCHITECTURE DEPLOYED')
    startSecurityAnimation()
  } else {
    showFeedback('incorrect', 'Incorrect sequence (-5 points). Review the correct flow.')
  }
}

function proceedAfterIncorrect() {
  // Deduct 5 points for incorrect answer
  gameStore.deductPoints(5)
  architectureComplete.value = true
  startSecurityAnimation()
}

function startSecurityAnimation() {
  showSecurityAnimation.value = true
  animationStep.value = 0

  const steps: number[] = [1, 2, 3, 4, 5]
  let currentStep = 0

  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      animationStep.value = steps[currentStep] as number
      currentStep++
    } else {
      clearInterval(interval)
      setTimeout(() => {
        showSecurityAnimation.value = false
        showSuccess.value = true
      }, 1500)
    }
  }, 1200)
}

function showFeedback(type: 'correct' | 'incorrect' | 'bonus', message: string) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = null
  }, 2500)
}

function revealHint() {
  if (!showHint.value) {
    showHint.value = true
    gameStore.useHint(4)
  }
}

function proceed() {
  gameStore.completeLevel(4)
  router.push({ name: 'level', params: { id: '5' } })
}

onMounted(() => {
  // Shuffle arch steps for initial display
  archSteps.value = archSteps.value.sort(() => Math.random() - 0.5)
})
</script>

<template>
  <div class="level4-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Security Operations Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐⭐ Advanced</span>
      </div>

      <div class="security-alert">
        <div class="alert-header">⚠️ SECURITY ALERT ⚠️</div>
        <div class="alert-content">
          <p>Enemy agents detected attempting remote access to Apex systems.</p>
          <p>Legacy "trust but verify" security has been compromised.</p>
          <p class="protocol"><strong>Initiating Zero Trust Protocol:</strong> NEVER TRUST, ALWAYS VERIFY</p>
        </div>
      </div>

      <!-- Hint section -->
      <div class="hint-section">
        <button v-if="!showHint" class="hint-btn" @click="revealHint">? REQUEST INTEL (-5 points)</button>
        <div v-else class="hint-content">
          <span class="hint-label">INTEL:</span>
          <p>MFA Code: Listen carefully - 7 (−−···), 4 (····−), 2 (··−−−), 9 (−−−−·), 6 (−····), 3 (···−−)</p>
          <p>Architecture: Remote User → TLS → Gateway → Edge Service → Printer</p>
        </div>
      </div>
    </div>

    <!-- Feedback toast -->
    <Transition name="feedback">
      <div v-if="feedback" class="feedback-toast" :class="feedback.type">
        <span class="feedback-icon">
          {{ feedback.type === 'correct' ? '✓' : feedback.type === 'bonus' ? '🎉' : '✗' }}
        </span>
        <span class="feedback-text">{{ feedback.message }}</span>
      </div>
    </Transition>

    <!-- Part A: Authentication -->
    <div class="part-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">ZERO TRUST AUTHENTICATION</h3>
      </div>

      <!-- Step 1: Password -->
      <div class="auth-step" :class="{ completed: passwordVerified }">
        <div class="step-header">
          <span class="step-number">STEP 1</span>
          <span class="step-title">PASSWORD VERIFICATION</span>
          <img src="@/assets/1103-nokia-phone.gif" alt="Nokia phone" class="step-gif" />
          <span v-if="passwordVerified" class="step-status">✓</span>
        </div>

        <div v-if="!passwordVerified" class="password-input-section">
          <label class="input-label">Enter your password:</label>
          <div class="password-input-wrapper">
            <input v-model="password" type="password" class="password-input" placeholder="••••••••••••" @keyup.enter="verifyPassword" />
            <button class="verify-btn" @click="verifyPassword">VERIFY</button>
          </div>
        </div>

        <div v-else class="step-verified">
          <span class="verified-icon">✓</span>
          <span class="verified-text">PASSWORD ACCEPTED</span>
          <span v-if="bonusAwarded" class="bonus-badge">🎉 BONUS!</span>
        </div>
      </div>

      <!-- Step 2: Signal Intercept -->
      <div class="auth-step" :class="{ completed: mfaVerified, locked: !passwordVerified }">
        <div class="step-header">
          <span class="step-number">STEP 2</span>
          <span class="step-title">SIGNAL INTERCEPT 📡</span>
          <span v-if="mfaVerified" class="step-status">✓</span>
          <span v-else-if="!passwordVerified" class="step-status locked">🔒</span>
        </div>

        <template v-if="passwordVerified && !mfaVerified">
          <div class="morse-challenge">
            <div class="morse-intro">
              <p>📡 We've intercepted an encrypted transmission containing your MFA verification code.</p>
              <p>Use the morse code reference to decode the 6-digit sequence.</p>
            </div>

            <!-- Audio player -->
            <div class="signal-intercept-player">
              <div class="intercept-header">
                <span class="intercept-icon">🛰️</span>
                <span class="intercept-label">ENCRYPTED TRANSMISSION</span>
              </div>
              <div class="intercept-visual" :class="{ active: isPlaying }">
                <div class="signal-wave"></div>
                <div class="signal-wave"></div>
                <div class="signal-wave"></div>
              </div>
              <button class="play-transmission-btn" :class="{ playing: isPlaying }" @click="playMorseCode">
                <span class="play-icon">{{ isPlaying ? '⏹' : '▶' }}</span>
                <span class="play-text">{{ isPlaying ? 'STOP TRANSMISSION' : 'PLAY TRANSMISSION' }}</span>
              </button>
              <p class="intercept-hint">Listen carefully and decode using the reference chart below</p>
            </div>

            <!-- Morse reference toggle -->
            <button class="toggle-chart-btn" @click="showMorseChart = !showMorseChart">
              {{ showMorseChart ? '▼ HIDE' : '▶ SHOW' }} MORSE CODE REFERENCE
            </button>

            <!-- Morse code reference chart -->
            <Transition name="expand">
              <div v-if="showMorseChart" class="morse-chart">
                <div class="chart-title">INTERNATIONAL MORSE CODE</div>
                <div class="chart-grid">
                  <div v-for="item in morseReference" :key="item.char" class="chart-item">
                    <span class="chart-char">{{ item.char }}</span>
                    <span class="chart-code">{{ item.code }}</span>
                  </div>
                </div>
                <div class="chart-legend">
                  <span>· = DIT (short)</span>
                  <span>− = DAH (long)</span>
                </div>
              </div>
            </Transition>

            <!-- MFA code input -->
            <div class="mfa-input-section">
              <label class="input-label">Enter 6-digit MFA code:</label>
              <div class="mfa-inputs" :class="{ error: mfaError }">
                <input
                  v-for="(digit, index) in mfaCode"
                  :key="index"
                  :value="digit"
                  :data-mfa-index="index"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="mfa-digit"
                  @input="handleMfaInput(index, $event)"
                  @keydown="handleMfaKeydown(index, $event)"
                />
              </div>
              <button class="verify-btn mfa-submit" :disabled="mfaCode.some((d) => !d)" @click="verifyMfaCode">VERIFY MFA CODE</button>
            </div>
          </div>
        </template>

        <div v-else-if="mfaVerified" class="step-verified">
          <span class="verified-icon">✓</span>
          <span class="verified-text">MFA CODE VERIFIED</span>
        </div>

        <div v-else class="step-locked-message">Complete Step 1 first</div>
      </div>

      <!-- Authentication complete message -->
      <Transition name="expand">
        <div v-if="mfaVerified" class="auth-complete">
          <div class="auth-complete-header">✓ IDENTITY CONFIRMED: AGENT ZERO</div>
          <div class="auth-complete-details">
            <p>Authentication level: <strong>MAXIMUM SECURITY</strong></p>
            <div class="mfa-explanation">
              <p><strong>Zero Trust in action:</strong></p>
              <ul>
                <li>✓ Something you know (password)</li>
                <li>✓ Something you have (MFA device)</li>
                <li>✓ Continuous verification required</li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Part C: Architecture Builder -->
    <div class="part-section" :class="{ locked: !mfaVerified }">
      <div class="part-header">
        <span class="part-label">PART B</span>
        <h3 class="part-title">SECURE OFF-NETWORK PRINTING</h3>
        <span v-if="!mfaVerified" class="part-locked">🔒</span>
      </div>

      <template v-if="mfaVerified">
        <div class="scenario-box">
          <div class="scenario-header">SCENARIO</div>
          <p>Dr. Sarah Chen is a physician working from home. She needs to print patient records to her office printer <strong>securely</strong>.</p>
          <p class="scenario-task"><strong>Build the zero-trust print flow</strong> by clicking components in order (1-5):</p>
        </div>

        <!-- Architecture components (click-to-order like Level 11) -->
        <div class="arch-components">
          <div
            v-for="step in archSteps"
            :key="step.id"
            class="arch-component"
            :class="{ 
              selected: step.order !== null, 
              verified: archVerified, 
              correct: archVerified && correctOrder.indexOf(step.id) + 1 === step.order, 
              incorrect: archVerified && step.order !== null && correctOrder.indexOf(step.id) + 1 !== step.order 
            }"
            @click="selectStep(step)"
          >
            <div class="comp-order" v-if="step.order">{{ step.order }}</div>
            <div class="comp-icon">{{ step.icon }}</div>
            <div class="comp-label">{{ step.label }}</div>
            <div class="comp-desc">{{ step.description }}</div>
          </div>
        </div>

        <!-- Result after incorrect verification -->
        <div v-if="archVerified && !archCorrect" class="arch-result">
          <div class="result-header">
            ✗ INCORRECT SEQUENCE (-5 points)
          </div>
          <div class="correct-sequence">
            <p><strong>Correct flow:</strong></p>
            <div class="sequence-flow">
              <span class="seq-item">🏠 Remote User</span>
              <span class="seq-arrow">→</span>
              <span class="seq-item">🔒 TLS Handshake</span>
              <span class="seq-arrow">→</span>
              <span class="seq-item">☁️ Secure Gateway</span>
              <span class="seq-arrow">→</span>
              <span class="seq-item">🔗 Edge Service</span>
              <span class="seq-arrow">→</span>
              <span class="seq-item">🖨️ Printer</span>
            </div>
          </div>
          <button class="btn btn-primary" @click="proceedAfterIncorrect">
            PROCEED →
          </button>
        </div>

        <!-- Verify button -->
        <button 
          v-if="!archVerified" 
          class="btn btn-primary" 
          :disabled="!allStepsSelected" 
          @click="verifyArchitecture"
        >
          VERIFY SEQUENCE →
        </button>
      </template>

      <div v-else class="locked-message">Complete authentication to unlock</div>
    </div>

    <!-- Security Animation Overlay -->
    <Transition name="fade">
      <div v-if="showSecurityAnimation" class="animation-overlay">
        <div class="animation-content">
          <div class="animation-title">🔐 ESTABLISHING SECURE TUNNEL</div>

          <div class="animation-steps">
            <div class="anim-step" :class="{ active: animationStep >= 1, complete: animationStep > 1 }">
              <div class="anim-step-header">Step 1: TLS Handshake</div>
              <div class="anim-progress"><div class="anim-progress-fill"></div></div>
              <div class="anim-details">
                <span>✓ Client Hello sent</span>
                <span>✓ Server Hello received</span>
                <span>✓ Certificate verified</span>
              </div>
            </div>

            <div class="anim-step" :class="{ active: animationStep >= 2, complete: animationStep > 2 }">
              <div class="anim-step-header">Step 2: Secure Connection</div>
              <div class="anim-locks">🔒🔒🔒🔒🔒🔒🔒🔒</div>
              <div class="anim-details">
                <span>Encryption: AES-256</span>
                <span>Protocol: TLS 1.3</span>
              </div>
            </div>

            <div class="anim-step" :class="{ active: animationStep >= 3, complete: animationStep > 3 }">
              <div class="anim-step-header">Step 3: Job Transmission</div>
              <div class="anim-progress"><div class="anim-progress-fill"></div></div>
              <div class="anim-details">
                <span>✓ Job encrypted</span>
                <span>✓ Sent to secure gateway</span>
              </div>
            </div>

            <div class="anim-step" :class="{ active: animationStep >= 4, complete: animationStep > 4 }">
              <div class="anim-step-header">Step 4: Edge Service Pull</div>
              <div class="anim-progress"><div class="anim-progress-fill"></div></div>
              <div class="anim-details">
                <span>✓ Edge service authenticates</span>
                <span>✓ Pulls encrypted job</span>
              </div>
            </div>

            <div class="anim-step" :class="{ active: animationStep >= 5, complete: animationStep > 5 }">
              <div class="anim-step-header">Step 5: Local Delivery</div>
              <div class="anim-progress"><div class="anim-progress-fill"></div></div>
              <div class="anim-details">
                <span>✓ Routes to printer</span>
                <span>✓ Job printed securely</span>
              </div>
            </div>
          </div>

          <div v-if="animationStep >= 5" class="animation-complete">🎉 ZERO TRUST PRINT COMPLETE</div>
        </div>
      </div>
    </Transition>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 4: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">ZERO TRUST SECURITY ACTIVATED</div>

            <!-- Architecture diagram -->
            <div class="final-diagram">
              <div class="diagram-title">ZERO TRUST OFF-NETWORK PRINTING</div>
              <div class="diagram-flow">
                <div class="diagram-node home">
                  <span class="node-icon">🏠</span>
                  <span class="node-label">REMOTE USER</span>
                </div>
                <div class="diagram-arrow">
                  <span class="arrow-line">→</span>
                  <span class="arrow-label">TLS 443 🔒</span>
                </div>
                <div class="diagram-node cloud">
                  <span class="node-icon">☁️</span>
                  <span class="node-label">SECURE GATEWAY</span>
                </div>
                <div class="diagram-arrow">
                  <span class="arrow-line">→</span>
                  <span class="arrow-label">Secure Pull</span>
                </div>
                <div class="diagram-node office">
                  <span class="node-icon">🔗</span>
                  <span class="node-label">EDGE SERVICE</span>
                </div>
                <div class="diagram-arrow">
                  <span class="arrow-line">→</span>
                  <span class="arrow-label">Port 9100</span>
                </div>
                <div class="diagram-node printer">
                  <span class="node-icon">🖨️</span>
                  <span class="node-label">PRINTER</span>
                </div>
              </div>
            </div>

            <!-- Comparison -->
            <div class="comparison-section">
              <div class="compare-col legacy">
                <h4>❌ LEGACY MODEL</h4>
                <ul>
                  <li>Trust inside network</li>
                  <li>Single-factor auth</li>
                  <li>VPN required</li>
                  <li>Unencrypted traffic</li>
                </ul>
              </div>
              <div class="compare-col zerotrust">
                <h4>✓ ZERO TRUST</h4>
                <ul>
                  <li>Never trust, always verify</li>
                  <li>Multi-factor auth</li>
                  <li>No VPN needed</li>
                  <li>Always encrypted</li>
                </ul>
              </div>
            </div>

            <!-- Key learnings -->
            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>Zero Trust = "Never trust, always verify"</li>
                <li>MFA is essential (something you know + have)</li>
                <li>All connections encrypted via TLS port 443</li>
                <li>Edge Service can embed in printer CPA</li>
              </ul>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 5 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level4-puzzle {
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

/* Security alert */
.security-alert {
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 100, 0, 0.1));
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  animation: pulse 2s infinite;
}

.alert-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-accent);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-md);
}

.alert-content p {
  color: var(--color-text);
  margin-bottom: var(--space-sm);
  font-size: 0.9rem;
}

.alert-content .protocol {
  color: var(--color-primary);
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  margin-top: var(--space-md);
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
  cursor: pointer;
}

.hint-content {
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-left: 3px solid var(--color-secondary);
  border-radius: var(--radius-sm);
}

.hint-label {
  display: block;
  font-size: 0.65rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.hint-content p {
  margin: 0 0 var(--space-xs);
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

/* Part sections */
.part-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.part-section.locked {
  opacity: 0.5;
  pointer-events: none;
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

.part-locked {
  margin-left: auto;
}

/* Auth steps */
.auth-step {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.auth-step.completed {
  border-color: var(--color-primary);
}

.auth-step.locked {
  opacity: 0.5;
}

.step-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.step-number {
  font-size: 0.65rem;
  color: var(--color-secondary);
  background: var(--color-secondary-dim);
  padding: 2px 6px;
  border-radius: 2px;
}

.step-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
}

.step-gif {
  height: 40px;
  width: auto;
  margin-left: var(--space-sm);
}

.step-status {
  margin-left: auto;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.step-status.locked {
  color: var(--color-text-muted);
}

/* Password input */
.input-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.password-input-wrapper {
  display: flex;
  gap: var(--space-sm);
}

.password-input {
  flex: 1;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 1rem;
}

.password-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.verify-btn {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 0.75rem;
  cursor: pointer;
}

.verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-verified {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.verified-icon {
  color: var(--color-primary);
  font-size: 1.5rem;
}

.verified-text {
  font-family: var(--font-display);
  color: var(--color-primary);
}

.bonus-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #000;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: bold;
}

.step-locked-message {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.85rem;
}

/* Morse challenge */
.morse-challenge {
  margin-top: var(--space-md);
}

.morse-intro {
  margin-bottom: var(--space-md);
}

.morse-intro p {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  margin-bottom: var(--space-xs);
}

/* Signal Intercept Player */
.signal-intercept-player {
  background: linear-gradient(135deg, var(--color-surface), var(--color-surface-elevated));
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.signal-intercept-player::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 136, 0.03) 2px,
      rgba(0, 255, 136, 0.03) 4px
    );
  pointer-events: none;
}

.intercept-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.intercept-icon {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

.intercept-label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
}

.intercept-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 60px;
  margin-bottom: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.signal-wave {
  width: 4px;
  height: 20px;
  background: var(--color-text-muted);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.intercept-visual.active .signal-wave {
  background: var(--color-primary);
  animation: wave 0.5s ease-in-out infinite;
}

.intercept-visual.active .signal-wave:nth-child(1) {
  animation-delay: 0s;
}

.intercept-visual.active .signal-wave:nth-child(2) {
  animation-delay: 0.15s;
}

.intercept-visual.active .signal-wave:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes wave {
  0%, 100% {
    height: 20px;
  }
  50% {
    height: 50px;
  }
}

.play-transmission-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  margin-bottom: var(--space-md);
}

.play-transmission-btn:hover {
  background: var(--color-primary-dim);
  box-shadow: 0 0 20px var(--color-primary-glow);
}

.play-transmission-btn.playing {
  background: var(--color-primary);
  color: var(--color-background);
  animation: pulse 1s infinite;
}

.play-icon {
  font-size: 1.25rem;
}

.intercept-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.toggle-chart-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-dim);
  padding: var(--space-sm) var(--space-md);
  font-size: 0.75rem;
  cursor: pointer;
  margin-bottom: var(--space-md);
}

/* Morse chart */
.morse-chart {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.chart-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-dim);
  text-align: center;
  margin-bottom: var(--space-md);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: var(--space-xs);
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xs);
  background: var(--color-surface-elevated);
  border-radius: 2px;
}

.chart-char {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-primary);
}

.chart-code {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-md);
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* MFA inputs */
.mfa-input-section {
  margin-top: var(--space-lg);
}

.mfa-inputs {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  margin-bottom: var(--space-md);
}

.mfa-inputs.error {
  animation: shake 0.5s ease-in-out;
}

.mfa-digit {
  width: 50px;
  height: 60px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.5rem;
  padding: 0;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

.mfa-digit:focus {
  border-color: var(--color-primary);
  outline: none;
}

.mfa-submit {
  display: block;
  margin: 0 auto;
}

/* Auth complete */
.auth-complete {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-top: var(--space-lg);
}

.auth-complete-header {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.auth-complete-details {
  text-align: center;
}

.auth-complete-details p {
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.mfa-explanation {
  text-align: left;
  max-width: 300px;
  margin: 0 auto;
}

.mfa-explanation p {
  font-size: 0.85rem;
  margin-bottom: var(--space-sm);
}

.mfa-explanation ul {
  list-style: none;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.mfa-explanation li {
  margin-bottom: var(--space-xs);
}

/* Scenario box */
.scenario-box {
  background: var(--color-surface-elevated);
  border-left: 3px solid var(--color-secondary);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
}

.scenario-header {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.scenario-box p {
  color: var(--color-text);
  font-size: 0.85rem;
  margin-bottom: var(--space-sm);
}

.scenario-task {
  color: var(--color-primary) !important;
}

/* Architecture components (click-to-order like Level 11) */
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

.comp-desc {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.locked-message {
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-xl);
}

/* Animation overlay */
.animation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.animation-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.animation-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-bottom: var(--space-xl);
  animation: pulse 1s infinite;
}

.animation-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.anim-step {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  opacity: 0.3;
  transition: all 0.5s ease;
}

.anim-step.active {
  opacity: 1;
  border-color: var(--color-primary);
}

.anim-step.complete {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.anim-step-header {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.anim-progress {
  height: 4px;
  background: var(--color-surface-elevated);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.anim-step.active .anim-progress-fill,
.anim-step.complete .anim-progress-fill {
  height: 100%;
  background: var(--color-primary);
  animation: fillProgress 1s ease-out forwards;
}

.anim-locks {
  color: var(--color-primary);
  font-size: 1rem;
  letter-spacing: 0.2em;
  margin-bottom: var(--space-sm);
}

.anim-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.animation-complete {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-top: var(--space-xl);
  animation: pulse 0.5s ease;
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
  max-width: 600px;
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

/* Final diagram */
.final-diagram {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.diagram-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-secondary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.diagram-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.diagram-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  min-width: 70px;
}

.node-icon {
  font-size: 1.25rem;
}

.node-label {
  font-size: 0.5rem;
  color: var(--color-text-dim);
  text-align: center;
}

.diagram-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.arrow-line {
  font-size: 1rem;
  color: var(--color-primary);
}

.arrow-label {
  font-size: 0.5rem;
  color: var(--color-text-muted);
}

/* Comparison */
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

.compare-col.legacy {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.compare-col.zerotrust {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.compare-col h4 {
  font-size: 0.7rem;
  margin-bottom: var(--space-sm);
}

.compare-col.legacy h4 {
  color: var(--color-accent);
}

.compare-col.zerotrust h4 {
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

/* Learnings */
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
  padding-left: var(--space-md);
  position: relative;
}

.learnings-box li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.success-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
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
  z-index: 1100;
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

.feedback-toast.bonus {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  border: 2px solid #ffd700;
  color: #000;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
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

@keyframes fillProgress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
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
  .comparison-section {
    grid-template-columns: 1fr;
  }

  .mfa-digit {
    width: 40px;
    height: 50px;
    font-size: 1.25rem;
    line-height: 46px;
    padding: 0px;
  }

  .diagram-flow {
    flex-direction: column;
  }

  .diagram-arrow {
    transform: rotate(90deg);
  }

  .arch-components {
    grid-template-columns: 1fr;
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

