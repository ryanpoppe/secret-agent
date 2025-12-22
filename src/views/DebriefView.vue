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
const scoreBreakdown = computed(() => gameStore.scoreBreakdown)

// Calculate agent rank based on score
const agentRank = computed(() => {
  const score = gameStore.totalScore
  if (score >= 150) return { title: 'ELITE OPERATIVE', class: 'rank-elite' }
  if (score >= 120) return { title: 'SENIOR AGENT', class: 'rank-senior' }
  if (score >= 90) return { title: 'FIELD AGENT', class: 'rank-field' }
  if (score >= 60) return { title: 'JUNIOR AGENT', class: 'rank-junior' }
  return { title: 'RECRUIT', class: 'rank-recruit' }
})

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

        <div class="agent-rank" :class="agentRank.class">
          <span class="rank-label">AGENT RANK</span>
          <span class="rank-title">{{ agentRank.title }}</span>
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

      <!-- Score Breakdown -->
      <div class="panel score-panel">
        <div class="panel-header">
          <h2>SCORE BREAKDOWN</h2>
        </div>

        <div class="score-breakdown">
          <div class="score-row">
            <span class="score-item-label">Objectives Completed ({{ scoreBreakdown.levelsCompleted }} × 10 pts)</span>
            <span class="score-item-value positive">+{{ scoreBreakdown.levelPoints }}</span>
          </div>
          <div class="score-row">
            <span class="score-item-label">Correct Answers ({{ scoreBreakdown.correctAnswers }} × 1 pt)</span>
            <span class="score-item-value positive">+{{ scoreBreakdown.answerPoints }}</span>
          </div>
          <div class="score-row" v-if="scoreBreakdown.hintsUsed > 0">
            <span class="score-item-label">Intel Assists Used ({{ scoreBreakdown.hintsUsed }} × -5 pts)</span>
            <span class="score-item-value negative">{{ scoreBreakdown.hintPenalty }}</span>
          </div>
          <div class="score-row" v-if="scoreBreakdown.hiddenBonus">
            <span class="score-item-label">🎁 Hidden Bonus Found</span>
            <span class="score-item-value bonus">+{{ scoreBreakdown.bonusPoints }}</span>
          </div>
          <div class="score-divider"></div>
          <div class="score-row total">
            <span class="score-item-label">TOTAL SCORE</span>
            <span class="score-item-value total-value">{{ scoreBreakdown.total }}</span>
          </div>
        </div>

        <div class="score-rubric">
          <h4>SCORING RUBRIC</h4>
          <ul>
            <li><span class="rubric-points">+10</span> points per objective completed</li>
            <li><span class="rubric-points">+1</span> point per correct quiz answer</li>
            <li><span class="rubric-points negative">-5</span> points per intel assist used</li>
            <li><span class="rubric-points bonus">+10</span> points for hidden bonus</li>
          </ul>
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

/* Agent rank */
.agent-rank {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  border: 2px solid var(--color-border);
}

.rank-label {
  display: block;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-xs);
}

.rank-title {
  display: block;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.1em;
}

.rank-elite {
  border-color: #ffd700;
}
.rank-elite .rank-title {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.rank-senior {
  border-color: var(--color-primary);
}
.rank-senior .rank-title {
  color: var(--color-primary);
}

.rank-field {
  border-color: var(--color-secondary);
}
.rank-field .rank-title {
  color: var(--color-secondary);
}

.rank-junior {
  border-color: var(--color-warning);
}
.rank-junior .rank-title {
  color: var(--color-warning);
}

.rank-recruit {
  border-color: var(--color-text-dim);
}
.rank-recruit .rank-title {
  color: var(--color-text-dim);
}

/* Score panel */
.score-panel {
  margin-bottom: var(--space-xl);
  animation: slideIn 0.5s ease-out 0.3s both;
}

.score-breakdown {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
}

.score-item-label {
  font-size: 0.9rem;
  color: var(--color-text);
}

.score-item-value {
  font-family: var(--font-display);
  font-size: 1rem;
}

.score-item-value.positive {
  color: var(--color-primary);
}

.score-item-value.negative {
  color: var(--color-accent);
}

.score-item-value.bonus {
  color: #ffd700;
}

.score-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-md) 0;
}

.score-row.total {
  padding-top: var(--space-md);
}

.score-row.total .score-item-label {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
}

.score-row.total .total-value {
  font-size: 1.5rem;
  color: var(--color-primary);
  text-shadow: 0 0 10px var(--color-primary-glow);
}

.score-rubric {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.score-rubric h4 {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
}

.score-rubric ul {
  list-style: none;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.score-rubric li {
  margin-bottom: var(--space-xs);
}

.rubric-points {
  display: inline-block;
  min-width: 30px;
  font-family: var(--font-display);
  color: var(--color-primary);
}

.rubric-points.negative {
  color: var(--color-accent);
}

.rubric-points.bonus {
  color: #ffd700;
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
