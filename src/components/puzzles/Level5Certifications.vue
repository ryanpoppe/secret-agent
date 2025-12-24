<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

interface Certification {
  id: string
  name: string
  fullName: string
  description: string
  details: string[]
  whyItMatters: string
  icon: string
}

interface Dial {
  id: number
  title: string
  requirement: string
  hint: string
  correctAnswer: string
  unlocked: boolean
  certification: Certification | null
}

const certifications: Record<string, Certification> = {
  fedramp: {
    id: 'fedramp',
    name: 'FedRAMP',
    fullName: 'Federal Risk and Authorization Management Program',
    description: 'Required for federal government contracts',
    details: [
      'Required for federal government contracts',
      'Vasion is pursuing FedRAMP High authorization',
      'One of the only SaaS providers in print space with this level',
      'Also pursuing IL4 DoD provisional authorization',
    ],
    whyItMatters:
      'Federal agencies cannot use cloud services without FedRAMP authorization. This opens the government market.',
    icon: '🏛️',
  },
  soc2: {
    id: 'soc2',
    name: 'SOC 2 Type 2',
    fullName: 'Service Organization Control 2 Type 2',
    description: 'Proves controls are effective over time',
    details: [
      'Demonstrates controls are effective OVER TIME (not just point-in-time)',
      'Barrier to entry for enterprise customers',
      'Critical for financial services and healthcare',
      'Covers Security, Availability, Processing Integrity, Confidentiality, Privacy',
    ],
    whyItMatters:
      "Enterprise customers require SOC 2 Type 2 to prove you don't just have security policies—you follow them.",
    icon: '🏢',
  },
  iso27001: {
    id: 'iso27001',
    name: 'ISO 27001',
    fullName: 'International Standard for Information Security Management Systems (ISMS)',
    description: 'Global standard for security management',
    details: [
      'Global standard for security management',
      'Demonstrates comprehensive security framework',
      'Recognized internationally',
      'Proves compliance with international standards',
    ],
    whyItMatters:
      'ISO 27001 is the gold standard for enterprise security management worldwide. It proves you have a systematic approach to managing sensitive information.',
    icon: '🌍',
  },
  iso42001: {
    id: 'iso42001',
    name: 'ISO 42001',
    fullName: "World's First International Standard for AI Management Systems",
    description: 'AI governance and accountability',
    details: [
      'First international AI governance standard',
      'Ensures AI is trustworthy, transparent, accountable',
      'Governance frameworks for AI systems',
      'Critical for regulated industries (healthcare, financial, government)',
    ],
    whyItMatters:
      'As Vasion deploys AI for document processing and content redaction, ISO 42001 proves these AI systems are governed responsibly.',
    icon: '🤖',
  },
}

const dials = ref<Dial[]>([
  {
    id: 1,
    title: 'FEDERAL GOVERNMENT',
    requirement:
      'Apex Industries needs certification to bid on federal government contracts and serve federal agencies. Which certification is required?',
    hint: 'This certification authorizes cloud service providers to work with federal agencies and is particularly important for agencies with high security requirements.',
    correctAnswer: 'fedramp',
    unlocked: false,
    certification: null,
  },
  {
    id: 2,
    title: 'ENTERPRISE CONTROLS',
    requirement:
      "Apex's healthcare and financial services customers need proof that security controls are not just in place, but EFFECTIVE OVER TIME. Which certification demonstrates this?",
    hint: 'This certification proves controls work consistently, not just at a point in time. The "Type 2" designation is key.',
    correctAnswer: 'soc2',
    unlocked: false,
    certification: null,
  },
  {
    id: 3,
    title: 'GLOBAL SECURITY STANDARD',
    requirement:
      'Apex operates globally and needs an internationally recognized standard for information security management. Which certification proves comprehensive security management systems?',
    hint: 'This is the global standard for ISMS (Information Security Management Systems) and is recognized worldwide.',
    correctAnswer: 'iso27001',
    unlocked: false,
    certification: null,
  },
  {
    id: 4,
    title: 'AI GOVERNANCE',
    requirement:
      'Apex is deploying AI-powered document processing and intelligent automation. Healthcare and regulated industries need assurance that AI is managed responsibly. Which certification addresses AI governance?',
    hint: "This is the world's FIRST international standard specifically for AI management systems, ensuring trustworthy and accountable AI.",
    correctAnswer: 'iso42001',
    unlocked: false,
    certification: null,
  },
])

const currentDialIndex = ref(0)
const selectedAnswer = ref<string | null>(null)
const showError = ref(false)
const showHint = ref(false)
const vaultUnlocked = ref(false)
const showSuccess = ref(false)
const feedback = ref<{ type: 'correct' | 'incorrect'; message: string } | null>(null)

const currentDial = computed(() => dials.value[currentDialIndex.value] as Dial)
const unlockedCount = computed(() => dials.value.filter((d) => d.unlocked).length)
const allUnlocked = computed(() => dials.value.every((d) => d.unlocked))

// Get available options for current dial (shuffled)
const currentOptions = computed(() => {
  const options = [
    { id: 'fedramp', label: 'FedRAMP (Federal Risk and Authorization Management Program)' },
    { id: 'soc2', label: 'SOC 2 Type 2' },
    { id: 'iso27001', label: 'ISO 27001' },
    { id: 'iso42001', label: 'ISO 42001' },
  ]
  return options
})

function selectAnswer(id: string) {
  const dial = currentDial.value
  if (dial.unlocked) return
  selectedAnswer.value = id
  showError.value = false
}

function submitAnswer() {
  const dial = currentDial.value
  if (!selectedAnswer.value || dial.unlocked) return

  if (selectedAnswer.value === dial.correctAnswer) {
    // Correct!
    dial.unlocked = true
    dial.certification = certifications[selectedAnswer.value] ?? null
    showFeedback('correct', `🔓 DIAL ${dial.id} UNLOCKED!`)
    playClickSound()

    // Check if all unlocked
    if (allUnlocked.value) {
      setTimeout(() => {
        vaultUnlocked.value = true
        setTimeout(() => {
          showSuccess.value = true
        }, 2000)
      }, 1500)
    }
  } else {
    // Incorrect
    showError.value = true
    showFeedback('incorrect', 'Incorrect. Try again.')
    playErrorSound()
  }

  selectedAnswer.value = null
}

function nextDial() {
  if (currentDialIndex.value < 3) {
    currentDialIndex.value++
    selectedAnswer.value = null
    showError.value = false
    showHint.value = false
  }
}

function goToDial(index: number) {
  currentDialIndex.value = index
  selectedAnswer.value = null
  showError.value = false
  showHint.value = false
}

function revealHint() {
  if (!showHint.value) {
    showHint.value = true
    gameStore.useHint(5)
  }
}

function showFeedback(type: 'correct' | 'incorrect', message: string) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = null
  }, 2500)
}

const baseUrl = import.meta.env.BASE_URL

function playClickSound() {
  try {
    const audio = new Audio(`${baseUrl}sounds/bling1.mp3`)
    audio.volume = 0.4
    audio.play().catch(() => {})
  } catch {
    // Audio not available
  }
}

function playErrorSound() {
  // Could add error sound here
}

function proceed() {
  gameStore.completeLevel(5)
  router.push({ name: 'level', params: { id: '6' } })
}
</script>

<template>
  <div class="level5-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Compliance Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="narrative-box">
        <p>
          Agent, Apex Industries serves highly regulated industries: <strong>federal government</strong>,
          <strong>healthcare</strong>, <strong>financial institutions</strong>, and <strong>Department of Defense</strong>.
        </p>
        <p>Without proper security certifications, Apex <em>cannot bid on contracts</em> or serve these critical customers.</p>
        <p class="mission-task">Your mission: Unlock the certification vault by matching each certification to its requirements.</p>
      </div>
    </div>

    <!-- Feedback toast -->
    <Transition name="feedback">
      <div v-if="feedback" class="feedback-toast" :class="feedback.type">
        <span class="feedback-text">{{ feedback.message }}</span>
      </div>
    </Transition>

    <!-- Vault visualization -->
    <div class="vault-container" :class="{ unlocked: vaultUnlocked }">
      <div class="vault-header">
        <span class="vault-icon">🔐</span>
        <span class="vault-title">SECURITY VAULT</span>
      </div>

      <div class="vault-body">
        <!-- Dial indicators -->
        <div class="dials-grid">
          <div
            v-for="(dial, index) in dials"
            :key="dial.id"
            class="dial-indicator"
            :class="{ unlocked: dial.unlocked, active: index === currentDialIndex }"
            @click="goToDial(index)"
          >
            <div class="dial-number">{{ dial.id }}</div>
            <div class="dial-status">
              <span v-if="dial.unlocked" class="status-icon unlocked">✓</span>
              <span v-else class="status-icon locked">?</span>
            </div>
            <div v-if="dial.certification" class="dial-cert-name">{{ dial.certification.name }}</div>
          </div>
        </div>

        <!-- Vault status -->
        <div class="vault-status">
          <span v-if="vaultUnlocked" class="status-unlocked">[ UNLOCKED ]</span>
          <span v-else class="status-locked">[ {{ unlockedCount }}/4 LOCKS OPEN ]</span>
        </div>

        <!-- Vault door animation -->
        <Transition name="vault-open">
          <div v-if="vaultUnlocked" class="vault-contents">
            <div class="contents-icon">💎</div>
            <div class="contents-text">CLASSIFIED MATERIALS ACCESSED</div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Current dial challenge -->
    <div v-if="!vaultUnlocked" class="dial-challenge">
      <div class="challenge-header">
        <span class="dial-label">DIAL {{ currentDial.id }}</span>
        <h3 class="dial-title">{{ currentDial.title }}</h3>
        <span v-if="currentDial.unlocked" class="dial-unlocked-badge">✓ UNLOCKED</span>
      </div>

      <!-- Already unlocked - show certification info -->
      <div v-if="currentDial.unlocked && currentDial.certification" class="certification-revealed">
        <div class="cert-header">
          <span class="cert-icon">{{ currentDial.certification.icon }}</span>
          <div class="cert-names">
            <span class="cert-name">{{ currentDial.certification.name }}</span>
            <span class="cert-fullname">{{ currentDial.certification.fullName }}</span>
          </div>
        </div>

        <ul class="cert-details">
          <li v-for="(detail, i) in currentDial.certification.details" :key="i">{{ detail }}</li>
        </ul>

        <div class="cert-why">
          <strong>WHY IT MATTERS:</strong>
          <p>{{ currentDial.certification.whyItMatters }}</p>
        </div>

        <button v-if="currentDialIndex < 3" class="btn btn-primary" @click="nextDial">NEXT DIAL →</button>
      </div>

      <!-- Not unlocked - show challenge -->
      <div v-else class="challenge-content">
        <div class="requirement-box">
          <div class="requirement-label">REQUIREMENT:</div>
          <p class="requirement-text">{{ currentDial.requirement }}</p>
        </div>

        <!-- Hint section -->
        <div class="hint-section">
          <button v-if="!showHint" class="hint-btn" @click="revealHint">? REQUEST INTEL</button>
          <div v-else class="hint-content">
            <span class="hint-label">HINT:</span>
            <p>{{ currentDial.hint }}</p>
          </div>
        </div>

        <!-- Options -->
        <div class="options-list">
          <div class="options-label">SELECT THE CERTIFICATION:</div>
          <button
            v-for="option in currentOptions"
            :key="option.id"
            class="option-btn"
            :class="{ selected: selectedAnswer === option.id, error: showError && selectedAnswer === option.id }"
            @click="selectAnswer(option.id)"
          >
            <span class="option-radio">{{ selectedAnswer === option.id ? '●' : '○' }}</span>
            <span class="option-text">{{ option.label }}</span>
          </button>
        </div>

        <button class="btn btn-primary submit-btn" :disabled="!selectedAnswer" @click="submitAnswer">UNLOCK DIAL</button>
      </div>
    </div>

    <!-- Certification Matrix (shown after vault unlocked) -->
    <Transition name="expand">
      <div v-if="vaultUnlocked && !showSuccess" class="cert-matrix">
        <div class="matrix-header">
          <span class="matrix-icon">📋</span>
          <span class="matrix-title">VASION SECURITY CERTIFICATION COMPARISON</span>
        </div>

        <div class="matrix-grid">
          <div v-for="cert in certifications" :key="cert.id" class="matrix-card">
            <div class="card-header">
              <span class="card-icon">{{ cert.icon }}</span>
              <span class="card-name">{{ cert.name }}</span>
            </div>
            <ul class="card-points">
              <li v-for="(detail, i) in cert.details.slice(0, 3)" :key="i">{{ detail }}</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 5: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">CERTIFICATION VAULT UNLOCKED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Verified FedRAMP for federal government</div>
              <div class="check-item">✓ Confirmed SOC 2 Type 2 for enterprise</div>
              <div class="check-item">✓ Validated ISO 27001 for global security</div>
              <div class="check-item">✓ Activated ISO 42001 for AI governance</div>
            </div>

            <div class="advantage-section">
              <h4>COMPETITIVE ADVANTAGE UNLOCKED:</h4>

              <div class="advantage-grid">
                <div class="advantage-item">
                  <span class="adv-icon">🏛️</span>
                  <div class="adv-content">
                    <strong>FEDERAL GOVERNMENT</strong>
                    <p>FedRAMP High + IL4 DoD enables contracts with federal agencies</p>
                  </div>
                </div>
                <div class="advantage-item">
                  <span class="adv-icon">🏢</span>
                  <div class="adv-content">
                    <strong>ENTERPRISE CUSTOMERS</strong>
                    <p>SOC 2 Type 2 is table stakes for healthcare and financial services</p>
                  </div>
                </div>
                <div class="advantage-item">
                  <span class="adv-icon">🌍</span>
                  <div class="adv-content">
                    <strong>GLOBAL OPERATIONS</strong>
                    <p>ISO 27001 provides international credibility</p>
                  </div>
                </div>
                <div class="advantage-item">
                  <span class="adv-icon">🤖</span>
                  <div class="adv-content">
                    <strong>AI-POWERED INNOVATION</strong>
                    <p>ISO 42001 demonstrates responsible AI deployment</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li><strong>FedRAMP:</strong> Required for federal contracts, Vasion pursuing FedRAMP High + IL4 DoD</li>
                <li><strong>SOC 2 Type 2:</strong> Proves controls effective over time, critical for enterprise</li>
                <li><strong>ISO 27001:</strong> Global standard for information security management systems</li>
                <li><strong>ISO 42001:</strong> World's first AI management standard, ensures trustworthy AI</li>
              </ul>
              <p class="learnings-note">
                These certifications aren't just compliance checkboxes—they're competitive differentiators that enable Vasion to
                serve markets competitors cannot access.
              </p>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 6 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level5-puzzle {
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
  font-weight: 600;
  margin-top: var(--space-md) !important;
}

/* Feedback toast */
.feedback-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
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

/* Vault container */
.vault-container {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.vault-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 4px,
    rgba(0, 255, 136, 0.02) 4px,
    rgba(0, 255, 136, 0.02) 8px
  );
  pointer-events: none;
}

.vault-container.unlocked {
  border-color: var(--color-primary);
  animation: vault-glow 2s ease infinite;
}

@keyframes vault-glow {
  0%,
  100% {
    box-shadow: 0 0 20px var(--color-primary-glow);
  }
  50% {
    box-shadow: 0 0 40px var(--color-primary-glow);
  }
}

.vault-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.vault-icon {
  font-size: 2rem;
}

.vault-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-text);
  letter-spacing: 0.15em;
}

/* Dials grid */
.dials-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.dial-indicator {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dial-indicator:hover {
  border-color: var(--color-text-dim);
}

.dial-indicator.active {
  border-color: var(--color-secondary);
  background: var(--color-surface-elevated);
}

.dial-indicator.unlocked {
  border-color: var(--color-primary);
}

.dial-number {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.dial-status {
  margin-bottom: var(--space-xs);
}

.status-icon {
  font-size: 1.5rem;
}

.status-icon.locked {
  color: var(--color-text-muted);
}

.status-icon.unlocked {
  color: var(--color-primary);
}

.dial-cert-name {
  font-size: 0.6rem;
  color: var(--color-primary);
  font-family: var(--font-display);
}

.vault-status {
  font-family: var(--font-display);
  font-size: 0.875rem;
  margin-bottom: var(--space-md);
}

.status-locked {
  color: var(--color-text-dim);
}

.status-unlocked {
  color: var(--color-primary);
  animation: pulse 1s infinite;
}

/* Vault contents */
.vault-contents {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.contents-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
}

.contents-text {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

/* Dial challenge */
.dial-challenge {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.challenge-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.dial-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-secondary);
  padding: 2px 8px;
  background: var(--color-secondary-dim);
  border-radius: 2px;
}

.dial-title {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
}

.dial-unlocked-badge {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
}

/* Certification revealed */
.certification-revealed {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.cert-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.cert-icon {
  font-size: 2.5rem;
}

.cert-names {
  display: flex;
  flex-direction: column;
}

.cert-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
}

.cert-fullname {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.cert-details {
  list-style: none;
  margin-bottom: var(--space-md);
}

.cert-details li {
  color: var(--color-text);
  font-size: 0.85rem;
  padding: var(--space-xs) 0;
  padding-left: var(--space-md);
  position: relative;
}

.cert-details li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.cert-why {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.cert-why strong {
  display: block;
  font-size: 0.7rem;
  color: var(--color-warning);
  margin-bottom: var(--space-xs);
}

.cert-why p {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  margin: 0;
}

/* Challenge content */
.requirement-box {
  background: var(--color-surface-elevated);
  border-left: 3px solid var(--color-secondary);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.requirement-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-sm);
}

.requirement-text {
  color: var(--color-text);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.6;
}

/* Hint section */
.hint-section {
  margin-bottom: var(--space-lg);
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
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

/* Options */
.options-list {
  margin-bottom: var(--space-lg);
}

.options-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  margin-bottom: var(--space-sm);
  text-align: left;
  transition: all var(--transition-fast);
}

.option-btn:hover {
  border-color: var(--color-text-dim);
}

.option-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.option-btn.error {
  border-color: var(--color-accent);
  animation: shake 0.5s ease;
}

.option-radio {
  color: var(--color-primary);
  font-size: 1rem;
}

.submit-btn {
  width: 100%;
}

/* Certification matrix */
.cert-matrix {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.matrix-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.matrix-icon {
  font-size: 1.5rem;
}

.matrix-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text);
  letter-spacing: 0.1em;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.matrix-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.card-icon {
  font-size: 1.25rem;
}

.card-name {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-primary);
}

.card-points {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.card-points li {
  margin-bottom: 2px;
  padding-left: var(--space-sm);
  position: relative;
}

.card-points li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-text-muted);
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

.advantage-section {
  margin-bottom: var(--space-lg);
}

.advantage-section h4 {
  font-size: 0.8rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
}

.advantage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.advantage-item {
  display: flex;
  gap: var(--space-sm);
  background: var(--color-surface-elevated);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
}

.adv-icon {
  font-size: 1.25rem;
}

.adv-content strong {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text);
  margin-bottom: 2px;
}

.adv-content p {
  font-size: 0.65rem;
  color: var(--color-text-dim);
  margin: 0;
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
  margin-bottom: var(--space-md);
}

.learnings-box li {
  margin-bottom: var(--space-xs);
}

.learnings-note {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
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
  transition: all 0.5s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.vault-open-enter-active {
  transition: all 0.5s ease;
}

.vault-open-enter-from {
  opacity: 0;
  transform: scale(0.8);
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
  .dials-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .advantage-grid {
    grid-template-columns: 1fr;
  }
}
</style>

