<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const progressPercent = computed(() => {
  return (gameStore.levelsCompleted.length / 11) * 100
})
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-info">
      <span class="progress-label">MISSION PROGRESS</span>
      <span class="progress-text">{{ gameStore.levelsCompleted.length }}/11 OBJECTIVES</span>
    </div>
    <div class="progress-track">
      <div 
        class="progress-fill" 
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-wrapper {
  width: 100%;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.progress-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
}

.progress-text {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}

.progress-track {
  height: 4px;
  background: var(--color-surface);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 2px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
}
</style>

