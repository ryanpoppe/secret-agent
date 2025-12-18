<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game'
import { submitLead } from '@/utils/api'
import type { LeadSubmission } from '@/types/player'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()

const completionTime = computed(() => {
  const seconds = gameStore.elapsedTime
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

const levelsCompleted = computed(() => gameStore.levelsCompleted.length)
const hintsUsed = computed(() => gameStore.hintsUsed.length)

async function submitLeadData() {
  const leadData: LeadSubmission = {
    name: playerStore.name,
    email: playerStore.email,
    company: playerStore.company,
    role: playerStore.role,
    phone: playerStore.phone || undefined,
    completedAt: gameStore.endTime?.toISOString() || new Date().toISOString(),
    completionTime: gameStore.elapsedTime,
    levelsCompleted: gameStore.levelsCompleted.length,
    hintsUsed: gameStore.hintsUsed.length,
    totalAttempts: gameStore.totalAttempts,
    source: 'tradeshow',
  }

  await submitLead(leadData)
}

function restartMission() {
  playerStore.clearPlayer()
  gameStore.resetGame()
  router.push({ name: 'intro' })
}

onMounted(() => {
  // Submit lead data when debrief loads
  submitLeadData()
})
</script>

<template>
  <div class="debrief-view">
    <div class="container">
      <!-- Success animation -->
      <div class="success-banner">
        <div class="success-icon">✓</div>
        <h1 class="success-title">MISSION ACCOMPLISHED</h1>
        <div class="success-subtitle">OPERATION: DIGITAL FORTRESS - COMPLETE</div>
      </div>

      <!-- Agent info -->
      <div class="panel agent-panel">
        <div class="panel-header">
          <h2>MISSION REPORT</h2>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">AGENT</span>
            <span class="stat-value agent-name">{{ playerStore.name.toUpperCase() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">COMPLETION TIME</span>
            <span class="stat-value time-value">{{ completionTime }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">OBJECTIVES COMPLETED</span>
            <span class="stat-value">{{ levelsCompleted }}/11</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">INTEL ASSISTS USED</span>
            <span class="stat-value">{{ hintsUsed }}</span>
          </div>
        </div>
      </div>

      <!-- Next steps -->
      <div class="panel next-steps-panel">
        <h2 class="panel-title">NEXT STEPS</h2>

        <p class="next-steps-text">
          Excellent work, Agent <strong>{{ playerStore.name }}</strong
          >!
        </p>

        <p class="next-steps-text">
          Your skills have been noted. A member of our team will contact you at
          <strong class="email-highlight">{{ playerStore.email }}</strong> to discuss your next
          assignment.
        </p>

        <div class="cta-section">
          <p class="cta-text">
            Visit the <strong>Vasion</strong> booth to learn more about Intelligent Print Automation
            and how we can help secure your organization's print infrastructure.
          </p>
        </div>
      </div>

      <!-- Quote -->
      <div class="quote-section">
        <blockquote class="quote">
          "In the world of IT security, trust is a vulnerability.<br />
          Zero trust is the only path to true protection."
        </blockquote>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <button class="btn btn-secondary" @click="restartMission">↺ NEW MISSION</button>
      </div>

      <!-- Footer -->
      <footer class="debrief-footer">
        <p class="footer-text">TRANSMISSION COMPLETE • VASION CYBER OPERATIONS</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.debrief-view {
  min-height: 100vh;
  padding: var(--space-xl) 0;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 600px;
}

/* Success banner */
.success-banner {
  text-align: center;
  margin-bottom: var(--space-2xl);
  animation: fadeIn 0.8s ease-out;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--color-primary);
  animation: glow 2s ease-in-out infinite;
}

.success-title {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  color: var(--color-primary);
  text-shadow: var(--text-shadow-glow);
  margin-bottom: var(--space-sm);
}

.success-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-dim);
  letter-spacing: 0.2em;
}

/* Agent panel */
.agent-panel {
  margin-bottom: var(--space-xl);
  animation: slideIn 0.5s ease-out 0.2s both;
}

.panel-header h2 {
  font-size: 0.875rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
  margin-top: var(--space-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.125rem;
  color: var(--color-text);
}

.agent-name {
  color: var(--color-primary);
}

.time-value {
  color: var(--color-secondary);
}

/* Next steps */
.next-steps-panel {
  margin-bottom: var(--space-xl);
  animation: slideIn 0.5s ease-out 0.4s both;
}

.panel-title {
  font-size: 0.875rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
}

.next-steps-text {
  color: var(--color-text);
  margin-bottom: var(--space-md);
  line-height: 1.8;
}

.email-highlight {
  color: var(--color-secondary);
}

.cta-section {
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.cta-text {
  color: var(--color-text-dim);
  font-size: 0.875rem;
  margin: 0;
}

/* Quote */
.quote-section {
  text-align: center;
  margin-bottom: var(--space-xl);
  animation: fadeIn 0.5s ease-out 0.6s both;
}

.quote {
  font-style: italic;
  color: var(--color-text-dim);
  line-height: 1.8;
  padding: var(--space-lg);
  border-left: 2px solid var(--color-primary);
  border-right: 2px solid var(--color-primary);
}

/* Actions */
.actions-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-2xl);
  animation: fadeIn 0.5s ease-out 0.8s both;
}

/* Footer */
.debrief-footer {
  text-align: center;
  margin-top: auto;
  padding-top: var(--space-xl);
}

.footer-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
