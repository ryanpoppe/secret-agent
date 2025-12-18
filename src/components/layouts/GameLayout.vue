<script setup lang="ts">
import ProgressBar from '@/components/shared/ProgressBar.vue'
import Timer from '@/components/shared/Timer.vue'
</script>

<template>
  <div class="game-layout">
    <header class="game-header">
      <div class="header-left">
        <ProgressBar />
      </div>
      <div class="header-right">
        <Timer />
      </div>
    </header>
    
    <main class="game-main">
      <slot />
    </main>
    
    <footer class="game-footer">
      <span class="footer-text">VASION • OPERATION: DIGITAL FORTRESS</span>
    </footer>
  </div>
</template>

<style scoped>
.game-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
}

.game-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-lg);
}

.header-left {
  flex: 1;
  min-width: 200px;
}

.header-right {
  flex-shrink: 0;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.game-footer {
  text-align: center;
  padding-top: var(--space-lg);
  margin-top: auto;
}

.footer-text {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.2em;
}

@media (max-width: 480px) {
  .game-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-right {
    align-self: flex-end;
  }
}
</style>

