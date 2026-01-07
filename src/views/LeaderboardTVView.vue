<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getLeaderboard } from '@/utils/api'

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
const countdown = ref(15)
const revealedRows = ref<number[]>([])

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
          }, i * 100)
        }
      } else {
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
    }, entries.value.length * 100 + 300)
  }
}

function startAutoRefresh() {
  countdown.value = 15
  
  countdownInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 15
      fetchLeaderboard(true)
    }
  }, 1000)
}

onMounted(() => {
  fetchLeaderboard(true)
  startAutoRefresh()
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <div class="tv-leaderboard">
    <!-- Scan lines overlay -->
    <div class="scan-lines"></div>
    
    <!-- Animated background grid -->
    <div class="grid-background"></div>
    
    <div class="tv-layout">
      <!-- Left side: Leaderboard -->
      <div class="leaderboard-side">
        <!-- Header -->
        <header class="tv-header">
          <div class="classified-stamp">
            <span class="stamp-text">CLASSIFIED</span>
          </div>
          
          <div class="title-section">
            <div class="title-badge">📡 LIVE SIGNAL INTERCEPT</div>
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
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="error-container">
          <div class="error-icon">⚠</div>
          <p class="error-text">{{ error }}</p>
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
              <span>RECRUIT</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: QR Code and Branding -->
      <div class="qr-side">
        <div class="qr-panel">
          <div class="qr-header">
            <div class="qr-badge">🎯 JOIN THE MISSION</div>
            <h2 class="qr-title">SCAN TO PLAY</h2>
          </div>

          <div class="qr-code-wrapper">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://vasion.org&color=00ff88&bgcolor=0a0e27" 
              alt="QR Code to vasion.org"
              class="qr-code"
            />
            <div class="qr-corners">
              <div class="corner tl"></div>
              <div class="corner tr"></div>
              <div class="corner bl"></div>
              <div class="corner br"></div>
            </div>
          </div>

          <!-- <div class="qr-url">vasion.org</div>

          <div class="qr-info">
            <div class="info-line">
              <span class="info-icon">🔐</span>
              <span>11 Spy Missions</span>
            </div>
            <div class="info-line">
              <span class="info-icon">⏱️</span>
              <span>~10 Minutes</span>
            </div>
            <div class="info-line">
              <span class="info-icon">🏆</span>
              <span>Win Prizes</span>
            </div>
          </div> -->

          <div class="brand-section">
            <div class="brand-logo">VASION</div>
            <div class="brand-tagline">SECURE PRINT SOLUTIONS</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom transmission line -->
    <footer class="tv-footer">
      <div class="transmission-line"></div>
      <p class="footer-text">SECURE TRANSMISSION • VASION CYBER OPS • CODE CAMP 2025</p>
    </footer>
  </div>
</template>

<style scoped>
.tv-leaderboard {
  width: 1920px;
  height: 1080px;
  background: var(--color-background);
  position: relative;
  overflow: hidden;
  font-size: 16px;
}

/* Scan lines overlay */
.scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 100;
  animation: scanMove 10s linear infinite;
}

@keyframes scanMove {
  0% { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

/* Animated grid background */
.grid-background {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridPulse 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Main layout */
.tv-layout {
  display: flex;
  height: calc(100% - 60px);
  padding: 40px;
  gap: 40px;
  position: relative;
  z-index: 1;
}

/* Left side - Leaderboard */
.leaderboard-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.tv-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.classified-stamp {
  position: absolute;
  top: 0;
  right: 0;
  transform: rotate(12deg);
}

.stamp-text {
  display: inline-block;
  padding: 8px 20px;
  border: 4px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.3em;
  opacity: 0.8;
  animation: stampPulse 2s ease-in-out infinite;
}

@keyframes stampPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

.title-section {
  margin-bottom: 20px;
}

.title-badge {
  display: inline-block;
  padding: 8px 24px;
  background: rgba(0, 255, 136, 0.1);
  border: 2px solid var(--color-primary);
  border-radius: 50px;
  font-size: 1rem;
  color: var(--color-primary);
  letter-spacing: 0.2em;
  margin-bottom: 12px;
  animation: badgeGlow 3s ease-in-out infinite;
}

@keyframes badgeGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 136, 0.6); }
}

.main-title {
  font-size: 4rem;
  color: var(--color-primary);
  text-shadow: 
    0 0 20px var(--color-primary-glow),
    0 0 60px var(--color-primary-glow);
  margin: 0 0 8px 0;
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { 
    text-shadow: 
      0 0 20px var(--color-primary-glow),
      0 0 60px var(--color-primary-glow);
  }
  50% { 
    text-shadow: 
      0 0 30px var(--color-primary-glow),
      0 0 80px var(--color-primary-glow),
      0 0 120px var(--color-primary-glow);
  }
}

.subtitle {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  letter-spacing: 0.4em;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 60px;
  padding: 16px 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: inline-flex;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

.status-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
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
  50% { transform: scale(1.2); }
}

.refreshing {
  color: var(--color-warning);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Loading */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 30px;
}

.loading-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ringRotate 1.5s linear infinite;
}

.loading-ring:nth-child(2) {
  inset: 15px;
  border-top-color: var(--color-secondary);
  animation-duration: 1s;
  animation-direction: reverse;
}

.loading-ring:nth-child(3) {
  inset: 30px;
  border-top-color: var(--color-accent);
  animation-duration: 0.75s;
}

@keyframes ringRotate {
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--color-text-dim);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

/* Error */
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  border-radius: 16px;
}

.error-icon {
  font-size: 5rem;
  color: var(--color-accent);
  animation: errorPulse 2s ease-in-out infinite;
}

@keyframes errorPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.error-text {
  font-size: 1.5rem;
  color: var(--color-accent);
  margin-top: 20px;
}

/* Leaderboard table */
.leaderboard-container {
  flex: 1;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 160px 140px 100px;
  gap: 20px;
  padding: 20px 30px;
  background: var(--color-surface-elevated);
  border-bottom: 3px solid var(--color-primary);
  font-size: 0.9rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

.table-body {
  flex: 1;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 160px 140px 100px;
  gap: 20px;
  padding: 16px 30px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  opacity: 0;
  transform: translateX(-30px);
  transition: all 0.4s ease-out;
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
  border-left: 4px solid #ffd700;
}

.table-row.rank-2 {
  border-left: 4px solid #c0c0c0;
}

.table-row.rank-3 {
  border-left: 4px solid #cd7f32;
}

/* Data stream effect */
.data-stream {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 150px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.1));
  pointer-events: none;
  overflow: hidden;
}

.data-stream::before {
  content: '01011010010110100101';
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-primary);
  opacity: 0.3;
  animation: dataScroll 3s linear infinite;
  white-space: nowrap;
}

@keyframes dataScroll {
  0% { opacity: 0.1; }
  50% { opacity: 0.5; }
  100% { opacity: 0.1; }
}

/* Table cells */
.td-rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge {
  font-size: 2.5rem;
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
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
  50% { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)); }
}

@keyframes silverGlow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(192, 192, 192, 0.5)); }
  50% { filter: drop-shadow(0 0 25px rgba(192, 192, 192, 1)); }
}

@keyframes bronzeGlow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(205, 127, 50, 0.5)); }
  50% { filter: drop-shadow(0 0 25px rgba(205, 127, 50, 1)); }
}

.td-agent {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.agent-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-text);
  letter-spacing: 0.1em;
}

.agent-title {
  font-size: 0.85rem;
  letter-spacing: 0.15em;
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
  gap: 6px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.score-value {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-primary);
}

.score-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.score-bar {
  height: 4px;
  background: var(--color-surface-elevated);
  border-radius: 2px;
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
  font-size: 1rem;
  font-weight: 600;
}

.status-progress {
  color: var(--color-warning);
  font-size: 1rem;
}

.td-time {
  display: flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--color-secondary);
}

/* No data */
.no-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
}

.no-data-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: lockPulse 2s ease-in-out infinite;
}

@keyframes lockPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.no-data p {
  font-size: 1.5rem;
  margin: 0;
}

.no-data-sub {
  font-size: 1rem !important;
  color: var(--color-text-muted);
  margin-top: 10px !important;
}

/* Legend */
.legend-section {
  margin-top: 20px;
  padding: 16px 30px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.legend-items {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.legend-badge {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-badge.rank-elite { background: #ffd700; }
.legend-badge.rank-senior { background: var(--color-primary); }
.legend-badge.rank-field { background: var(--color-secondary); }
.legend-badge.rank-junior { background: var(--color-warning); }
.legend-badge.rank-recruit { background: var(--color-text-dim); }

/* Right side - QR Code */
.qr-side {
  width: 450px;
  flex-shrink: 0;
}

.qr-panel {
  height: 100%;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.qr-header {
  margin-bottom: 30px;
}

.qr-badge {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(0, 255, 136, 0.1);
  border: 2px solid var(--color-primary);
  border-radius: 50px;
  font-size: 1rem;
  color: var(--color-primary);
  letter-spacing: 0.15em;
  margin-bottom: 12px;
}

.qr-title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin: 0;
  text-shadow: 0 0 20px var(--color-primary-glow);
}

.qr-code-wrapper {
  position: relative;
  padding: 20px;
  background: var(--color-background);
  border: 3px solid var(--color-primary);
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 
    0 0 40px var(--color-primary-glow),
    inset 0 0 30px rgba(0, 255, 136, 0.1);
}

.qr-code {
  display: block;
  width: 280px;
  height: 280px;
  border-radius: 8px;
}

.qr-corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: var(--color-primary);
  border-style: solid;
}

.corner.tl {
  top: -3px;
  left: -3px;
  border-width: 4px 0 0 4px;
  border-radius: 12px 0 0 0;
}

.corner.tr {
  top: -3px;
  right: -3px;
  border-width: 4px 4px 0 0;
  border-radius: 0 12px 0 0;
}

.corner.bl {
  bottom: -3px;
  left: -3px;
  border-width: 0 0 4px 4px;
  border-radius: 0 0 0 12px;
}

.corner.br {
  bottom: -3px;
  right: -3px;
  border-width: 0 4px 4px 0;
  border-radius: 0 0 12px 0;
}

.qr-url {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--color-primary);
  text-shadow: 0 0 20px var(--color-primary-glow);
  margin-bottom: 30px;
}

.qr-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.info-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.25rem;
  color: var(--color-text);
}

.info-icon {
  font-size: 1.5rem;
}

.brand-section {
  padding-top: 30px;
  border-top: 1px solid var(--color-border);
}

.brand-logo {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--color-text);
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.brand-tagline {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

/* Footer */
.tv-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 40px 20px;
  z-index: 1;
}

.transmission-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  margin-bottom: 12px;
  animation: linePulse 2s ease-in-out infinite;
}

@keyframes linePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.footer-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  letter-spacing: 0.3em;
  margin: 0;
}

/* Row transitions */
.row-enter-active,
.row-leave-active {
  transition: all 0.4s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateX(-50px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>

