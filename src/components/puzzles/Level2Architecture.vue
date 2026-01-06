<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Component options for dropdowns
interface ArchOption {
  id: string
  label: string
  icon: string
  isLegacy: boolean
}

const archOptions: ArchOption[] = [
  { id: 'endpoint', label: 'Endpoint (Vasion Client)', icon: '💻', isLegacy: false },
  { id: 'cloud', label: 'Direct IP', icon: '➡️', isLegacy: false },
  { id: 'printer', label: 'Printer', icon: '🖨️', isLegacy: false },
  { id: 'server', label: 'Print Server', icon: '🖥️', isLegacy: true },
]

// State for dropdown selections
const slot1Selection = ref<string | null>(null)
const slot2Selection = ref<string | null>(null)
const slot3Selection = ref<string | null>(null)
const eliminatedServer = ref(false)
const showWireCutting = ref(false)
const showSuccess = ref(false)
const showHint = ref(false)
const feedback = ref<{ type: 'correct' | 'incorrect' | 'eliminated'; message: string } | null>(null)

// Computed
const isArchitectureCorrect = computed(() => {
  return slot1Selection.value === 'endpoint' && 
         slot2Selection.value === 'cloud' && 
         slot3Selection.value === 'printer'
})

const allSlotsSelected = computed(() => {
  return slot1Selection.value && slot2Selection.value && slot3Selection.value
})

const isComplete = computed(() => {
  return isArchitectureCorrect.value && eliminatedServer.value
})

const filledSlots = computed(() => {
  let count = 0
  if (slot1Selection.value) count++
  if (slot2Selection.value) count++
  if (slot3Selection.value) count++
  return count
})

function getOptionById(id: string | null): ArchOption | null {
  if (!id) return null
  return archOptions.find((o) => o.id === id) || null
}

// Methods
function eliminateServer() {
  if (showSuccess.value || eliminatedServer.value) return

  // Start wire cutting animation
  showWireCutting.value = true

  setTimeout(() => {
    eliminatedServer.value = true
    showWireCutting.value = false
    showFeedback('eliminated', 'Legacy print server eliminated!')
    checkCompletion()
  }, 2500)
}

function checkCompletion() {
  if (isComplete.value) {
    setTimeout(() => {
      showSuccess.value = true
    }, 1000)
  }
}

function showFeedback(type: 'correct' | 'incorrect' | 'eliminated', message: string) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = null
  }, 2000)
}

function revealHint() {
  if (!showHint.value) {
    showHint.value = true
    gameStore.useHint(2)
  }
}

function proceed() {
  gameStore.completeLevel(2)
  router.push({ name: 'level', params: { id: '3' } })
}

function verifyArchitecture() {
  if (!allSlotsSelected.value) return
  
  if (isArchitectureCorrect.value) {
    showFeedback('correct', 'Architecture configured correctly!')
  } else {
    showFeedback('incorrect', 'Check the component order. Hint: Endpoint → Cloud → Printer')
  }
  
  checkCompletion()
}
</script>

<template>
  <div class="level2-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Data Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐ Moderate</span>
      </div>

      <div class="briefing-content">
        <div class="thermal-scan">
          <div class="scan-header">🔥 THERMAL SCAN RESULTS:</div>
          <ul class="scan-results">
            <li><span class="scan-value">10</span> print servers detected</li>
            <li>Each server: <span class="scan-cost">$2,000-$5,000</span> annual cost</li>
            <li>Total exposure: <span class="scan-cost">$20,000-$50,000/year</span></li>
            <li>Attack vectors: <span class="scan-critical">CRITICAL LEVEL</span></li>
          </ul>
        </div>

        <p class="task-description">
          <strong>YOUR MISSION:</strong> Build Vasion's cloud-native architecture by placing
          components in the correct sequence. The legacy print server must be
          <strong class="highlight-danger">ELIMINATED</strong>.
        </p>
      </div>

      <!-- Hint section -->
      <div class="hint-section">
        <button v-if="!showHint" class="hint-btn" @click="revealHint">? REQUEST INTEL (-5 points)</button>
        <div v-else class="hint-content">
          <span class="hint-label">INTEL:</span>
          <p>
            The flow goes: User device → Cloud for config → Direct to printer. No servers needed!
          </p>
        </div>
      </div>
    </div>

    <!-- Legacy architecture display -->
    <div class="legacy-architecture">
      <h3 class="section-title old-title">❌ THE OLD WAY (Legacy)</h3>
      <div class="architecture-flow legacy">
        <div class="flow-component">
          <span class="component-icon">💻</span>
          <span class="component-label">ENDPOINT</span>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-component danger">
          <span class="component-icon">🖥️</span>
          <span class="component-label">PRINT SERVER</span>
          <div class="danger-badges">
            <span class="danger-badge">⚠️ ATTACK VECTOR</span>
            <span class="danger-badge">⚠️ HIGH COST</span>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-component">
          <span class="component-icon">🖨️</span>
          <span class="component-label">PRINTER</span>
        </div>
      </div>
    </div>

    <!-- Feedback toast -->
    <Transition name="feedback">
      <div v-if="feedback" class="feedback-toast" :class="feedback.type">
        <span class="feedback-icon">
          {{ feedback.type === 'correct' ? '✓' : feedback.type === 'eliminated' ? '✂️' : '✗' }}
        </span>
        <span class="feedback-text">{{ feedback.message }}</span>
      </div>
    </Transition>

    <!-- Wire cutting animation overlay -->
    <Transition name="fade">
      <div v-if="showWireCutting" class="wire-cutting-overlay">
        <div class="wire-cutting-content">
          <div class="cutting-title">⚡ CUTTING LEGACY INFRASTRUCTURE ⚡</div>
          <div class="cutting-progress">
            <div class="progress-label">Print Server</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill cutting"></div>
            </div>
          </div>
          <div class="cutting-animation">
            <span class="scissors">✂️</span>
            <span class="wire"></span>
            <span class="sparks">💥</span>
          </div>
          <div class="cutting-status">
            <div>⚠️ Old print server removed</div>
            <div>✓ Cloud-native platform active</div>
            <div>✓ Attack vector eliminated</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- New architecture builder -->
    <div class="new-architecture">
      <h3 class="section-title new-title">✓ THE NEW WAY (Build It!)</h3>

      <div class="arch-info-box">
        <p>Build the Vasion cloud-native print flow by selecting the correct component for each step.</p>
        <p><strong>Remember:</strong> No print servers needed! 🚫🖥️</p>
      </div>

      <!-- Architecture flow builder with dropdowns -->
      <div class="arch-flow-builder">
        <div class="flow-header">
          <span class="flow-icon">🔄</span>
          <span class="flow-title">VASION PRINT FLOW</span>
        </div>
        <div class="flow-description">Select the correct component for each step in the flow</div>
        
        <div class="flow-slots">
          <div class="flow-slot">
            <label class="slot-label">Step 1: Source</label>
            <select v-model="slot1Selection" class="slot-select" :disabled="showSuccess">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions.filter(o => !o.isLegacy)" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Step 2: Routing</label>
            <select v-model="slot2Selection" class="slot-select" :disabled="showSuccess">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions.filter(o => !o.isLegacy)" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div class="flow-connector">→</div>
          
          <div class="flow-slot">
            <label class="slot-label">Step 3: Destination</label>
            <select v-model="slot3Selection" class="slot-select" :disabled="showSuccess">
              <option :value="null">Select...</option>
              <option v-for="opt in archOptions.filter(o => !o.isLegacy)" :key="opt.id" :value="opt.id">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Show selected flow preview -->
        <div v-if="allSlotsSelected" class="flow-preview">
          <span class="preview-item">{{ getOptionById(slot1Selection)?.icon }} {{ getOptionById(slot1Selection)?.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-item">{{ getOptionById(slot3Selection)?.icon }} {{ getOptionById(slot3Selection)?.label }}</span>
        </div>

        <!-- Hint/Result -->
        <div v-if="allSlotsSelected" class="arch-hint">
          <template v-if="isArchitectureCorrect">
            <span class="hint-success">✓ CORRECT! User device → Direct to printer. No servers!</span>
          </template>
          <template v-else>
            <span class="hint-info">💡 Hint: The flow goes: User device → Direct IP → To printer</span>
          </template>
        </div>

        <button 
          v-if="!isArchitectureCorrect || !allSlotsSelected" 
          class="btn btn-secondary verify-btn" 
          :disabled="!allSlotsSelected"
          @click="verifyArchitecture"
        >
          VERIFY ARCHITECTURE
        </button>
      </div>

      <!-- Elimination zone -->
      <div class="elimination-section">
        <h4 class="elimination-title">🗑️ LEGACY ELIMINATION</h4>
        <p class="elimination-desc">The legacy print server must be eliminated from the infrastructure.</p>
        
        <div
          class="elimination-zone"
          :class="{
            eliminated: eliminatedServer,
          }"
          @click="eliminateServer"
        >
          <div v-if="eliminatedServer" class="eliminated-content">
            <span class="eliminated-icon">✓</span>
            <span class="eliminated-text">PRINT SERVER ELIMINATED</span>
          </div>
          <div v-else class="elimination-content">
            <span class="trash-icon">🖥️</span>
            <span class="elimination-text">TAP TO ELIMINATE PRINT SERVER</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress indicator -->
    <div class="progress-indicator">
      <div class="progress-item" :class="{ complete: filledSlots >= 1 }">
        <span class="progress-check">{{ filledSlots >= 1 ? '✓' : '○' }}</span>
        <span>Component 1 placed</span>
      </div>
      <div class="progress-item" :class="{ complete: filledSlots >= 2 }">
        <span class="progress-check">{{ filledSlots >= 2 ? '✓' : '○' }}</span>
        <span>Component 2 placed</span>
      </div>
      <div class="progress-item" :class="{ complete: filledSlots >= 3 }">
        <span class="progress-check">{{ filledSlots >= 3 ? '✓' : '○' }}</span>
        <span>Component 3 placed</span>
      </div>
      <div class="progress-item" :class="{ complete: eliminatedServer }">
        <span class="progress-check">{{ eliminatedServer ? '✓' : '○' }}</span>
        <span>Legacy server eliminated</span>
      </div>
    </div>

    <!-- Success modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 2: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">THREAT ELIMINATED: Legacy print servers removed</div>

            <div class="architecture-result">
              <h3>VASION CLOUD-NATIVE ARCHITECTURE</h3>
              <div class="result-flow">
                <div class="result-step">
                  <span class="step-icon">💻</span>
                  <span class="step-name">ENDPOINT</span>
                  <span class="step-detail">Vasion client</span>
                </div>
                <div class="result-arrow">
                  <span class="arrow-icon">→</span>
                  <span class="arrow-label">Port 9100</span>
                </div>
                <div class="result-step">
                  <span class="step-icon">🖨️</span>
                  <span class="step-name">PRINTER</span>
                  <span class="step-detail">Direct IP</span>
                </div>
              </div>
            </div>

            <div class="savings-breakdown">
              <h3>💰 COST SAVINGS ANALYSIS</h3>
              <div class="savings-grid">
                <div class="savings-before">
                  <h4>BEFORE (10 Print Servers)</h4>
                  <ul>
                    <li>Annual cost: <span class="cost-bad">$20,000 - $50,000</span></li>
                    <li>Attack vectors: <span class="cost-bad">10 servers</span></li>
                    <li>Maintenance: <span class="cost-bad">500+ hours/year</span></li>
                  </ul>
                </div>
                <div class="savings-after">
                  <h4>AFTER (Vasion Cloud)</h4>
                  <ul>
                    <li>Server cost: <span class="cost-good">$0</span></li>
                    <li>Attack vectors: <span class="cost-good">0 servers</span></li>
                    <li>Maintenance: <span class="cost-good">&lt;50 hours/year</span></li>
                  </ul>
                </div>
              </div>
              <div class="savings-total">
                <div class="saving-item">💰 SAVINGS: $20,000 - $50,000/year</div>
                <div class="saving-item">🔒 SECURITY: 10 attack vectors eliminated</div>
                <div class="saving-item">⏱️ TIME SAVED: 450+ IT hours/year</div>
              </div>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">
              PROCEED TO OBJECTIVE 3 →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level2-puzzle {
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

/* Thermal scan */
.thermal-scan {
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 100, 0, 0.1));
  border: 1px solid rgba(255, 100, 0, 0.3);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.scan-header {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: #ff6600;
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
  color: #ff6600;
  font-weight: bold;
}

.scan-cost {
  color: var(--color-accent);
  font-weight: bold;
}

.scan-critical {
  color: #ff0000;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.task-description {
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  line-height: 1.7;
}

.highlight-danger {
  color: var(--color-accent);
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

/* Section titles */
.section-title {
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.old-title {
  color: var(--color-accent);
}

.new-title {
  color: var(--color-primary);
}

/* Legacy architecture display */
.legacy-architecture {
  background: var(--color-surface);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  opacity: 0.7;
}

.architecture-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.flow-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  min-width: 100px;
}

.flow-component.danger {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.1);
}

.component-icon {
  font-size: 1.5rem;
}

.component-label {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.danger-badges {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-xs);
}

.danger-badge {
  font-size: 0.55rem;
  color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
  padding: 2px 4px;
  border-radius: 2px;
}

.flow-arrow {
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

/* New architecture builder */
.new-architecture {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

/* Architecture info box */
.arch-info-box {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.arch-info-box p {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.arch-info-box p:last-child {
  margin-bottom: 0;
}

/* Architecture flow builder */
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

.slot-select:hover:not(:disabled) {
  border-color: var(--color-text-dim);
}

.slot-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.flow-connector {
  font-size: 1.5rem;
  color: var(--color-primary);
  padding-bottom: var(--space-sm);
}

@media (max-width: 600px) {
  .flow-connector {
    display: none;
  }

  .flow-slots {
    flex-direction: column;
    align-items: center;
  }

  .flow-slot {
    width: 100%;
    max-width: 100%;
  }
}

/* Flow preview */
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
  margin-bottom: var(--space-md);
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

/* Architecture hint */
.arch-hint {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface);
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

.verify-btn {
  width: 100%;
}

/* Elimination section */
.elimination-section {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.elimination-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-accent);
  margin-bottom: var(--space-sm);
}

.elimination-desc {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
}

/* Elimination zone */
.elimination-zone {
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  border: 2px dashed var(--color-accent);
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: rgba(255, 0, 102, 0.05);
}

.elimination-zone.active {
  border-style: solid;
  background: rgba(255, 0, 102, 0.2);
  animation: pulse 1s infinite;
}

.elimination-zone.eliminated {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.elimination-content,
.eliminated-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.trash-icon {
  font-size: 2rem;
}

.elimination-text {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

.eliminated-icon {
  font-size: 2rem;
  color: var(--color-primary);
}

.eliminated-text {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}


/* Progress indicator */
.progress-indicator {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  justify-content: center;
  margin-bottom: var(--space-xl);
}

.progress-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.progress-item.complete {
  color: var(--color-primary);
}

.progress-check {
  font-weight: bold;
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

.feedback-toast.correct,
.feedback-toast.eliminated {
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

/* Wire cutting overlay */
.wire-cutting-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wire-cutting-content {
  text-align: center;
  max-width: 400px;
  padding: var(--space-xl);
}

.cutting-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-warning);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-lg);
  animation: flicker 0.5s infinite;
}

.cutting-progress {
  margin-bottom: var(--space-lg);
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.progress-bar-container {
  height: 8px;
  background: var(--color-surface);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill.cutting {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-warning));
  animation: fillProgress 2s ease-out forwards;
}

@keyframes fillProgress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.cutting-animation {
  font-size: 2rem;
  margin-bottom: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.scissors {
  animation: snip 0.3s infinite;
}

@keyframes snip {
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
}

.wire {
  width: 60px;
  height: 4px;
  background: var(--color-accent);
  animation: cutWire 2s ease-out forwards;
}

@keyframes cutWire {
  0% {
    width: 60px;
  }
  80% {
    width: 60px;
  }
  100% {
    width: 0;
    opacity: 0;
  }
}

.sparks {
  animation: sparkle 0.2s infinite;
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.cutting-status {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  line-height: 1.8;
}

.cutting-status div:first-child {
  color: var(--color-warning);
}

.cutting-status div:nth-child(2),
.cutting-status div:nth-child(3) {
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
  letter-spacing: 0.1em;
}

.success-content {
  padding: var(--space-lg);
}

.success-message {
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
  letter-spacing: 0.05em;
}

/* Architecture result */
.architecture-result {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.architecture-result h3 {
  font-size: 0.75rem;
  color: var(--color-secondary);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: var(--space-md);
}

.result-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.result-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.step-icon {
  font-size: 1.5rem;
}

.step-name {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--color-primary);
}

.step-detail {
  font-size: 0.55rem;
  color: var(--color-text-muted);
}

.result-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.arrow-icon {
  font-size: 1.25rem;
  color: var(--color-secondary);
}

.arrow-label {
  font-size: 0.5rem;
  color: var(--color-text-muted);
}

/* Savings breakdown */
.savings-breakdown {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.savings-breakdown h3 {
  font-size: 0.75rem;
  color: var(--color-warning);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: var(--space-md);
}

.savings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

@media (max-width: 480px) {
  .savings-grid {
    grid-template-columns: 1fr;
  }
}

.savings-before,
.savings-after {
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
}

.savings-before {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.savings-after {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.savings-before h4,
.savings-after h4 {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-sm);
}

.savings-before h4 {
  color: var(--color-accent);
}

.savings-after h4 {
  color: var(--color-primary);
}

.savings-before ul,
.savings-after ul {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.cost-bad {
  color: var(--color-accent);
}

.cost-good {
  color: var(--color-primary);
}

.savings-total {
  text-align: center;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.saving-item {
  font-size: 0.75rem;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
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

.modal-enter-from .success-modal,
.modal-leave-to .success-modal {
  transform: scale(0.9);
}
</style>
