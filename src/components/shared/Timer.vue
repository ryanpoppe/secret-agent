<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Use a reactive tick to update the display
const tick = ref(0)
let intervalId: number | null = null

const displayTime = computed(() => {
  // This forces recomputation on tick
  void tick.value
  return gameStore.formattedTime
})

onMounted(() => {
  // Update every second
  intervalId = window.setInterval(() => {
    tick.value++
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div class="timer">
    <span class="timer-label">ELAPSED</span>
    <span class="timer-value">{{ displayTime }}</span>
  </div>
</template>

<style scoped>
.timer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
}

.timer-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
}

.timer-value {
  font-size: 1rem;
  color: var(--color-secondary);
  letter-spacing: 0.1em;
  min-width: 60px;
}
</style>
