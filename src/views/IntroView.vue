<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game'
import { validateEmail, validateIntroPuzzle } from '@/utils/puzzleValidators'
import { submitLead } from '@/utils/api'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()

// Form state
const agentName = ref('')
const agentEmail = ref('')
const agentCompany = ref('')
const decryptedAnswer = ref('')

// UI state
const showTransmission = ref(false)
const showForm = ref(false)
const showPuzzle = ref(false)
const isVerified = ref(false)
const showWelcome = ref(false)
const hasError = ref(false)
const isSubmitting = ref(false)

// Countdown timer (cosmetic)
const countdownHours = ref(24)
const countdownMinutes = ref(0)
const countdownSeconds = ref(0)
let countdownInterval: number | null = null

// Form validation
const nameError = ref('')
const emailError = ref('')
const companyError = ref('')
const puzzleError = ref('')

const isFormValid = computed(() => {
  return (
    agentName.value.trim().length > 0 &&
    agentEmail.value.trim().length > 0 &&
    validateEmail(agentEmail.value) &&
    agentCompany.value.trim().length > 0
  )
})

const canProceed = computed(() => {
  return isFormValid.value && isVerified.value
})

// Typing animation state
const typingText = ref('')
const fullText = 'INCOMING TRANSMISSION...'
let typingIndex = 0
let typingInterval: number | null = null

function startTypingAnimation() {
  typingIndex = 0
  typingText.value = ''
  typingInterval = window.setInterval(() => {
    if (typingIndex < fullText.length) {
      typingText.value += fullText[typingIndex]
      typingIndex++
    } else {
      if (typingInterval) clearInterval(typingInterval)
      setTimeout(() => {
        showTransmission.value = true
        setTimeout(() => {
          showForm.value = true
          setTimeout(() => {
            showPuzzle.value = true
          }, 800)
        }, 600)
      }, 500)
    }
  }, 80)
}

function startCountdown() {
  countdownInterval = window.setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
    } else if (countdownMinutes.value > 0) {
      countdownMinutes.value--
      countdownSeconds.value = 59
    } else if (countdownHours.value > 0) {
      countdownHours.value--
      countdownMinutes.value = 59
      countdownSeconds.value = 59
    }
  }, 1000)
}

function validateForm() {
  let valid = true

  nameError.value = ''
  emailError.value = ''
  companyError.value = ''

  if (!agentName.value.trim()) {
    nameError.value = 'Agent codename required'
    valid = false
  }

  if (!agentEmail.value.trim()) {
    emailError.value = 'Secure channel required'
    valid = false
  } else if (!validateEmail(agentEmail.value)) {
    emailError.value = 'Invalid communication channel format'
    valid = false
  }

  if (!agentCompany.value.trim()) {
    companyError.value = 'Organization affiliation required'
    valid = false
  }

  return valid
}

function checkPuzzleAnswer() {
  puzzleError.value = ''

  if (!decryptedAnswer.value.trim()) {
    puzzleError.value = 'Decryption required for verification'
    return
  }

  if (validateIntroPuzzle(decryptedAnswer.value)) {
    isVerified.value = true
    puzzleError.value = ''
  } else {
    puzzleError.value = 'Decryption failed. Try again, Agent.'
    hasError.value = true
    setTimeout(() => {
      hasError.value = false
    }, 500)
  }
}

async function beginMission() {
  if (!validateForm()) return
  if (!isVerified.value) {
    puzzleError.value = 'Complete the decryption challenge first'
    return
  }

  isSubmitting.value = true

  const playerData = {
    name: agentName.value.trim(),
    email: agentEmail.value.trim(),
    company: agentCompany.value.trim(),
  }

  // Register player locally
  playerStore.registerPlayer(playerData)

  // Submit lead to backend immediately
  submitLead({
    ...playerData,
    role: '',
    completedAt: new Date().toISOString(),
    completionTime: 0,
    levelsCompleted: 0,
    hintsUsed: 0,
    totalAttempts: 0,
    source: 'tradeshow',
  }).catch((err) => {
    console.error('Failed to submit lead:', err)
  })

  // Show welcome message
  showWelcome.value = true

  // Wait for animation, then start game
  setTimeout(() => {
    gameStore.startGame()
    router.push({ name: 'level', params: { id: '1' } })
  }, 2500)
}

onMounted(() => {
  // Check for existing session
  playerStore.loadFromStorage()
  gameStore.loadFromStorage()

  // If already playing, redirect to current level
  if (playerStore.isRegistered && gameStore.currentLevel > 0) {
    if (gameStore.isComplete) {
      router.push({ name: 'debrief' })
    } else {
      router.push({ name: 'level', params: { id: gameStore.currentLevel.toString() } })
    }
    return
  }

  // Start animations
  setTimeout(() => {
    startTypingAnimation()
    startCountdown()
  }, 500)
})

onUnmounted(() => {
  if (typingInterval) clearInterval(typingInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <div class="intro-view">
    <!-- Welcome overlay -->
    <Transition name="fade">
      <div v-if="showWelcome" class="welcome-overlay">
        <div class="welcome-content">
          <div class="welcome-verified">CREDENTIALS VERIFIED</div>
          <div class="welcome-message">
            WELCOME, AGENT <span class="agent-name">{{ agentName.toUpperCase() }}</span>
          </div>
          <div class="welcome-status">MISSION OBJECTIVES UNLOCKED</div>
          <div class="welcome-loading">
            <div class="loading-bar"></div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="container">
      <!-- Header -->
      <header class="intro-header">
        <div class="classified-banner">
          <div class="banner-line"></div>
          <span class="banner-text">CLASSIFIED TRANSMISSION - PRIORITY ALPHA</span>
          <div class="banner-line"></div>
        </div>
        <div class="encryption-badge">[ENCRYPTION LEVEL: MAXIMUM]</div>
      </header>

      <!-- Typing animation -->
      <div class="typing-section">
        <span class="typing-text">{{ typingText }}</span>
        <span class="cursor" :class="{ hidden: showTransmission }">▌</span>
      </div>

      <!-- Main transmission content -->
      <Transition name="slide-fade">
        <div v-if="showTransmission" class="transmission-content">
          <!-- Mission header -->
          <div class="mission-meta">
            <div class="meta-item">
              <span class="meta-label">FROM:</span>
              <span class="meta-value">Director, Cyber Security Operations</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">TO:</span>
              <span class="meta-value">Agent Zero</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">CLASSIFICATION:</span>
              <span class="meta-value stamp-inline">TOP SECRET</span>
            </div>
            <div class="meta-item countdown-item">
              <span class="meta-label">TIME REMAINING:</span>
              <span class="meta-value countdown">
                {{ String(countdownHours).padStart(2, '0') }}:{{
                  String(countdownMinutes).padStart(2, '0')
                }}:{{ String(countdownSeconds).padStart(2, '0') }}
              </span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Mission briefing -->
          <div class="mission-brief">
            <h2 class="section-title">MESSAGE BEGINS:</h2>

            <p class="mission-text">Agent Zero,</p>

            <p class="mission-text">
              Intelligence reports indicate
              <strong class="highlight">Apex Industries'</strong> legacy print infrastructure has
              been compromised. Enemy operatives have identified critical vulnerabilities in their
              systems.
            </p>

            <div class="vulnerability-list">
              <h3 class="list-title">Our analysis reveals:</h3>
              <ul>
                <li>
                  <span class="bullet">▸</span> <strong>10+ legacy print servers</strong> creating
                  multiple attack vectors
                </li>
                <li>
                  <span class="bullet">▸</span> <strong>No zero-trust security protocols</strong> in
                  place
                </li>
                <li>
                  <span class="bullet">▸</span>
                  <strong>Separate backend and frontend systems</strong> costing $30,000+ annually
                </li>
                <li>
                  <span class="bullet">▸</span> <strong>No encryption</strong> for remote printing
                  operations
                </li>
                <li>
                  <span class="bullet">▸</span> <strong>Manual processes</strong> causing security
                  gaps
                </li>
              </ul>
            </div>

            <p class="mission-text urgent">
              You have <strong class="countdown-text">24 hours</strong> to deploy Intelligent Print
              Automation before the coordinated cyberattack exploits these weaknesses.
            </p>
          </div>

          <div class="divider"></div>

          <!-- Mission objectives -->
          <div class="objectives-section">
            <h2 class="section-title">YOUR MISSION:</h2>

            <div class="objectives-grid">
              <div class="objective-phase">
                <h3 class="phase-title">PHASE 1: MODERNIZATION</h3>
                <ul class="phase-items">
                  <li><span class="check">✓</span> Eliminate legacy print server infrastructure</li>
                  <li><span class="check">✓</span> Deploy cloud-native SaaS platform</li>
                  <li><span class="check">✓</span> Establish agnostic technology support</li>
                </ul>
              </div>

              <div class="objective-phase">
                <h3 class="phase-title">PHASE 2: ZERO TRUST SECURITY</h3>
                <ul class="phase-items">
                  <li>
                    <span class="check">✓</span> Implement "never trust, always verify" protocols
                  </li>
                  <li>
                    <span class="check">✓</span> Deploy secure gateway for off-network printing
                  </li>
                  <li><span class="check">✓</span> Activate enterprise security certifications</li>
                </ul>
              </div>

              <div class="objective-phase">
                <h3 class="phase-title">PHASE 3: USER EXPERIENCE</h3>
                <ul class="phase-items">
                  <li><span class="check">✓</span> Enable secure release printing</li>
                  <li><span class="check">✓</span> Deploy simplified scanning to cloud</li>
                  <li>
                    <span class="check">✓</span> Establish guest printing without network access
                  </li>
                </ul>
              </div>

              <div class="objective-phase">
                <h3 class="phase-title">PHASE 4: CONSOLIDATION</h3>
                <ul class="phase-items">
                  <li>
                    <span class="check">✓</span> Unify backend (EHR/ERP) and frontend printing
                  </li>
                  <li><span class="check">✓</span> Activate AI-powered management</li>
                  <li>
                    <span class="check">✓</span> Deploy API Cloud Link for cloud-to-local printing
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Mission parameters -->
          <div class="parameters-section">
            <h2 class="section-title">MISSION PARAMETERS:</h2>
            <div class="parameters-grid">
              <div class="param-item">
                <span class="param-label">APPROACH:</span>
                <span class="param-value">Covert infiltration and system modernization</span>
              </div>
              <div class="param-item">
                <span class="param-label">AUTHORIZATION:</span>
                <span class="param-value">Full deployment privileges granted</span>
              </div>
              <div class="param-item">
                <span class="param-label">SUPPORT:</span>
                <span class="param-value">Vasion technology arsenal at your disposal</span>
              </div>
              <div class="param-item">
                <span class="param-label">EXTRACTION:</span>
                <span class="param-value">Mission complete upon final objective achieved</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Agent identification form -->
      <Transition name="slide-fade">
        <div v-if="showForm" class="identification-section">
          <div class="divider"></div>

          <h2 class="section-title">AGENT IDENTIFICATION</h2>
          <p class="section-subtitle">Before proceeding, we need to establish your identity.</p>

          <form class="agent-form" @submit.prevent>
            <div class="form-group">
              <label class="form-label" for="agentName">AGENT CODENAME</label>
              <input
                id="agentName"
                v-model="agentName"
                type="text"
                class="form-input"
                :class="{ error: nameError }"
                placeholder="Your Name"
                autocomplete="name"
              />
              <span v-if="nameError" class="form-error">{{ nameError }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="agentEmail">SECURE CONTACT CHANNEL</label>
              <input
                id="agentEmail"
                v-model="agentEmail"
                type="email"
                class="form-input"
                :class="{ error: emailError }"
                placeholder="Email Address"
                autocomplete="email"
              />
              <span v-if="emailError" class="form-error">{{ emailError }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="agentCompany">ORGANIZATION AFFILIATION</label>
              <input
                id="agentCompany"
                v-model="agentCompany"
                type="text"
                class="form-input"
                :class="{ error: companyError }"
                placeholder="Company Name"
                autocomplete="organization"
              />
              <span v-if="companyError" class="form-error">{{ companyError }}</span>
            </div>
          </form>
        </div>
      </Transition>

      <!-- Decryption challenge -->
      <Transition name="slide-fade">
        <div v-if="showPuzzle" class="puzzle-section">
          <div class="divider"></div>

          <h2 class="section-title">INITIAL DECRYPTION CHALLENGE</h2>
          <p class="section-subtitle">To verify your clearance, decrypt this transmission:</p>

          <div class="cipher-box">
            <div class="cipher-label">ENCRYPTED MESSAGE:</div>
            <div class="cipher-text">SQJOU TFSWFST BSF UIF XFBLPTU MJOL</div>
            <div class="cipher-info">
              <span class="cipher-type">CIPHER TYPE: Caesar Shift (+1)</span>
              <span class="cipher-hint">Shift each letter back by 1 position</span>
            </div>
          </div>

          <div class="hint-box">
            <div class="hint-title">HINT:</div>
            <ul class="hint-list">
              <li>S → R (shift back 1)</li>
              <li>Q → P (shift back 1)</li>
              <li>J → I (shift back 1)</li>
            </ul>
          </div>

          <div class="answer-section">
            <label class="form-label" for="decryptedAnswer">ENTER DECRYPTED MESSAGE:</label>
            <div class="answer-template">
              P _ _ _ _ S _ _ _ _ _ _ A _ _ T _ _ W _ _ _ _ _ _ L _ _ _
            </div>
            <input
              id="decryptedAnswer"
              v-model="decryptedAnswer"
              type="text"
              class="form-input answer-input"
              :class="{ error: puzzleError, verified: isVerified, shake: hasError }"
              placeholder="Type your decrypted answer..."
              @keyup.enter="checkPuzzleAnswer"
              :disabled="isVerified"
            />
            <span v-if="puzzleError" class="form-error">{{ puzzleError }}</span>
            <span v-if="isVerified" class="verification-success">
              <span class="success-icon">✓</span> CLEARANCE VERIFIED
            </span>

            <button
              v-if="!isVerified"
              type="button"
              class="btn btn-secondary verify-btn"
              @click="checkPuzzleAnswer"
            >
              VERIFY CLEARANCE
            </button>
          </div>
        </div>
      </Transition>

      <!-- Proceed button -->
      <Transition name="slide-fade">
        <div v-if="showPuzzle" class="proceed-section">
          <div class="divider"></div>

          <div class="quote-box">
            <p class="quote-text">
              "In the world of IT security, trust is a vulnerability.<br />
              Zero trust is the only path to true protection."
            </p>
          </div>

          <button
            class="btn btn-primary btn-lg btn-block proceed-btn"
            :disabled="!canProceed || isSubmitting"
            @click="beginMission"
          >
            <span v-if="isSubmitting">INITIALIZING...</span>
            <span v-else>
              <span class="btn-icon">▶</span>
              PROCEED TO OBJECTIVE 1
            </span>
          </button>

          <p class="self-destruct animate-pulse">
            This transmission will self-destruct upon mission commencement...
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.intro-view {
  min-height: 100vh;
  padding: var(--space-lg) 0;
  position: relative;
}

/* Welcome overlay */
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.welcome-content {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.welcome-verified {
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.3em;
  color: var(--color-primary);
  margin-bottom: var(--space-lg);
  animation: fadeIn 0.5s ease-out 0.3s both;
}

.welcome-message {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  color: var(--color-text);
  margin-bottom: var(--space-md);
  animation: fadeIn 0.5s ease-out 0.6s both;
}

.agent-name {
  color: var(--color-primary);
  text-shadow: var(--text-shadow-glow);
}

.welcome-status {
  font-size: 1rem;
  color: var(--color-secondary);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-xl);
  animation: fadeIn 0.5s ease-out 0.9s both;
}

.welcome-loading {
  width: 200px;
  height: 4px;
  background: var(--color-surface);
  border-radius: 2px;
  margin: 0 auto;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out 1.2s both;
}

.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  animation: loadingProgress 1.5s ease-in-out forwards;
}

@keyframes loadingProgress {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}

/* Header */
.intro-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.classified-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.banner-line {
  flex: 1;
  max-width: 100px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary));
}

.banner-line:last-child {
  background: linear-gradient(90deg, var(--color-primary), transparent);
}

.banner-text {
  font-family: var(--font-display);
  font-size: clamp(0.65rem, 2.5vw, 0.875rem);
  letter-spacing: 0.15em;
  color: var(--color-primary);
  text-shadow: var(--text-shadow-glow);
  white-space: nowrap;
}

.encryption-badge {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.2em;
}

/* Typing animation */
.typing-section {
  text-align: center;
  margin-bottom: var(--space-xl);
  min-height: 2rem;
}

.typing-text {
  font-family: var(--font-display);
  font-size: clamp(1rem, 3vw, 1.25rem);
  color: var(--color-secondary);
  letter-spacing: 0.1em;
}

.cursor {
  color: var(--color-primary);
  animation: blink 1s step-end infinite;
}

.cursor.hidden {
  opacity: 0;
}

/* Mission meta */
.mission-meta {
  display: grid;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.meta-item {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  font-size: 0.875rem;
}

.meta-label {
  color: var(--color-text-dim);
  min-width: 140px;
}

.meta-value {
  color: var(--color-text);
}

.stamp-inline {
  color: var(--color-warning);
  font-weight: 600;
}

.countdown {
  font-family: var(--font-display);
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

/* Section titles */
.section-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-md);
}

.section-subtitle {
  color: var(--color-text-dim);
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
}

/* Mission brief */
.mission-brief {
  margin-bottom: var(--space-lg);
}

.mission-text {
  color: var(--color-text);
  margin-bottom: var(--space-md);
  line-height: 1.8;
}

.mission-text.urgent {
  color: var(--color-warning);
}

.highlight {
  color: var(--color-accent);
}

.countdown-text {
  color: var(--color-accent);
  font-family: var(--font-display);
}

/* Vulnerability list */
.vulnerability-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  padding: var(--space-md);
  margin: var(--space-lg) 0;
  border-radius: var(--radius-sm);
}

.list-title {
  font-size: 0.875rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.vulnerability-list ul {
  list-style: none;
  display: grid;
  gap: var(--space-sm);
}

.vulnerability-list li {
  display: flex;
  gap: var(--space-sm);
  font-size: 0.875rem;
}

.bullet {
  color: var(--color-accent);
}

/* Objectives */
.objectives-grid {
  display: grid;
  gap: var(--space-lg);
}

@media (min-width: 600px) {
  .objectives-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.objective-phase {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
}

.phase-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-secondary);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.phase-items {
  list-style: none;
  display: grid;
  gap: var(--space-xs);
}

.phase-items li {
  display: flex;
  gap: var(--space-sm);
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.check {
  color: var(--color-primary);
  font-weight: bold;
}

/* Parameters */
.parameters-grid {
  display: grid;
  gap: var(--space-md);
}

.param-item {
  display: grid;
  gap: var(--space-xs);
}

.param-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
}

.param-value {
  font-size: 0.875rem;
  color: var(--color-text);
}

/* Form styling */
.agent-form {
  display: grid;
  gap: var(--space-lg);
}

.form-input {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  padding: var(--space-md);
  font-size: 1rem;
  color: var(--color-text);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
  outline: none;
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input.error {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-dim);
}

.form-input.verified {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.form-input.shake {
  animation: shake 0.5s ease-in-out;
}

/* Cipher box */
.cipher-box {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-primary);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-sm);
  text-align: center;
}

.cipher-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.cipher-text {
  font-family: var(--font-display);
  font-size: clamp(1rem, 4vw, 1.5rem);
  color: var(--color-warning);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-md);
  word-break: break-all;
}

.cipher-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: 0.75rem;
}

.cipher-type {
  color: var(--color-secondary);
}

.cipher-hint {
  color: var(--color-text-dim);
}

/* Hint box */
.hint-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-secondary);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-sm);
}

.hint-title {
  font-size: 0.75rem;
  color: var(--color-secondary);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-sm);
}

.hint-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: 0.875rem;
  color: var(--color-text-dim);
}

/* Answer section */
.answer-section {
  text-align: center;
}

.answer-template {
  font-family: var(--font-display);
  font-size: clamp(0.75rem, 3vw, 1rem);
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
  word-break: break-all;
}

.answer-input {
  text-align: center;
  font-size: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.verification-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

.success-icon {
  font-size: 1.25rem;
}

.verify-btn {
  margin-top: var(--space-lg);
}

/* Quote box */
.quote-box {
  text-align: center;
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  border-left: 2px solid var(--color-primary);
  border-right: 2px solid var(--color-primary);
}

.quote-text {
  font-style: italic;
  color: var(--color-text-dim);
  line-height: 1.8;
}

/* Proceed button */
.proceed-btn {
  margin-bottom: var(--space-lg);
}

.btn-icon {
  margin-right: var(--space-sm);
}

.self-destruct {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.6s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 480px) {
  .intro-view {
    padding: var(--space-md) 0;
  }

  .meta-label {
    min-width: 100px;
  }

  .hint-list {
    flex-direction: column;
    gap: var(--space-xs);
  }
}
</style>
