<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getLeaderboard } from '@/utils/api'

const router = useRouter()

interface LeaderboardEntry {
  rank: number
  playerName: string
  score: number
  levelsCompleted: number
  currentLevel: number
  hintsUsed: number
  completionTime: number
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

const entries = ref<LeaderboardEntry[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)
const isRefreshing = ref(false)
const countdown = ref(30)
const revealedRows = ref<number[]>([])

const refreshInterval: number | null = null
let countdownInterval: number | null = null

const formattedLastUpdated = computed(() => {
  if (!lastUpdated.value) return '--:--:--'
  return lastUpdated.value.toLocaleTimeString()
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getRankBadge(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return `#${rank}`
  }
}

function getRankTitle(score: number): string {
  if (score >= 150) return 'ELITE OPERATIVE'
  if (score >= 120) return 'SENIOR AGENT'
  if (score >= 90) return 'FIELD AGENT'
  if (score >= 60) return 'JUNIOR AGENT'
  return 'RECRUIT'
}

function getRankClass(score: number): string {
  if (score >= 150) return 'rank-elite'
  if (score >= 120) return 'rank-senior'
  if (score >= 90) return 'rank-field'
  if (score >= 60) return 'rank-junior'
  return 'rank-recruit'
}

async function fetchLeaderboard(animate: boolean = true) {
  if (animate) {
    isRefreshing.value = true
    revealedRows.value = []
  }
  
  try {
    const result = await getLeaderboard(10)
    
    if (result.success && result.data) {
      entries.value = result.data
      lastUpdated.value = new Date()
      error.value = null
      
      // Animate rows appearing one by one
      if (animate && entries.value.length > 0) {
        for (let i = 0; i < entries.value.length; i++) {
          setTimeout(() => {
            revealedRows.value.push(i)
          }, i * 150)
        }
      } else {
        // Show all rows immediately
        revealedRows.value = entries.value.map((_, i) => i)
      }
    } else {
      error.value = result.error || 'Failed to load leaderboard'
    }
  } catch (e) {
    error.value = 'Connection lost. Retrying...'
    console.error('Leaderboard error:', e)
  } finally {
    isLoading.value = false
    setTimeout(() => {
      isRefreshing.value = false
    }, entries.value.length * 150 + 500)
  }
}

function startAutoRefresh() {
  countdown.value = 30
  
  countdownInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 30
      fetchLeaderboard(true)
    }
  }, 1000)
}

function goToIntro() {
  router.push({ name: 'intro' })
}

onMounted(() => {
  fetchLeaderboard(true)
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <div class="leaderboard-view">
    <!-- Scan lines overlay -->
    <div class="scan-lines"></div>
    
    <!-- Animated background grid -->
    <div class="grid-background"></div>
    
    <div class="container">
      <!-- Header -->
      <header class="leaderboard-header">
        <div class="classified-stamp">
          <span class="stamp-text">CLASSIFIED</span>
        </div>
        
        <div class="title-section">
          <div class="title-badge">📡 SIGNAL INTERCEPT</div>
          <h1 class="main-title">AGENT RANKINGS</h1>
          <div class="subtitle">OPERATION: DIGITAL FORTRESS</div>
        </div>
        
        <div class="status-bar">
          <div class="status-item">
            <span class="status-label">LAST SYNC</span>
            <span class="status-value">{{ formattedLastUpdated }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">NEXT UPDATE</span>
            <span class="status-value countdown" :class="{ 'countdown-low': countdown <= 5 }">
              {{ countdown }}s
            </span>
          </div>
          <div class="status-item" v-if="isRefreshing">
            <span class="status-value refreshing">⟳ SYNCING...</span>
          </div>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-ring"></div>
          <div class="loading-ring"></div>
          <div class="loading-ring"></div>
        </div>
        <p class="loading-text">ESTABLISHING SECURE CONNECTION...</p>
        <div class="loading-bar">
          <div class="loading-bar-fill"></div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠</div>
        <p class="error-text">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchLeaderboard(true)">
          ↻ RETRY CONNECTION
        </button>
      </div>

      <!-- Leaderboard table -->
      <div v-else class="leaderboard-container">
        <div class="table-header">
          <div class="th-rank">RANK</div>
          <div class="th-agent">AGENT</div>
          <div class="th-score">SCORE</div>
          <div class="th-status">STATUS</div>
          <div class="th-time">TIME</div>
        </div>

        <div v-if="entries.length === 0" class="no-data">
          <div class="no-data-icon">🔒</div>
          <p>NO AGENTS REGISTERED</p>
          <p class="no-data-sub">Be the first to complete the mission!</p>
        </div>

        <TransitionGroup name="row" tag="div" class="table-body">
          <div
            v-for="(entry, index) in entries"
            :key="entry.playerName + entry.score"
            class="table-row"
            :class="{ 
              'revealed': revealedRows.includes(index),
              'top-three': entry.rank <= 3,
              [`rank-${entry.rank}`]: entry.rank <= 3
            }"
            :style="{ '--row-index': index }"
          >
            <!-- Rank -->
            <div class="td-rank">
              <span class="rank-badge" :class="{ 'gold': entry.rank === 1, 'silver': entry.rank === 2, 'bronze': entry.rank === 3 }">
                {{ getRankBadge(entry.rank) }}
              </span>
            </div>

            <!-- Agent info -->
            <div class="td-agent">
              <div class="agent-name">{{ entry.playerName.toUpperCase() }}</div>
              <div class="agent-title" :class="getRankClass(entry.score)">
                {{ getRankTitle(entry.score) }}
              </div>
            </div>

            <!-- Score -->
            <div class="td-score">
              <div class="score-display">
                <span class="score-value">{{ entry.score }}</span>
                <span class="score-label">PTS</span>
              </div>
              <div class="score-bar">
                <div 
                  class="score-bar-fill" 
                  :style="{ width: `${Math.min(100, (entry.score / 180) * 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Status -->
            <div class="td-status">
              <span v-if="entry.isComplete" class="status-complete">
                ✓ COMPLETE
              </span>
              <span v-else class="status-progress">
                LVL {{ entry.currentLevel }}/11
              </span>
            </div>

            <!-- Time -->
            <div class="td-time">
              {{ formatTime(entry.completionTime) }}
            </div>

            <!-- Animated data stream effect for top 3 -->
            <div v-if="entry.rank <= 3" class="data-stream"></div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Legend -->
      <div class="legend-section">
        <h3 class="legend-title">AGENT CLASSIFICATION</h3>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-badge rank-elite"></span>
            <span>ELITE (150+)</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge rank-senior"></span>
            <span>SENIOR (120+)</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge rank-field"></span>
            <span>FIELD (90+)</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge rank-junior"></span>
            <span>JUNIOR (60+)</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge rank-recruit"></span>
            <span>RECRUIT (&lt;60)</span>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="footer-actions">
        <button class="btn btn-secondary" @click="goToIntro">
          ← PLAY NOW
        </button>
        <button class="btn btn-primary" @click="fetchLeaderboard(true)">
          ↻ REFRESH DATA
        </button>
      </div>

      <!-- Transmission footer -->
      <footer class="leaderboard-footer">
        <div class="transmission-line"></div>
        <p class="footer-text">SECURE TRANSMISSION • VASION CYBER OPS</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-view {
  min-height: 100vh;
  padding: var(--space-xl) var(--space-md);
  position: relative;
  overflow: hidden;
}

/* Scan lines overlay */
.scan-lines {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 100;
  animation: scanMove 8s linear infinite;
}

@keyframes scanMove {
  0% { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

/* Animated grid background */
.grid-background {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridPulse 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.container {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Header */
.leaderboard-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
  position: relative;
}

.classified-stamp {
  position: absolute;
  top: -10px;
  right: 0;
  transform: rotate(12deg);
}

.stamp-text {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border: 3px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  opacity: 0.7;
  animation: stampPulse 2s ease-in-out infinite;
}

@keyframes stampPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

.title-section {
  margin-bottom: var(--space-xl);
}

.title-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
  animation: badgeGlow 3s ease-in-out infinite;
}

@keyframes badgeGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 136, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.4); }
}

.main-title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  color: var(--color-primary);
  text-shadow: 
    0 0 10px var(--color-primary-glow),
    0 0 30px var(--color-primary-glow);
  margin-bottom: var(--space-xs);
  animation: titleFlicker 0.1s ease-in-out 3s 3;
}

@keyframes titleFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.subtitle {
  font-size: 0.875rem;
  color: var(--color-text-dim);
  letter-spacing: 0.3em;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  flex-wrap: wrap;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.status-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
}

.status-value {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--color-secondary);
}

.countdown {
  color: var(--color-primary);
}

.countdown-low {
  color: var(--color-accent);
  animation: countdownPulse 0.5s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.refreshing {
  color: var(--color-warning);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Loading state */
.loading-container {
  text-align: center;
  padding: var(--space-3xl);
}

.loading-animation {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto var(--space-xl);
}

.loading-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ringRotate 1.5s linear infinite;
}

.loading-ring:nth-child(2) {
  inset: 10px;
  border-top-color: var(--color-secondary);
  animation-duration: 1s;
  animation-direction: reverse;
}

.loading-ring:nth-child(3) {
  inset: 20px;
  border-top-color: var(--color-accent);
  animation-duration: 0.75s;
}

@keyframes ringRotate {
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: var(--font-mono);
  color: var(--color-text-dim);
  margin-bottom: var(--space-md);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-full);
  margin: 0 auto;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  animation: loadingSlide 1.5s ease-in-out infinite;
}

@keyframes loadingSlide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Error state */
.error-container {
  text-align: center;
  padding: var(--space-3xl);
  background: var(--color-surface);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-lg);
}

.error-icon {
  font-size: 3rem;
  color: var(--color-accent);
  animation: errorPulse 2s ease-in-out infinite;
}

@keyframes errorPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.error-text {
  color: var(--color-accent);
  margin: var(--space-md) 0 var(--space-lg);
}

/* Leaderboard table */
.leaderboard-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px 80px;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-surface-elevated);
  border-bottom: 2px solid var(--color-primary);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
}

.table-body {
  position: relative;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px 80px;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  position: relative;
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.3s ease-out;
}

.table-row.revealed {
  opacity: 1;
  transform: translateX(0);
}

.table-row:hover {
  background: rgba(0, 255, 136, 0.05);
}

.table-row.top-three {
  background: rgba(0, 255, 136, 0.03);
}

.table-row.rank-1 {
  border-left: 3px solid #ffd700;
}

.table-row.rank-2 {
  border-left: 3px solid #c0c0c0;
}

.table-row.rank-3 {
  border-left: 3px solid #cd7f32;
}

/* Data stream effect for top 3 */
.data-stream {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.1));
  pointer-events: none;
  overflow: hidden;
}

.data-stream::before {
  content: '010110100101';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-primary);
  opacity: 0.3;
  animation: dataScroll 3s linear infinite;
  white-space: nowrap;
}

@keyframes dataScroll {
  0% { opacity: 0.1; }
  50% { opacity: 0.4; }
  100% { opacity: 0.1; }
}

/* Table cells */
.td-rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge {
  font-size: 1.5rem;
  font-family: var(--font-display);
}

.rank-badge.gold {
  animation: goldGlow 2s ease-in-out infinite;
}

.rank-badge.silver {
  animation: silverGlow 2s ease-in-out infinite;
}

.rank-badge.bronze {
  animation: bronzeGlow 2s ease-in-out infinite;
}

@keyframes goldGlow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
  50% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)); }
}

@keyframes silverGlow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(192, 192, 192, 0.5)); }
  50% { filter: drop-shadow(0 0 15px rgba(192, 192, 192, 0.8)); }
}

@keyframes bronzeGlow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(205, 127, 50, 0.5)); }
  50% { filter: drop-shadow(0 0 15px rgba(205, 127, 50, 0.8)); }
}

.td-agent {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.agent-name {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.agent-title {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
}

.agent-title.rank-elite { color: #ffd700; }
.agent-title.rank-senior { color: var(--color-primary); }
.agent-title.rank-field { color: var(--color-secondary); }
.agent-title.rank-junior { color: var(--color-warning); }
.agent-title.rank-recruit { color: var(--color-text-dim); }

.td-score {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.score-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-primary);
}

.score-label {
  font-size: 0.6rem;
  color: var(--color-text-muted);
}

.score-bar {
  height: 3px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 1s ease-out;
}

.td-status {
  display: flex;
  align-items: center;
}

.status-complete {
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-progress {
  color: var(--color-warning);
  font-size: 0.75rem;
}

.td-time {
  display: flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-secondary);
}

/* No data state */
.no-data {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-dim);
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
  animation: lockPulse 2s ease-in-out infinite;
}

@keyframes lockPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.no-data-sub {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: var(--space-sm);
}

/* Legend section */
.legend-section {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.legend-title {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-md);
  text-align: center;
}

.legend-items {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.legend-badge {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-badge.rank-elite { background: #ffd700; }
.legend-badge.rank-senior { background: var(--color-primary); }
.legend-badge.rank-field { background: var(--color-secondary); }
.legend-badge.rank-junior { background: var(--color-warning); }
.legend-badge.rank-recruit { background: var(--color-text-dim); }

/* Footer actions */
.footer-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
}

/* Footer */
.leaderboard-footer {
  text-align: center;
  margin-top: var(--space-2xl);
}

.transmission-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  margin-bottom: var(--space-md);
  animation: linePulse 2s ease-in-out infinite;
}

@keyframes linePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.footer-text {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

/* Row transitions */
.row-enter-active,
.row-leave-active {
  transition: all 0.3s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Responsive */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 80px 70px;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
  }
  
  .th-time,
  .td-time {
    display: none;
  }
  
  .agent-name {
    font-size: 0.875rem;
  }
  
  .score-value {
    font-size: 1rem;
  }
  
  .status-bar {
    gap: var(--space-md);
  }
  
  .legend-items {
    gap: var(--space-sm);
  }
  
  .legend-item {
    font-size: 0.65rem;
  }
}

@media (max-width: 480px) {
  .table-header,
  .table-row {
    grid-template-columns: 40px 1fr 60px;
  }
  
  .th-status,
  .td-status {
    display: none;
  }
  
  .classified-stamp {
    display: none;
  }
  
  .footer-actions {
    flex-direction: column;
  }
}
</style>

