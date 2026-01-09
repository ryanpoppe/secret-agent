<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  verifyAdminSession,
  adminLogin,
  adminLogout,
  getAdminStats,
  getAdminScores,
  getAdminLeads,
  deleteScore,
  deleteLead,
  clearLeaderboard,
  clearAllLeads,
  type AdminScore,
  type AdminLead,
  type AdminStats,
} from '@/utils/api'

// Auth state
const isAuthenticated = ref(false)
const isLoading = ref(true)
const loginError = ref<string | null>(null)

// Form state
const username = ref('')
const password = ref('')
const isLoggingIn = ref(false)

// Data state
const activeTab = ref<'leaderboard' | 'leads'>('leaderboard')
const stats = ref<AdminStats | null>(null)
const scores = ref<AdminScore[]>([])
const leads = ref<AdminLead[]>([])
const scorePagination = ref({ total: 0, limit: 100, offset: 0 })
const leadPagination = ref({ total: 0, limit: 100, offset: 0 })

// Action state
const isLoadingData = ref(false)
const actionMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const confirmDialog = ref<{
  show: boolean
  title: string
  message: string
  action: () => Promise<void>
} | null>(null)

// Computed
const formattedTime = computed(() => (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

// Check session on mount
onMounted(async () => {
  isLoading.value = true
  isAuthenticated.value = await verifyAdminSession()
  if (isAuthenticated.value) {
    await loadData()
  }
  isLoading.value = false
})

// Login
async function handleLogin() {
  if (!username.value || !password.value) {
    loginError.value = 'Please enter username and password'
    return
  }

  isLoggingIn.value = true
  loginError.value = null

  const result = await adminLogin(username.value, password.value)

  if (result.success) {
    isAuthenticated.value = true
    username.value = ''
    password.value = ''
    await loadData()
  } else {
    loginError.value = result.error || 'Login failed'
  }

  isLoggingIn.value = false
}

// Logout
async function handleLogout() {
  await adminLogout()
  isAuthenticated.value = false
  stats.value = null
  scores.value = []
  leads.value = []
}

// Load all data
async function loadData() {
  isLoadingData.value = true
  
  const [statsResult, scoresResult, leadsResult] = await Promise.all([
    getAdminStats(),
    getAdminScores(),
    getAdminLeads(),
  ])

  if (statsResult.success && statsResult.data) {
    stats.value = statsResult.data
  }

  if (scoresResult.success && scoresResult.data) {
    scores.value = scoresResult.data
    if (scoresResult.pagination) {
      scorePagination.value = scoresResult.pagination
    }
  }

  if (leadsResult.success && leadsResult.data) {
    leads.value = leadsResult.data
    if (leadsResult.pagination) {
      leadPagination.value = leadsResult.pagination
    }
  }

  isLoadingData.value = false
}

// Show action message
function showMessage(type: 'success' | 'error', text: string) {
  actionMessage.value = { type, text }
  setTimeout(() => {
    actionMessage.value = null
  }, 3000)
}

// Delete single score
async function handleDeleteScore(id: number, playerName: string) {
  confirmDialog.value = {
    show: true,
    title: 'Delete Score',
    message: `Are you sure you want to delete the score for "${playerName}"?`,
    action: async () => {
      const result = await deleteScore(id)
      if (result.success) {
        showMessage('success', 'Score deleted successfully')
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to delete score')
      }
    },
  }
}

// Delete single lead
async function handleDeleteLead(id: number, name: string) {
  confirmDialog.value = {
    show: true,
    title: 'Delete Lead',
    message: `Are you sure you want to delete the lead for "${name}"?`,
    action: async () => {
      const result = await deleteLead(id)
      if (result.success) {
        showMessage('success', 'Lead deleted successfully')
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to delete lead')
      }
    },
  }
}

// Clear leaderboard
function handleClearLeaderboard() {
  confirmDialog.value = {
    show: true,
    title: 'Clear Leaderboard',
    message: `Are you sure you want to delete ALL ${scorePagination.value.total} scores? This cannot be undone!`,
    action: async () => {
      const result = await clearLeaderboard()
      if (result.success) {
        showMessage('success', `Leaderboard cleared. ${result.deletedCount} entries deleted.`)
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to clear leaderboard')
      }
    },
  }
}

// Clear leads
function handleClearLeads() {
  confirmDialog.value = {
    show: true,
    title: 'Clear All Leads',
    message: `Are you sure you want to delete ALL ${leadPagination.value.total} leads? This cannot be undone!`,
    action: async () => {
      const result = await clearAllLeads()
      if (result.success) {
        showMessage('success', `All leads cleared. ${result.deletedCount} entries deleted.`)
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to clear leads')
      }
    },
  }
}

// Confirm dialog action
async function confirmAction() {
  if (confirmDialog.value?.action) {
    await confirmDialog.value.action()
  }
  confirmDialog.value = null
}

function cancelConfirm() {
  confirmDialog.value = null
}
</script>

<template>
  <div class="admin-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Verifying session...</p>
    </div>

    <!-- Login form -->
    <div v-else-if="!isAuthenticated" class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="classified-badge">CLASSIFIED ACCESS</div>
          <h1>Admin Portal</h1>
          <p>Enter your credentials to continue</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Enter username"
              autocomplete="username"
              :disabled="isLoggingIn"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter password"
              autocomplete="current-password"
              :disabled="isLoggingIn"
            />
          </div>

          <div v-if="loginError" class="error-message">
            {{ loginError }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isLoggingIn">
            {{ isLoggingIn ? 'Authenticating...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="admin-dashboard">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <h1>Admin Dashboard</h1>
          <span class="status-badge">Authenticated</span>
        </div>
        <div class="header-right">
          <button class="btn btn-secondary" @click="loadData" :disabled="isLoadingData">
            {{ isLoadingData ? 'Refreshing...' : 'Refresh Data' }}
          </button>
          <button class="btn btn-outline" @click="handleLogout">
            Logout
          </button>
        </div>
      </header>

      <!-- Action Message -->
      <div v-if="actionMessage" class="action-message" :class="actionMessage.type">
        {{ actionMessage.text }}
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats?.totalLeads ?? '-' }}</div>
          <div class="stat-label">Total Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats?.totalScores ?? '-' }}</div>
          <div class="stat-label">Total Scores</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats?.completedGames ?? '-' }}</div>
          <div class="stat-label">Completed Games</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'leaderboard' }"
          @click="activeTab = 'leaderboard'"
        >
          Leaderboard ({{ scorePagination.total }})
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'leads' }"
          @click="activeTab = 'leads'"
        >
          Leads ({{ leadPagination.total }})
        </button>
      </div>

      <!-- Leaderboard Tab -->
      <div v-if="activeTab === 'leaderboard'" class="tab-content">
        <div class="tab-header">
          <h2>Leaderboard Management</h2>
          <button
            class="btn btn-danger"
            @click="handleClearLeaderboard"
            :disabled="scores.length === 0"
          >
            Clear All Scores
          </button>
        </div>

        <div v-if="scores.length === 0" class="empty-state">
          <p>No scores recorded yet</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Player</th>
                <th>Email</th>
                <th>Score</th>
                <th>Level</th>
                <th>Time</th>
                <th>Hints</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="score in scores" :key="score.id">
                <td>{{ score.id }}</td>
                <td class="player-name">{{ score.playerName }}</td>
                <td class="email">{{ score.email }}</td>
                <td class="score">{{ score.score }}</td>
                <td>{{ score.currentLevel }}/11</td>
                <td>{{ formattedTime(score.completionTime) }}</td>
                <td>{{ score.hintsUsed }}</td>
                <td>
                  <span
                    class="status-pill"
                    :class="score.isComplete ? 'complete' : 'in-progress'"
                  >
                    {{ score.isComplete ? 'Complete' : 'In Progress' }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="handleDeleteScore(score.id, score.playerName)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Leads Tab -->
      <div v-if="activeTab === 'leads'" class="tab-content">
        <div class="tab-header">
          <h2>Leads Management</h2>
          <button
            class="btn btn-danger"
            @click="handleClearLeads"
            :disabled="leads.length === 0"
          >
            Clear All Leads
          </button>
        </div>

        <div v-if="leads.length === 0" class="empty-state">
          <p>No leads recorded yet</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Levels</th>
                <th>Time</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lead in leads" :key="lead.id">
                <td>{{ lead.id }}</td>
                <td class="player-name">{{ lead.name }}</td>
                <td class="email">{{ lead.email }}</td>
                <td>{{ lead.company }}</td>
                <td>{{ lead.role || '-' }}</td>
                <td>{{ lead.phone || '-' }}</td>
                <td>{{ lead.levelsCompleted }}/11</td>
                <td>{{ formattedTime(lead.completionTime) }}</td>
                <td>
                  <span class="source-badge" :class="lead.source">
                    {{ lead.source }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="handleDeleteLead(lead.id, lead.name)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <Teleport to="body">
      <div v-if="confirmDialog?.show" class="modal-overlay" @click.self="cancelConfirm">
        <div class="modal-dialog">
          <h3>{{ confirmDialog.title }}</h3>
          <p>{{ confirmDialog.message }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelConfirm">Cancel</button>
            <button class="btn btn-danger" @click="confirmAction">Confirm</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-text);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Login */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.classified-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.login-header h1 {
  font-size: 1.75rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
}

.form-group input {
  padding: 0.875rem 1rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error-message {
  padding: 0.75rem;
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: var(--color-accent);
  font-size: 0.9rem;
  text-align: center;
}

/* Dashboard */
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.75rem;
  color: var(--color-primary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  font-size: 0.75rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

/* Action Message */
.action-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 500;
}

.action-message.success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.action-message.error {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-family: var(--font-display);
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 1rem;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.tab.active {
  color: var(--color-primary);
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-primary);
}

/* Tab Content */
.tab-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tab-header h2 {
  font-size: 1.25rem;
  color: var(--color-text);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-dim);
}

/* Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: rgba(0, 255, 136, 0.03);
}

.player-name {
  font-weight: 500;
  color: var(--color-text);
}

.email {
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.score {
  font-family: var(--font-display);
  color: var(--color-primary);
  font-size: 1.1rem;
}

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pill.complete {
  background: rgba(0, 255, 136, 0.1);
  color: var(--color-primary);
}

.status-pill.in-progress {
  background: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

.source-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.source-badge.tradeshow {
  background: rgba(0, 217, 255, 0.1);
  color: var(--color-secondary);
}

.source-badge.web {
  background: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

/* Buttons */
.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-background);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover, #00ffaa);
  box-shadow: 0 0 20px var(--color-primary-glow);
}

.btn-secondary {
  background: var(--color-surface-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-primary);
}

.btn-outline {
  background: transparent;
  color: var(--color-text-dim);
  border: 1px solid var(--color-border);
}

.btn-outline:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-danger {
  background: var(--color-accent);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff3385;
  box-shadow: 0 0 20px rgba(255, 0, 102, 0.3);
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 450px;
  width: 100%;
}

.modal-dialog h3 {
  color: var(--color-accent);
  margin-bottom: 1rem;
}

.modal-dialog p {
  color: var(--color-text-dim);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }

  .header-right .btn {
    flex: 1;
  }

  .tab-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .data-table {
    font-size: 0.8rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
}
</style>

