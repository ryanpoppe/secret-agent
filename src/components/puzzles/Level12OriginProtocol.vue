<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const BONUS_POINTS_FULL = 25
const BONUS_POINTS_WITH_ASSIST = 10
const CORRECT_ANSWER = 'VASION'

// Track if intel assist was used (separate from regular hints)
const intelAssistUsed = ref(false)

// Grid state - Conway's Game of Life
const gridSize = { width: 58, height: 12 }
const generation = ref(0)
const grid = ref<boolean[][]>([])
const animationInterval = ref<number | null>(null)

// RLE encoded pattern that spells VASION after 3 generations
const rlePattern = `x = 58, y = 12, rule = B3/S23
11bobo2bo2bo2bo16b2obo11bo$
16bo2bo4b2ob2o15bo3bob2o4bo$
8b4ob8o2b3obo2bo5b3obob3o4b3o2bobo$
10b2ob2o3b2o2bo2bob2ob2o2b2o2bo5b2ob2o5bo$
7b2o2bo2bo4bo6b2o3bo3b2o4bo$
9bo2bo2bo4b4o4b4o3bo2bobo3bobob3ob4o$
12b2ob2o2b2obo3bobobo2b2o2bo4bobobobo3bo$
8bobobo2b2o6bo4bo9b2o3b2o2bo4bo2b3o$
9b2o5b2ob3obob2o4bob3obo2b3o5b3o2b3o$
8b2o2b2o4b2ob3obo3b2ob2ob5o3bob2obob3o3b2o$
10b5o3bo3b2obo5bobo4bo2bo6b2obobo$
7bobob2o15b2o5b2o2bo3b2obo7bo!`

// UI State
const showIntelAssist = ref(false)
const copied = ref(false)
const userAnswer = ref('')
const submitted = ref(false)
const isCorrect = ref(false)
const showSuccess = ref(false)

const baseUrl = import.meta.env.BASE_URL

// Parse RLE to grid
function parseRLE(rle: string): boolean[][] {
  const newGrid: boolean[][] = Array(gridSize.height)
    .fill(null)
    .map(() => Array(gridSize.width).fill(false))

  const lines = rle.split('\n')
  let patternLines = ''
  
  for (const line of lines) {
    if (line.startsWith('x') || line.startsWith('#') || line.trim() === '') continue
    patternLines += line.trim()
  }

  let x = 0
  let y = 0
  let count = ''

  for (const char of patternLines) {
    if (char >= '0' && char <= '9') {
      count += char
    } else if (char === 'b') {
      const n = count ? parseInt(count) : 1
      x += n
      count = ''
    } else if (char === 'o') {
      const n = count ? parseInt(count) : 1
      for (let i = 0; i < n; i++) {
        if (y < gridSize.height && x < gridSize.width && newGrid[y]) {
          newGrid[y]![x] = true
        }
        x++
      }
      count = ''
    } else if (char === '$') {
      const n = count ? parseInt(count) : 1
      y += n
      x = 0
      count = ''
    } else if (char === '!') {
      break
    }
  }

  return newGrid
}

function reset() {
  grid.value = parseRLE(rlePattern)
  generation.value = 0
}

// Intel assist - costs 15 bonus points (25 -> 10)
function toggleIntelAssist() {
  showIntelAssist.value = !showIntelAssist.value
  if (showIntelAssist.value && !intelAssistUsed.value) {
    intelAssistUsed.value = true
    // Don't use regular hint system - this is a special bonus penalty
  }
}

// Calculate earned bonus points (computed for template)
const earnedBonusPoints = computed(() => {
  return intelAssistUsed.value ? BONUS_POINTS_WITH_ASSIST : BONUS_POINTS_FULL
})

async function copyRLE() {
  try {
    await navigator.clipboard.writeText(rlePattern)
    copied.value = true
    playSound('bling1.mp3')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = rlePattern
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Answer submission
function submitAnswer() {
  if (!userAnswer.value.trim()) return
  submitted.value = true
  isCorrect.value = userAnswer.value.trim().toUpperCase() === CORRECT_ANSWER
  
  if (isCorrect.value) {
    gameStore.setLevelCorrectAnswers(12, earnedBonusPoints.value)
    playSound('bling1.mp3')
    setTimeout(() => {
      showSuccess.value = true
    }, 1000)
  } else {
    playSound('bling1.mp3')
  }
}

function retryAnswer() {
  submitted.value = false
  userAnswer.value = ''
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

function skipLevel() {
  router.push({ name: 'debrief' })
}

function proceed() {
  gameStore.completeLevel(12)
  router.push({ name: 'debrief' })
}

onMounted(() => {
  reset()
})

onUnmounted(() => {
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
  }
})
</script>

<template>
  <div class="level12-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing classified">
      <div class="briefing-header">
        <span class="classified-stamp">🔬 BONUS MISSION - CLASSIFIED</span>
        <span class="points-badge">+{{ BONUS_POINTS_FULL }} POINTS AVAILABLE</span>
      </div>

      <div class="transmission-box">
        <div class="transmission-header">
          <span class="trans-icon">📡</span>
          <span class="trans-title">INCOMING TRANSMISSION</span>
        </div>
        <div class="transmission-meta">
          <div><strong>FROM:</strong> Cryptanalysis Division</div>
          <div><strong>TO:</strong> Agent Zero</div>
          <div><strong>PRIORITY:</strong> LOW (Optional Analysis)</div>
        </div>
        <div class="transmission-body">
          <p>Agent, excellent work on Operation Digital Fortress. Before your final debrief, our systems have flagged one remaining encrypted artifact.</p>
          <p>We've isolated a <strong>cellular automaton cipher</strong>—a living mathematical pattern that evolves according to <strong>Conway's rules</strong>.</p>
          <p>Our quantum decryption systems are offline. <strong>You'll need to use external simulation tools to decrypt it manually.</strong></p>
          <p class="hint-text">💡 Hint: The pattern reveals a 6-letter identifier after exactly <strong>3 generations</strong>.</p>
        </div>
      </div>

      <div class="skip-option">
        <button class="btn btn-secondary skip-btn" @click="skipLevel">
          SKIP BONUS LEVEL (Forfeit {{ BONUS_POINTS_FULL }} pts) →
        </button>
      </div>
    </div>

    <!-- Game of Life Grid -->
    <div class="cipher-section">
      <div class="section-header">
        <span class="section-icon">🧬</span>
        <h3 class="section-title">THE CIPHER PATTERN</h3>
        <!--<span class="generation-badge">Generation: {{ generation }}</span>-->
      </div>

      <!-- Controls -->
       <!--
      <div class="controls">
        <button class="control-btn" @click="step" :disabled="isRunning">
          ⏩ STEP
        </button>
        <button class="control-btn" @click="toggleRun">
          {{ isRunning ? '⏸ PAUSE' : '▶ RUN' }}
        </button>
        <button class="control-btn" @click="reset">
          🔄 RESET
        </button>
      </div>-->

      <!-- Grid -->
      <div class="grid-container">
        <div class="grid" :style="{ '--cols': gridSize.width }">
          <div
            v-for="(row, y) in grid"
            :key="y"
            class="grid-row"
          >
            <div
              v-for="(cell, x) in row"
              :key="x"
              class="cell"
              :class="{ alive: cell }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Intel Assist -->
      <div class="intel-assist-section">
        <button class="intel-btn" @click="toggleIntelAssist">
          🔍 INTEL ASSIST {{ showIntelAssist ? '(HIDE)' : '(SHOW RLE CODE)' }} (Forfeit 15 pts)
        </button>

        <Transition name="fade">
          <div v-if="showIntelAssist" class="rle-panel">
            <div class="rle-header">
              <span>RLE Format (for external simulators)</span>
              <button class="copy-btn" @click="copyRLE">
                {{ copied ? '✓ COPIED!' : '📋 COPY TO CLIPBOARD' }}
              </button>
            </div>
            <pre class="rle-code">{{ rlePattern }}</pre>
            <div class="rle-notes">
              <p><strong>RLE Format Notes:</strong></p>
              <ul>
                <li><code>b</code> = dead cell</li>
                <li><code>o</code> = alive cell</li>
                <li><code>$</code> = end of line</li>
                <li><code>!</code> = end of pattern</li>
                <li>Numbers indicate repetition (e.g., <code>3b</code> = three dead cells)</li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Answer Section -->
    <div class="answer-section">
      <div class="section-header">
        <span class="section-icon">🔐</span>
        <h3 class="section-title">DECRYPT THE MESSAGE</h3>
      </div>

      <p class="answer-prompt">Enter the 6-letter identifier revealed after 3 generations:</p>

      <div v-if="!submitted" class="answer-input-group">
        <input
          v-model="userAnswer"
          type="text"
          class="answer-input"
          placeholder="Enter 6-letter code..."
          maxlength="10"
          @keyup.enter="submitAnswer"
        />
        <button class="btn btn-primary" :disabled="!userAnswer.trim()" @click="submitAnswer">
          DECRYPT
        </button>
      </div>

      <div v-else class="answer-result" :class="{ correct: isCorrect, incorrect: !isCorrect }">
        <div class="result-header">
          <span class="result-icon">{{ isCorrect ? '✓' : '✗' }}</span>
          <span class="result-text">{{ isCorrect ? 'DECRYPTION SUCCESSFUL!' : 'DECRYPTION FAILED' }}</span>
        </div>
        <div v-if="!isCorrect" class="result-body">
          <p>The cipher remains unbroken. Try running the simulation to exactly 3 generations.</p>
          <button class="btn btn-secondary" @click="retryAnswer">TRY AGAIN</button>
          <button class="btn btn-secondary" @click="skipLevel">SKIP TO DEBRIEF →</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🔬 BONUS MISSION COMPLETE!</h2>
          </div>

          <div class="success-content">
            <div class="decrypted-message">
              <span class="message-label">DECRYPTED IDENTIFIER:</span>
              <span class="message-value">{{ CORRECT_ANSWER }}</span>
            </div>

            <div class="bonus-earned">
              <span class="bonus-label">BONUS POINTS EARNED:</span>
              <span class="bonus-value">+{{ earnedBonusPoints }}</span>
            </div>

            <div class="debrief-box">
              <p>The cellular automaton cipher has been successfully decrypted.</p>
              <p>The identifier <strong>VASION</strong> confirms the origin of the secure print infrastructure deployed at Apex Industries.</p>
              <p class="commendation">🏆 You've earned a special commendation for completing this optional challenge!</p>
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
.level12-puzzle {
  width: 100%;
}

/* Mission briefing */
.mission-briefing.classified {
  background: var(--color-surface);
  border: 2px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  position: relative;
}

.briefing-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.classified-stamp {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-warning);
  letter-spacing: 0.1em;
}

.points-badge {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-primary);
}

/* Transmission box */
.transmission-box {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.transmission-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(0, 200, 255, 0.1);
  border-bottom: 1px solid var(--color-border);
}

.trans-icon {
  font-size: 1.25rem;
}

.trans-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  letter-spacing: 0.1em;
}

.transmission-meta {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.transmission-meta div {
  margin-bottom: var(--space-xs);
}

.transmission-body {
  padding: var(--space-lg);
}

.transmission-body p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
  line-height: 1.6;
}

.hint-text {
  background: var(--color-primary-glow);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

/* Skip option */
.skip-option {
  text-align: center;
}

.skip-btn {
  opacity: 0.7;
}

.skip-btn:hover {
  opacity: 1;
}

/* Cipher section */
.cipher-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.section-icon {
  font-size: 1.25rem;
}

.section-title {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

.generation-badge {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-secondary);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

/* Controls */
.controls {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.control-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.control-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Grid */
.grid-container {
  overflow-x: auto;
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: #0a0a14;
  border-radius: var(--radius-md);
}

.grid {
  display: inline-block;
  border: 1px solid var(--color-border);
}

.grid-row {
  display: flex;
}

.cell {
  width: 8px;
  height: 8px;
  background: #1a1a2e;
  border: 1px solid #252540;
  transition: background 0.1s ease;
}

.cell.alive {
  background: var(--color-primary);
  box-shadow: 0 0 4px var(--color-primary);
}

/* Intel assist */
.intel-assist-section {
  margin-top: var(--space-lg);
}

.intel-btn {
  width: 100%;
  padding: var(--space-md);
  background: transparent;
  border: 1px dashed var(--color-warning);
  border-radius: var(--radius-sm);
  color: var(--color-warning);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.intel-btn:hover {
  background: rgba(255, 200, 0, 0.1);
}

.rle-panel {
  margin-top: var(--space-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.rle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.85rem;
  color: var(--color-text);
}

.copy-btn {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-background);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-btn:hover {
  background: var(--color-primary-light);
}

.rle-code {
  padding: var(--space-md);
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary);
  background: #0a0a14;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.rle-notes {
  padding: var(--space-md);
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.rle-notes p {
  margin-bottom: var(--space-sm);
}

.rle-notes ul {
  list-style: none;
  margin-bottom: var(--space-md);
}

.rle-notes li {
  margin-bottom: var(--space-xs);
}

.rle-notes code {
  background: var(--color-surface);
  padding: 2px 6px;
  border-radius: 2px;
  color: var(--color-secondary);
}

.simulator-hint {
  color: var(--color-warning);
}

.simulator-hint a {
  color: var(--color-primary);
}

/* Answer section */
.answer-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.answer-prompt {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

.answer-input-group {
  display: flex;
  gap: var(--space-md);
}

.answer-input {
  flex: 1;
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-align: center;
}

.answer-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.answer-input::placeholder {
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.9rem;
}

/* Answer result */
.answer-result {
  padding: var(--space-lg);
  border-radius: var(--radius-md);
}

.answer-result.correct {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.answer-result.incorrect {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
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

.answer-result.correct .result-icon,
.answer-result.correct .result-text {
  color: var(--color-primary);
}

.answer-result.incorrect .result-icon,
.answer-result.incorrect .result-text {
  color: var(--color-accent);
}

.result-text {
  font-family: var(--font-display);
  font-size: 1rem;
}

.result-body p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.result-body .btn {
  margin-right: var(--space-sm);
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
}

.success-modal {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
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

.decrypted-message {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.message-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
}

.message-value {
  display: block;
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--color-primary);
  letter-spacing: 0.3em;
  text-shadow: 0 0 20px var(--color-primary);
}

.bonus-earned {
  text-align: center;
  padding: var(--space-md);
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
}

.bonus-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.bonus-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: #ffd700;
}

.debrief-box {
  text-align: center;
}

.debrief-box p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.commendation {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  color: #ffd700 !important;
}

.success-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
  .cell {
    width: 5px;
    height: 5px;
  }

  .answer-input-group {
    flex-direction: column;
  }

  .controls {
    justify-content: center;
  }
}
</style>

