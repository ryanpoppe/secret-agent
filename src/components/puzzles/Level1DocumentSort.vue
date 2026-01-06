<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Card data with requirements
interface RequirementCard {
  id: string
  code: string
  description: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  correctCategory: 'MODERNIZE' | 'CONSOLIDATE' | 'AUTOMATE'
}

const allCards: RequirementCard[] = [
  {
    id: '1',
    code: 'REQ-2024-001',
    description: 'Replace legacy print servers with cloud-native SaaS platform',
    priority: 'CRITICAL',
    correctCategory: 'MODERNIZE',
  },
  {
    id: '2',
    code: 'REQ-2024-002',
    description: 'Implement zero-trust security architecture and protocols',
    priority: 'CRITICAL',
    correctCategory: 'MODERNIZE',
  },
  {
    id: '3',
    code: 'REQ-2024-003',
    description: 'Unified platform for end-user and system printing (EHR/ERP)',
    priority: 'HIGH',
    correctCategory: 'CONSOLIDATE',
  },
  {
    id: '4',
    code: 'REQ-2024-004',
    description: 'AI-powered document processing and intelligent workflows',
    priority: 'MEDIUM',
    correctCategory: 'AUTOMATE',
  },
  {
    id: '5',
    code: 'REQ-2024-005',
    description: 'Eliminate separate backend and frontend print infrastructure',
    priority: 'HIGH',
    correctCategory: 'CONSOLIDATE',
  },
  {
    id: '6',
    code: 'REQ-2024-006',
    description: 'VAI (Vasion AI) assistant for automated form generation and workflow creation',
    priority: 'MEDIUM',
    correctCategory: 'AUTOMATE',
  },
  {
    id: '7',
    code: 'REQ-2024-007',
    description: 'Technology-agnostic platform supporting all OS, devices, and identity systems',
    priority: 'CRITICAL',
    correctCategory: 'MODERNIZE',
  },
  {
    id: '8',
    code: 'REQ-2024-008',
    description: 'Agnostic support for Electronic Medical Records (EMR) and ERP systems',
    priority: 'HIGH',
    correctCategory: 'CONSOLIDATE',
  },
  {
    id: '9',
    code: 'REQ-2024-009',
    description: 'Enterprise-grade security certifications (FedRAMP, SOC 2, ISO 27001, ISO 42001)',
    priority: 'CRITICAL',
    correctCategory: 'MODERNIZE',
  },
  {
    id: '10',
    code: 'REQ-2024-010',
    description: 'AI-powered intelligent management for automated driver updates & deployments',
    priority: 'MEDIUM',
    correctCategory: 'AUTOMATE',
  },
  {
    id: '11',
    code: 'REQ-2024-011',
    description: 'Single SaaS platform replacing multiple legacy output management solutions',
    priority: 'HIGH',
    correctCategory: 'CONSOLIDATE',
  },
  {
    id: '12',
    code: 'REQ-2024-012',
    description: 'Vasion Sign for electronic signatures with automated approval workflows',
    priority: 'MEDIUM',
    correctCategory: 'AUTOMATE',
  },
]

type Category = 'MODERNIZE' | 'CONSOLIDATE' | 'AUTOMATE'

// Shuffle array helper
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j] as T
    shuffled[j] = temp as T
  }
  return shuffled
}

// State
const unplacedCards = ref<RequirementCard[]>([])
const placedCards = ref<Record<Category, RequirementCard[]>>({
  MODERNIZE: [],
  CONSOLIDATE: [],
  AUTOMATE: [],
})
const selectedCard = ref<RequirementCard | null>(null)
const feedback = ref<{ type: 'correct' | 'incorrect'; message: string } | null>(null)
const correctCount = ref(0)
const incorrectPlacements = ref<Set<string>>(new Set())
const isComplete = ref(false)
const showResults = ref(false)
const showHint = ref(false)

// Computed
const score = computed(() => {
  return Math.round((correctCount.value / 12) * 100)
})

const grade = computed(() => {
  if (correctCount.value === 12) return 'PERFECT'
  if (correctCount.value >= 10) return 'EXCELLENT'
  if (correctCount.value >= 9) return 'PASSING'
  return 'FAILED'
})

const gradeMessage = computed(() => {
  if (correctCount.value === 12) return 'Exceptional intelligence analysis, Agent!'
  if (correctCount.value >= 10) return 'Outstanding work. You understand the mission.'
  if (correctCount.value >= 9) return 'Adequate performance. Proceed with caution.'
  return 'Insufficient knowledge. Review materials and retry.'
})

const canProceed = computed(() => correctCount.value >= 9)

// Methods
function selectCard(card: RequirementCard) {
  if (isComplete.value) return
  selectedCard.value = card
}

function placeCard(category: Category) {
  if (!selectedCard.value || isComplete.value) return

  const card = selectedCard.value
  categorizeCard(card, category)
}

function categorizeCard(card: RequirementCard, category: Category) {
  if (isComplete.value) return

  const isCorrect = card.correctCategory === category

  // Remove from unplaced
  unplacedCards.value = unplacedCards.value.filter((c) => c.id !== card.id)

  // Add to placed
  placedCards.value[category].push(card)

  // Track result
  if (isCorrect) {
    correctCount.value++
    feedback.value = {
      type: 'correct',
      message: 'CLASSIFIED - CORRECT CATEGORY',
    }
  } else {
    incorrectPlacements.value.add(card.id)
    feedback.value = {
      type: 'incorrect',
      message: 'ACCESS DENIED - INCORRECT CATEGORY',
    }
  }

  // Clear selection
  selectedCard.value = null

  // Clear feedback after delay
  setTimeout(() => {
    feedback.value = null
  }, 1500)

  // Check if all cards placed
  if (unplacedCards.value.length === 0) {
    setTimeout(() => {
      isComplete.value = true
      showResults.value = true
    }, 500)
  }
}

function categorizeCardDirect(card: RequirementCard, category: Category, event: Event) {
  event.stopPropagation()
  categorizeCard(card, category)
}

function handleDragStart(event: DragEvent, card: RequirementCard) {
  if (isComplete.value) return
  selectedCard.value = card
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', card.id)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(event: DragEvent, category: Category) {
  event.preventDefault()
  placeCard(category)
}

function handleDragEnd() {
  // Only clear if not dropped in a valid zone
  // The drop handler will handle clearing when valid
}

function retry() {
  unplacedCards.value = shuffle([...allCards])
  placedCards.value = {
    MODERNIZE: [],
    CONSOLIDATE: [],
    AUTOMATE: [],
  }
  selectedCard.value = null
  feedback.value = null
  correctCount.value = 0
  incorrectPlacements.value.clear()
  isComplete.value = false
  showResults.value = false
}

function proceed() {
  gameStore.completeLevel(1)
  router.push({ name: 'level', params: { id: '2' } })
}

function revealHint() {
  if (!showHint.value) {
    showHint.value = true
    gameStore.useHint(1)
  }
}

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'priority-critical'
    case 'HIGH':
      return 'priority-high'
    default:
      return 'priority-medium'
  }
}

onMounted(() => {
  unplacedCards.value = shuffle([...allCards])
})
</script>

<template>
  <div class="level1-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries Intelligence Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐ Basic</span>
      </div>

      <div class="briefing-content">
        <p>
          Agent, you've successfully infiltrated Apex Industries' secure network. Before we can
          deploy countermeasures, you need to understand the
          <strong class="highlight">three pillars</strong> of Intelligent Print Automation.
        </p>
        <p class="task-description">
          <strong>YOUR TASK:</strong> Sort the 12 intercepted requirement cards into the correct
          categories. You must correctly categorize at least
          <strong class="highlight">9 out of 12</strong> to proceed.
        </p>
      </div>

      <!-- Hint section -->
      <div class="hint-section">
        <button v-if="!showHint" class="hint-btn" @click="revealHint">? REQUEST INTEL (-5 points)</button>
        <div v-else class="hint-content">
          <span class="hint-label">INTEL:</span>
          <ul class="hint-list">
            <li><strong>MODERNIZE</strong> = Cloud, security, platform updates</li>
            <li><strong>CONSOLIDATE</strong> = Unifying systems, single platform</li>
            <li><strong>AUTOMATE</strong> = AI, workflows, automated processes</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Score display -->
    <div class="score-display">
      <span class="score-label">CORRECT:</span>
      <span class="score-value">{{ correctCount }}/12</span>
      <span class="score-remaining">({{ unplacedCards.length }} remaining)</span>
    </div>

    <!-- Feedback toast -->
    <Transition name="feedback">
      <div v-if="feedback" class="feedback-toast" :class="feedback.type">
        <span class="feedback-icon">{{ feedback.type === 'correct' ? '✓' : '✗' }}</span>
        <span class="feedback-text">{{ feedback.message }}</span>
      </div>
    </Transition>

    <!-- Card sorting area -->
    <div class="sorting-area">
      <!-- Unplaced cards -->
      <div class="cards-source">
        <h3 class="source-title">INTERCEPTED DOCUMENTS</h3>
        <div class="cards-stack">
          <div
            v-for="card in unplacedCards"
            :key="card.id"
            class="requirement-card"
            :class="{ selected: selectedCard?.id === card.id }"
            draggable="true"
            @click="selectCard(card)"
            @dragstart="handleDragStart($event, card)"
            @dragend="handleDragEnd"
          >
            <div class="card-header">
              <span class="card-code">{{ card.code }}</span>
              <span class="card-priority" :class="getPriorityClass(card.priority)">
                {{ card.priority }}
              </span>
            </div>
            <p class="card-description">{{ card.description }}</p>

            <!-- Category buttons for easy mobile interaction -->
            <div class="card-actions">
              <button
                class="category-btn modernize"
                @click="categorizeCardDirect(card, 'MODERNIZE', $event)"
              >
                MODERNIZE
              </button>
              <button
                class="category-btn consolidate"
                @click="categorizeCardDirect(card, 'CONSOLIDATE', $event)"
              >
                CONSOLIDATE
              </button>
              <button
                class="category-btn automate"
                @click="categorizeCardDirect(card, 'AUTOMATE', $event)"
              >
                AUTOMATE
              </button>
            </div>
          </div>

          <div v-if="unplacedCards.length === 0 && !isComplete" class="empty-stack">
            All documents classified
          </div>
        </div>
      </div>

      <!-- Category columns -->
      <div class="categories-container">
        <!-- MODERNIZE -->
        <div
          class="category-column modernize"
          :class="{ 'drop-target': selectedCard !== null }"
          @click="placeCard('MODERNIZE')"
          @dragover="handleDragOver"
          @drop="handleDrop($event, 'MODERNIZE')"
        >
          <div class="column-header">
            <h3 class="column-title">MODERNIZE</h3>
            <span class="column-count">{{ placedCards.MODERNIZE.length }}/4</span>
          </div>
          <div class="column-description">Cloud-native, Zero-trust, Agnostic</div>
          <div class="placed-cards">
            <div
              v-for="card in placedCards.MODERNIZE"
              :key="card.id"
              class="placed-card"
              :class="{ incorrect: incorrectPlacements.has(card.id) }"
            >
              <span class="placed-code">{{ card.code }}</span>
              <span class="placed-status">
                {{ incorrectPlacements.has(card.id) ? '✗' : '✓' }}
              </span>
            </div>
          </div>
          <div v-if="selectedCard" class="drop-hint">TAP TO PLACE</div>
        </div>

        <!-- CONSOLIDATE -->
        <div
          class="category-column consolidate"
          :class="{ 'drop-target': selectedCard !== null }"
          @click="placeCard('CONSOLIDATE')"
          @dragover="handleDragOver"
          @drop="handleDrop($event, 'CONSOLIDATE')"
        >
          <div class="column-header">
            <h3 class="column-title">CONSOLIDATE</h3>
            <span class="column-count">{{ placedCards.CONSOLIDATE.length }}/4</span>
          </div>
          <div class="column-description">Unified platform, Single solution</div>
          <div class="placed-cards">
            <div
              v-for="card in placedCards.CONSOLIDATE"
              :key="card.id"
              class="placed-card"
              :class="{ incorrect: incorrectPlacements.has(card.id) }"
            >
              <span class="placed-code">{{ card.code }}</span>
              <span class="placed-status">
                {{ incorrectPlacements.has(card.id) ? '✗' : '✓' }}
              </span>
            </div>
          </div>
          <div v-if="selectedCard" class="drop-hint">TAP TO PLACE</div>
        </div>

        <!-- AUTOMATE -->
        <div
          class="category-column automate"
          :class="{ 'drop-target': selectedCard !== null }"
          @click="placeCard('AUTOMATE')"
          @dragover="handleDragOver"
          @drop="handleDrop($event, 'AUTOMATE')"
        >
          <div class="column-header">
            <h3 class="column-title">AUTOMATE</h3>
            <span class="column-count">{{ placedCards.AUTOMATE.length }}/4</span>
          </div>
          <div class="column-description">AI-powered, Intelligent workflows</div>
          <div class="placed-cards">
            <div
              v-for="card in placedCards.AUTOMATE"
              :key="card.id"
              class="placed-card"
              :class="{ incorrect: incorrectPlacements.has(card.id) }"
            >
              <span class="placed-code">{{ card.code }}</span>
              <span class="placed-status">
                {{ incorrectPlacements.has(card.id) ? '✗' : '✓' }}
              </span>
            </div>
          </div>
          <div v-if="selectedCard" class="drop-hint">TAP TO PLACE</div>
        </div>
      </div>
    </div>

    <!-- Results modal -->
    <Transition name="modal">
      <div v-if="showResults" class="results-overlay">
        <div class="results-modal">
          <div class="results-header" :class="{ success: canProceed, failure: !canProceed }">
            <h2>INTELLIGENCE ANALYSIS: {{ canProceed ? 'COMPLETE' : 'INCOMPLETE' }}</h2>
          </div>

          <div class="results-content">
            <div class="results-score">
              <span class="score-number">{{ correctCount }}/12</span>
              <span class="score-percentage">({{ score }}%)</span>
            </div>

            <div class="results-grade" :class="grade.toLowerCase()">GRADE: {{ grade }}</div>

            <p class="results-message">{{ gradeMessage }}</p>

            <div v-if="canProceed" class="pillars-summary">
              <h3>THE THREE PILLARS OF IPA:</h3>
              <div class="pillar-item modernize">
                <span class="pillar-check">✓</span>
                <span class="pillar-name">MODERNIZATION</span>
                <span class="pillar-desc">Cloud-native, zero-trust, agnostic platform</span>
              </div>
              <div class="pillar-item consolidate">
                <span class="pillar-check">✓</span>
                <span class="pillar-name">CONSOLIDATION</span>
                <span class="pillar-desc">Unified platform for all printing needs</span>
              </div>
              <div class="pillar-item automate">
                <span class="pillar-check">✓</span>
                <span class="pillar-name">AUTOMATION</span>
                <span class="pillar-desc">AI-powered workflows and intelligent management</span>
              </div>
            </div>
          </div>

          <div class="results-actions">
            <button v-if="!canProceed" class="btn btn-secondary" @click="retry">
              ↺ RETRY MISSION
            </button>
            <button v-if="canProceed" class="btn btn-primary btn-lg" @click="proceed">
              PROCEED TO OBJECTIVE 2 →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level1-puzzle {
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

.briefing-content p {
  color: var(--color-text);
  line-height: 1.7;
  margin-bottom: var(--space-sm);
}

.highlight {
  color: var(--color-primary);
}

.task-description {
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
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

.hint-list {
  list-style: none;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.hint-list li {
  margin-bottom: var(--space-xs);
}

/* Score display */
.score-display {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  font-family: var(--font-display);
}

.score-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.score-value {
  font-size: 1.25rem;
  color: var(--color-primary);
}

.score-remaining {
  font-size: 0.75rem;
  color: var(--color-text-muted);
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

.feedback-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

/* Sorting area */
.sorting-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Cards source */
.cards-source {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.source-title {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-md);
}

.cards-stack {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.empty-stack {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Requirement card */
.requirement-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  cursor: grab;
  transition: all var(--transition-fast);
  user-select: none;
}

.requirement-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.1);
}

.requirement-card.selected {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 3px var(--color-primary-dim),
    var(--shadow-glow);
  transform: scale(1.02);
}

.requirement-card:active {
  cursor: grabbing;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.card-code {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.card-priority {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 2px;
}

.priority-critical {
  background: var(--color-accent-dim);
  color: var(--color-accent);
}

.priority-high {
  background: var(--color-warning-dim);
  color: var(--color-warning);
}

.priority-medium {
  background: var(--color-secondary-dim);
  color: var(--color-secondary);
}

.card-description {
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

/* Card action buttons */
.card-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.category-btn {
  flex: 1;
  padding: var(--space-sm) var(--space-xs);
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border: 1px solid;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 36px;
}

.category-btn.modernize {
  color: #00d9ff;
  border-color: #00d9ff;
}

.category-btn.modernize:hover {
  background: rgba(0, 217, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}

.category-btn.consolidate {
  color: #00ff41;
  border-color: #00ff41;
}

.category-btn.consolidate:hover {
  background: rgba(0, 255, 65, 0.2);
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
}

.category-btn.automate {
  color: #9d00ff;
  border-color: #9d00ff;
}

.category-btn.automate:hover {
  background: rgba(157, 0, 255, 0.2);
  box-shadow: 0 0 10px rgba(157, 0, 255, 0.3);
}

.category-btn:active {
  transform: scale(0.95);
}

/* Category columns */
.categories-container {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .categories-container {
    grid-template-columns: 1fr;
  }
}

.category-column {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  min-height: 200px;
  transition: all var(--transition-fast);
}

.category-column.drop-target {
  border-style: dashed;
}

.category-column.modernize {
  border-color: #00d9ff;
}

.category-column.modernize .column-title,
.category-column.modernize .column-count {
  color: #00d9ff;
}

.category-column.consolidate {
  border-color: #00ff41;
}

.category-column.consolidate .column-title,
.category-column.consolidate .column-count {
  color: #00ff41;
}

.category-column.automate {
  border-color: #9d00ff;
}

.category-column.automate .column-title,
.category-column.automate .column-count {
  color: #9d00ff;
}

.category-column.drop-target:hover {
  background: var(--color-surface-elevated);
  transform: scale(1.02);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.column-title {
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
}

.column-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.column-description {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.placed-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.placed-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.placed-code {
  font-family: var(--font-mono);
  color: var(--color-text-dim);
}

.placed-status {
  font-weight: bold;
  color: var(--color-primary);
}

.placed-card.incorrect .placed-status {
  color: var(--color-accent);
}

.drop-hint {
  text-align: center;
  padding: var(--space-md);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  animation: pulse 1.5s infinite;
}

/* Results modal */
.results-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: 1000;
}

.results-modal {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}

.results-header {
  padding: var(--space-lg);
  text-align: center;
  border-bottom: 1px solid var(--color-border);
}

.results-header h2 {
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.results-header.success {
  background: var(--color-primary-glow);
  border-color: var(--color-primary);
}

.results-header.success h2 {
  color: var(--color-primary);
}

.results-header.failure {
  background: var(--color-accent-dim);
  border-color: var(--color-accent);
}

.results-header.failure h2 {
  color: var(--color-accent);
}

.results-content {
  padding: var(--space-xl);
  text-align: center;
}

.results-score {
  margin-bottom: var(--space-md);
}

.score-number {
  font-family: var(--font-display);
  font-size: 3rem;
  color: var(--color-text);
}

.score-percentage {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  margin-left: var(--space-sm);
}

.results-grade {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.15em;
  padding: var(--space-sm) var(--space-lg);
  display: inline-block;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.results-grade.perfect {
  background: linear-gradient(135deg, #00ff88, #00d9ff);
  color: var(--color-background);
}

.results-grade.excellent {
  background: var(--color-primary);
  color: var(--color-background);
}

.results-grade.passing {
  background: var(--color-warning);
  color: var(--color-background);
}

.results-grade.failed {
  background: var(--color-accent);
  color: var(--color-text);
}

.results-message {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
}

.pillars-summary {
  text-align: left;
  background: var(--color-surface-elevated);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-top: var(--space-lg);
}

.pillars-summary h3 {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
  text-align: center;
}

.pillar-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-xs) var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.pillar-item:last-child {
  border-bottom: none;
}

.pillar-check {
  font-weight: bold;
  grid-row: span 2;
  align-self: center;
}

.pillar-item.modernize .pillar-check,
.pillar-item.modernize .pillar-name {
  color: #00d9ff;
}

.pillar-item.consolidate .pillar-check,
.pillar-item.consolidate .pillar-name {
  color: #00ff41;
}

.pillar-item.automate .pillar-check,
.pillar-item.automate .pillar-name {
  color: #9d00ff;
}

.pillar-name {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

.pillar-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.results-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  gap: var(--space-md);
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .results-modal,
.modal-leave-to .results-modal {
  transform: scale(0.9);
}
</style>
