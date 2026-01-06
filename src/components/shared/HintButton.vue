<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  hint: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'hintUsed'): void
}>()

const isRevealed = ref(false)

const buttonText = computed(() => {
  return isRevealed.value ? 'INTEL REVEALED' : 'REQUEST INTEL (-5 points)'
})

function revealHint() {
  if (!isRevealed.value && !props.disabled) {
    isRevealed.value = true
    emit('hintUsed')
  }
}
</script>

<template>
  <div class="hint-container">
    <button
      class="hint-button"
      :class="{ revealed: isRevealed }"
      :disabled="disabled || isRevealed"
      @click="revealHint"
    >
      <span class="hint-icon">{{ isRevealed ? '✓' : '?' }}</span>
      <span class="hint-text">{{ buttonText }}</span>
    </button>

    <Transition name="hint-reveal">
      <div v-if="isRevealed" class="hint-content">
        <div class="hint-label">INTEL:</div>
        <p class="hint-message">{{ hint }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hint-container {
  width: 100%;
}

.hint-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid var(--color-secondary);
  border-radius: var(--radius-sm);
  color: var(--color-secondary);
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hint-button:hover:not(:disabled) {
  background: var(--color-secondary-dim);
  box-shadow: 0 0 10px var(--color-secondary-dim);
}

.hint-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-button.revealed {
  border-color: var(--color-primary);
  color: var(--color-primary);
  opacity: 1;
}

.hint-icon {
  font-size: 1rem;
  font-weight: bold;
}

.hint-content {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-secondary);
  border-left: 3px solid var(--color-secondary);
  border-radius: var(--radius-sm);
}

.hint-label {
  font-size: 0.65rem;
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-sm);
}

.hint-message {
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

/* Transition */
.hint-reveal-enter-active {
  transition: all 0.3s ease-out;
}

.hint-reveal-leave-active {
  transition: all 0.2s ease-in;
}

.hint-reveal-enter-from,
.hint-reveal-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
