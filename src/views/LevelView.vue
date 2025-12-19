<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { usePuzzleStore } from '@/stores/puzzle'
import Level1DocumentSort from '@/components/puzzles/Level1DocumentSort.vue'
import Level2Architecture from '@/components/puzzles/Level2Architecture.vue'
import Level3Compatibility from '@/components/puzzles/Level3Compatibility.vue'
import Level4ZeroTrust from '@/components/puzzles/Level4ZeroTrust.vue'
import Level5Certifications from '@/components/puzzles/Level5Certifications.vue'
import Level6SecureRelease from '@/components/puzzles/Level6SecureRelease.vue'
import Level7GuestPrint from '@/components/puzzles/Level7GuestPrint.vue'
import Level8AIManagement from '@/components/puzzles/Level8AIManagement.vue'
import Level9LegacyAnalysis from '@/components/puzzles/Level9LegacyAnalysis.vue'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const gameStore = useGameStore()
const puzzleStore = usePuzzleStore()

const levelId = computed(() => parseInt(props.id) || 1)

const currentPuzzle = computed(() => {
  return puzzleStore.getPuzzleById(levelId.value)
})

// Live timer - tick every second to update display
const timerTick = ref(0)
let timerInterval: number | null = null

const elapsedTime = computed(() => {
  // Force recomputation on tick
  void timerTick.value

  if (!gameStore.startTime) return '00:00'

  const now = new Date()
  const elapsed = Math.floor((now.getTime() - gameStore.startTime.getTime()) / 1000)
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

onMounted(() => {
  puzzleStore.setPuzzle(levelId.value)

  // Start timer interval
  timerInterval = window.setInterval(() => {
    timerTick.value++
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

watch(
  () => props.id,
  (newId) => {
    puzzleStore.setPuzzle(parseInt(newId) || 1)
  },
)
</script>

<template>
  <div class="level-view">
    <div class="container">
      <!-- Progress header -->
      <header class="level-header">
        <div class="progress-info">
          <span class="level-indicator">OBJECTIVE {{ levelId }} OF 11</span>
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :style="{ width: `${(gameStore.levelsCompleted.length / 11) * 100}%` }"
            ></div>
          </div>
        </div>
        <div class="timer">
          <span class="timer-label">ELAPSED:</span>
          <span class="timer-value">{{ elapsedTime }}</span>
        </div>
      </header>

      <!-- Level 1: Document Sorting -->
      <div v-if="levelId === 1" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">INTELLIGENCE BRIEFING</h1>
          <p class="mission-brief">Understanding IPA Requirements</p>
        </div>
        <Level1DocumentSort />
      </div>

      <!-- Level 2: Architecture Building -->
      <div v-else-if="levelId === 2" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">ELIMINATE THE THREAT</h1>
          <p class="mission-brief">Removing Legacy Print Servers</p>
        </div>
        <Level2Architecture />
      </div>

      <!-- Level 3: Compatibility Verification -->
      <div v-else-if="levelId === 3" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">UNIVERSAL COMPATIBILITY PROTOCOL</h1>
          <p class="mission-brief">Technology-Agnostic Platform Verification</p>
        </div>
        <Level3Compatibility />
      </div>

      <!-- Level 4: Zero Trust Security -->
      <div v-else-if="levelId === 4" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">ZERO TRUST INITIALIZATION</h1>
          <p class="mission-brief">Activating Zero Trust Security</p>
        </div>
        <Level4ZeroTrust />
      </div>

      <!-- Level 5: Certification Vault -->
      <div v-else-if="levelId === 5" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">CERTIFICATION VAULT</h1>
          <p class="mission-brief">Security Compliance Verification</p>
        </div>
        <Level5Certifications />
      </div>

      <!-- Level 6: Secure Release Protocol -->
      <div v-else-if="levelId === 6" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">SECURE RELEASE PROTOCOL</h1>
          <p class="mission-brief">Preventing Document Theft</p>
        </div>
        <Level6SecureRelease />
      </div>

      <!-- Level 7: Guest Infiltration Prevention -->
      <div v-else-if="levelId === 7" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">GUEST INFILTRATION PREVENTION</h1>
          <p class="mission-brief">Secure Guest Printing</p>
        </div>
        <Level7GuestPrint />
      </div>

      <!-- Level 8: AI Management Deployment -->
      <div v-else-if="levelId === 8" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">AI MANAGEMENT DEPLOYMENT</h1>
          <p class="mission-brief">Intelligent Automation</p>
        </div>
        <Level8AIManagement />
      </div>

      <!-- Level 9: Legacy System Analysis -->
      <div v-else-if="levelId === 9" class="puzzle-container puzzle-container-wide">
        <div class="mission-header">
          <h1 class="mission-title">LEGACY SYSTEM ANALYSIS</h1>
          <p class="mission-brief">Understanding Output Management Complexity</p>
        </div>
        <Level9LegacyAnalysis />
      </div>

      <!-- Placeholder for other levels -->
      <div v-else class="puzzle-container">
        <div class="panel">
          <div class="mission-header">
            <h1 class="mission-title">{{ currentPuzzle?.title || 'LOADING...' }}</h1>
            <p class="mission-brief">{{ currentPuzzle?.missionBrief || '' }}</p>
          </div>

          <div class="puzzle-placeholder">
            <div class="placeholder-icon">🔒</div>
            <h2>PUZZLE LEVEL {{ levelId }}</h2>
            <p>Puzzle component coming soon...</p>
            <p class="puzzle-type" v-if="currentPuzzle">
              Type: {{ currentPuzzle.type.toUpperCase() }}
            </p>
          </div>

          <!-- Temporary navigation for testing -->
          <div class="temp-nav">
            <button class="btn btn-secondary" @click="router.push({ name: 'intro' })">
              ← BACK TO INTRO
            </button>
            <button
              class="btn btn-primary"
              @click="
                () => {
                  gameStore.completeLevel(levelId)
                  if (levelId < 11) {
                    router.push({ name: 'level', params: { id: String(levelId + 1) } })
                  } else {
                    router.push({ name: 'debrief' })
                  }
                }
              "
            >
              COMPLETE LEVEL →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-view {
  min-height: 100vh;
  padding: var(--space-lg) 0;
}

.level-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.progress-info {
  flex: 1;
  min-width: 200px;
}

.level-indicator {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
  display: block;
}

.progress-bar {
  height: 4px;
  background: var(--color-surface);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.5s ease;
}

.timer {
  font-family: var(--font-display);
  font-size: 0.875rem;
}

.timer-label {
  color: var(--color-text-dim);
  margin-right: var(--space-sm);
}

.timer-value {
  color: var(--color-secondary);
  letter-spacing: 0.1em;
}

.puzzle-container {
  max-width: 700px;
  margin: 0 auto;
}

.puzzle-container-wide {
  max-width: 1000px;
}

.mission-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.mission-title {
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  color: var(--color-primary);
  margin-bottom: var(--space-md);
}

.mission-brief {
  color: var(--color-text-dim);
  font-size: 0.875rem;
}

.puzzle-placeholder {
  text-align: center;
  padding: var(--space-2xl);
  background: var(--color-surface-elevated);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.puzzle-placeholder h2 {
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.puzzle-placeholder p {
  color: var(--color-text-dim);
  font-size: 0.875rem;
}

.puzzle-type {
  margin-top: var(--space-md);
  color: var(--color-secondary);
  font-family: var(--font-mono);
}

.temp-nav {
  display: flex;
  gap: var(--space-md);
  justify-content: space-between;
}

@media (max-width: 480px) {
  .temp-nav {
    flex-direction: column;
  }

  .temp-nav .btn {
    width: 100%;
  }
}
</style>
