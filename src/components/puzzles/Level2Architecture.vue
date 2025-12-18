<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Component definitions
interface ArchitectureComponent {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  isLegacy: boolean
  details: string[]
}

const components: ArchitectureComponent[] = [
  {
    id: 'endpoint',
    name: 'ENDPOINT',
    shortName: 'ENDPOINT',
    description: 'Workstation with Vasion client',
    icon: '💻',
    isLegacy: false,
    details: ['Windows, Mac, Linux, Chrome', 'Vasion client installed'],
  },
  {
    id: 'cloud',
    name: 'CLOUD',
    shortName: 'CLOUD',
    description: 'Vasion SaaS Platform',
    icon: '☁️',
    isLegacy: false,
    details: ['Printer configurations', 'Driver profiles', 'Security policies', 'TLS Port 443'],
  },
  {
    id: 'printer',
    name: 'PRINTER',
    shortName: 'PRINTER',
    description: 'Physical Print Device',
    icon: '🖨️',
    isLegacy: false,
    details: ['Direct IP printing', 'Port 9100', 'Local network'],
  },
  {
    id: 'server',
    name: 'PRINT SERVER',
    shortName: 'SERVER',
    description: 'Legacy Infrastructure',
    icon: '🖥️',
    isLegacy: true,
    details: ['❌ NOT NEEDED', '❌ ELIMINATE THIS'],
  },
]

// Correct order for the architecture
const correctOrder = ['endpoint', 'cloud', 'printer']

// State
const availableComponents = ref<ArchitectureComponent[]>([])
const slots = ref<(ArchitectureComponent | null)[]>([null, null, null])
const eliminatedServer = ref(false)
const selectedComponent = ref<ArchitectureComponent | null>(null)
const showWireCutting = ref(false)
const showSuccess = ref(false)
const showHint = ref(false)
const feedback = ref<{ type: 'correct' | 'incorrect' | 'eliminated'; message: string } | null>(null)

// Computed
const isArchitectureCorrect = computed(() => {
  return slots.value.every((slot, index) => slot?.id === correctOrder[index])
})

const isComplete = computed(() => {
  return isArchitectureCorrect.value && eliminatedServer.value
})

const filledSlots = computed(() => {
  return slots.value.filter(s => s !== null).length
})

// Methods
function selectComponent(component: ArchitectureComponent) {
  if (showSuccess.value) return
  selectedComponent.value = component
}

function placeInSlot(slotIndex: number) {
  if (!selectedComponent.value || showSuccess.value) return
  
  const component = selectedComponent.value
  
  // Don't allow placing print server in slots
  if (component.isLegacy) {
    showFeedback('incorrect', 'Legacy servers cannot be part of the new architecture!')
    return
  }
  
  // Check if already placed somewhere else
  const existingSlotIndex = slots.value.findIndex(s => s?.id === component.id)
  if (existingSlotIndex !== -1) {
    slots.value[existingSlotIndex] = null
  }
  
  // Place in new slot
  slots.value[slotIndex] = component
  
  // Remove from available
  availableComponents.value = availableComponents.value.filter(c => c.id !== component.id)
  
  // Add back any component that was in this slot
  const previousComponent = slots.value[slotIndex]
  if (previousComponent && previousComponent.id !== component.id) {
    availableComponents.value.push(previousComponent)
  }
  
  selectedComponent.value = null
  
  // Check if correct
  if (slots.value[slotIndex]?.id === correctOrder[slotIndex]) {
    showFeedback('correct', 'Component placed correctly!')
  }
  
  checkCompletion()
}

function eliminateServer() {
  if (showSuccess.value) return
  
  const serverComponent = selectedComponent.value
  if (!serverComponent?.isLegacy) {
    if (selectedComponent.value) {
      showFeedback('incorrect', 'Only legacy infrastructure should be eliminated!')
    }
    return
  }
  
  // Start wire cutting animation
  showWireCutting.value = true
  selectedComponent.value = null
  
  // Remove from available
  availableComponents.value = availableComponents.value.filter(c => c.id !== 'server')
  
  setTimeout(() => {
    eliminatedServer.value = true
    showWireCutting.value = false
    showFeedback('eliminated', 'Legacy print server eliminated!')
    checkCompletion()
  }, 2500)
}

function directPlaceInSlot(component: ArchitectureComponent, slotIndex: number, event: Event) {
  event.stopPropagation()
  
  if (showSuccess.value) return
  
  if (component.isLegacy) {
    showFeedback('incorrect', 'Legacy servers cannot be part of the new architecture!')
    return
  }
  
  // Remove from any existing slot
  const existingSlotIndex = slots.value.findIndex(s => s?.id === component.id)
  if (existingSlotIndex !== -1) {
    slots.value[existingSlotIndex] = null
  }
  
  // Place in slot
  slots.value[slotIndex] = component
  
  // Remove from available
  availableComponents.value = availableComponents.value.filter(c => c.id !== component.id)
  
  if (slots.value[slotIndex]?.id === correctOrder[slotIndex]) {
    showFeedback('correct', 'Component placed correctly!')
  }
  
  checkCompletion()
}

function directEliminateServer(component: ArchitectureComponent, event: Event) {
  event.stopPropagation()
  
  if (!component.isLegacy || showSuccess.value) return
  
  showWireCutting.value = true
  availableComponents.value = availableComponents.value.filter(c => c.id !== 'server')
  
  setTimeout(() => {
    eliminatedServer.value = true
    showWireCutting.value = false
    showFeedback('eliminated', 'Legacy print server eliminated!')
    checkCompletion()
  }, 2500)
}

function removeFromSlot(slotIndex: number) {
  const component = slots.value[slotIndex]
  if (component && !showSuccess.value) {
    slots.value[slotIndex] = null
    availableComponents.value.push(component)
  }
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

// Drag and drop handlers
function handleDragStart(event: DragEvent, component: ArchitectureComponent) {
  if (showSuccess.value) return
  selectedComponent.value = component
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', component.id)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDropOnSlot(event: DragEvent, slotIndex: number) {
  event.preventDefault()
  placeInSlot(slotIndex)
}

function handleDropOnTrash(event: DragEvent) {
  event.preventDefault()
  eliminateServer()
}

onMounted(() => {
  // Shuffle components
  availableComponents.value = [...components].sort(() => Math.random() - 0.5)
})
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
        <button v-if="!showHint" class="hint-btn" @click="revealHint">
          ? REQUEST INTEL
        </button>
        <div v-else class="hint-content">
          <span class="hint-label">INTEL:</span>
          <p>The flow goes: User device → Cloud for config → Direct to printer. No servers needed!</p>
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
      
      <!-- Architecture slots -->
      <div class="architecture-builder">
        <div 
          v-for="(slot, index) in slots" 
          :key="index"
          class="architecture-slot"
          :class="{ 
            filled: slot !== null,
            correct: slot?.id === correctOrder[index],
            'drop-target': selectedComponent !== null && !selectedComponent.isLegacy
          }"
          @click="placeInSlot(index)"
          @dragover="handleDragOver"
          @drop="handleDropOnSlot($event, index)"
        >
          <div v-if="slot" class="slot-content">
            <span class="slot-icon">{{ slot.icon }}</span>
            <span class="slot-name">{{ slot.shortName }}</span>
            <button class="remove-btn" @click.stop="removeFromSlot(index)">×</button>
          </div>
          <div v-else class="slot-placeholder">
            <span class="slot-number">{{ index + 1 }}</span>
            <span class="slot-hint">{{ selectedComponent && !selectedComponent.isLegacy ? 'TAP TO PLACE' : 'DROP HERE' }}</span>
          </div>
        </div>
        
        <!-- Flow arrows between slots -->
        <div class="flow-connector" style="left: calc(33.33% - 15px)">→</div>
        <div class="flow-connector" style="left: calc(66.66% - 15px)">→</div>
      </div>

      <!-- Elimination zone -->
      <div 
        class="elimination-zone"
        :class="{ 
          active: selectedComponent?.isLegacy,
          eliminated: eliminatedServer
        }"
        @click="eliminateServer"
        @dragover="handleDragOver"
        @drop="handleDropOnTrash($event)"
      >
        <div v-if="eliminatedServer" class="eliminated-content">
          <span class="eliminated-icon">✓</span>
          <span class="eliminated-text">PRINT SERVER ELIMINATED</span>
        </div>
        <div v-else class="elimination-content">
          <span class="trash-icon">🗑️</span>
          <span class="elimination-text">
            {{ selectedComponent?.isLegacy ? 'TAP TO ELIMINATE' : 'DRAG LEGACY SERVER HERE' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Available components -->
    <div class="components-section">
      <h3 class="section-title">AVAILABLE COMPONENTS</h3>
      <div class="components-grid">
        <div
          v-for="component in availableComponents"
          :key="component.id"
          class="component-card"
          :class="{ 
            selected: selectedComponent?.id === component.id,
            legacy: component.isLegacy
          }"
          draggable="true"
          @click="selectComponent(component)"
          @dragstart="handleDragStart($event, component)"
        >
          <div class="component-header">
            <span class="component-icon-large">{{ component.icon }}</span>
            <span class="component-name">{{ component.name }}</span>
            <span v-if="component.isLegacy" class="legacy-badge">LEGACY</span>
          </div>
          <p class="component-description">{{ component.description }}</p>
          <ul class="component-details">
            <li v-for="(detail, i) in component.details" :key="i">{{ detail }}</li>
          </ul>
          
          <!-- Action buttons -->
          <div class="component-actions">
            <template v-if="!component.isLegacy">
              <button 
                class="action-btn slot-1"
                @click="directPlaceInSlot(component, 0, $event)"
              >
                SLOT 1
              </button>
              <button 
                class="action-btn slot-2"
                @click="directPlaceInSlot(component, 1, $event)"
              >
                SLOT 2
              </button>
              <button 
                class="action-btn slot-3"
                @click="directPlaceInSlot(component, 2, $event)"
              >
                SLOT 3
              </button>
            </template>
            <template v-else>
              <button 
                class="action-btn eliminate"
                @click="directEliminateServer(component, $event)"
              >
                🗑️ ELIMINATE
              </button>
            </template>
          </div>
        </div>
        
        <div v-if="availableComponents.length === 0" class="empty-components">
          All components placed!
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
            <div class="success-message">
              THREAT ELIMINATED: Legacy print servers removed
            </div>
            
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
                  <span class="arrow-label">TLS 443</span>
                </div>
                <div class="result-step">
                  <span class="step-icon">☁️</span>
                  <span class="step-name">CLOUD</span>
                  <span class="step-detail">Config & policies</span>
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

.architecture-builder {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-lg);
  position: relative;
  padding: var(--space-lg) 0;
  flex-wrap: wrap;
}

.architecture-slot {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-surface-elevated);
}

.architecture-slot.drop-target {
  border-color: var(--color-primary);
  background: var(--color-primary-glow);
}

.architecture-slot.filled {
  border-style: solid;
  border-color: var(--color-secondary);
}

.architecture-slot.correct {
  border-color: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-dim);
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  position: relative;
  width: 100%;
  height: 100%;
  justify-content: center;
}

.slot-icon {
  font-size: 2rem;
}

.slot-name {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.slot-number {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

.slot-hint {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
}

.flow-connector {
  position: absolute;
  font-size: 2rem;
  color: var(--color-primary);
  top: 50%;
  transform: translateY(-50%);
}

@media (max-width: 600px) {
  .flow-connector {
    display: none;
  }
  
  .architecture-builder {
    flex-direction: column;
  }
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

/* Components section */
.components-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.components-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.component-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  cursor: grab;
  transition: all var(--transition-fast);
}

.component-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.component-card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.component-card.legacy {
  border-color: var(--color-accent);
  background: rgba(255, 0, 102, 0.05);
}

.component-card.legacy:hover {
  border-color: var(--color-accent);
}

.component-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.component-icon-large {
  font-size: 1.5rem;
}

.component-name {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--color-text);
  letter-spacing: 0.1em;
}

.legacy-badge {
  font-size: 0.55rem;
  color: var(--color-accent);
  background: rgba(255, 0, 102, 0.2);
  padding: 2px 6px;
  border-radius: 2px;
  margin-left: auto;
}

.component-description {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.component-details {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.component-details li {
  margin-bottom: 2px;
}

/* Component action buttons */
.component-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.action-btn {
  flex: 1;
  padding: var(--space-sm);
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 36px;
}

.action-btn:hover {
  background: var(--color-primary-dim);
}

.action-btn.eliminate {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.action-btn.eliminate:hover {
  background: rgba(255, 0, 102, 0.2);
}

.empty-components {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  font-style: italic;
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
  from { width: 0; }
  to { width: 100%; }
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
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

.wire {
  width: 60px;
  height: 4px;
  background: var(--color-accent);
  animation: cutWire 2s ease-out forwards;
}

@keyframes cutWire {
  0% { width: 60px; }
  80% { width: 60px; }
  100% { width: 0; opacity: 0; }
}

.sparks {
  animation: sparkle 0.2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
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

