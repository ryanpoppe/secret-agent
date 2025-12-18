<script setup lang="ts">
defineProps<{
  levelNumber: number
  title: string
  description: string
}>()
</script>

<template>
  <div class="mission-brief">
    <div class="brief-header">
      <span class="brief-label">OBJECTIVE {{ levelNumber }}</span>
      <div class="brief-stamp">CLASSIFIED</div>
    </div>

    <h2 class="brief-title">{{ title }}</h2>

    <p class="brief-description">{{ description }}</p>

    <div class="brief-divider">
      <span class="divider-text">MISSION PARAMETERS</span>
    </div>
  </div>
</template>

<style scoped>
.mission-brief {
  margin-bottom: var(--space-xl);
  text-align: center;
}

.brief-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.brief-label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-text-dim);
  letter-spacing: 0.2em;
}

.brief-stamp {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--color-accent);
  letter-spacing: 0.15em;
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-accent);
  transform: rotate(3deg);
}

.brief-title {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  color: var(--color-primary);
  text-shadow: var(--text-shadow-glow);
  margin-bottom: var(--space-md);
  letter-spacing: 0.05em;
}

.brief-description {
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto;
}

.brief-divider {
  margin-top: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.brief-divider::before,
.brief-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border-bright), transparent);
}

.divider-text {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
  white-space: nowrap;
}
</style>
