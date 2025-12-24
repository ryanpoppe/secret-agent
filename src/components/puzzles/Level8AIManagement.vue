<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Chat state
interface ChatMessage {
  id: number
  type: 'ai' | 'user'
  content: string
  isTyping?: boolean
}

interface AICommand {
  id: string
  displayText: string
  userMessage: string
  aiResponse: {
    intro: string
    details: string[]
    followUp: string
  }
  completed: boolean
}

const commands = ref<AICommand[]>([
  {
    id: 'folder',
    displayText: 'Create folder: Headquarters/Floor2',
    userMessage: 'Create folder: Headquarters/Floor2',
    aiResponse: {
      intro: 'Understood. Creating folder structure...',
      details: ['✓ Created: Headquarters/Floor2', '', 'This folder is now available in your printer organization hierarchy. You can add printers to this folder or create subfolders.'],
      followUp: 'What else can I help with?',
    },
    completed: false,
  },
  {
    id: 'printer',
    displayText: 'Add printer: IP 192.168.1.50, Driver: HP Universal',
    userMessage: 'Add printer: IP 192.168.1.50, Driver: HP Universal, Folder: Headquarters/Floor2',
    aiResponse: {
      intro: 'Adding printer with specified configuration...',
      details: [
        '✓ Printer added successfully',
        '',
        'Details:',
        '• Name: HP-Floor2-Printer01',
        '• IP Address: 192.168.1.50',
        '• Driver: HP Universal PCL6',
        '• Location: Headquarters/Floor2',
        '• Status: Online',
        '',
        'The printer is now available for deployment to users.',
      ],
      followUp: 'What else can I help with?',
    },
    completed: false,
  },
  {
    id: 'iprange',
    displayText: 'Create IP range: 10.0.0.0/24 for Building-A',
    userMessage: 'Create IP range object: 10.0.0.0/24 for Building-A',
    aiResponse: {
      intro: 'Creating dynamic IP range for location-based printer deployment...',
      details: [
        '✓ IP Range Object Created',
        '',
        'Details:',
        '• Name: Building-A-Range',
        '• IP Range: 10.0.0.0/24 (10.0.0.1-10.0.0.254)',
        '• Subnet Mask: 255.255.255.0',
        '',
        'Printers can now be dynamically deployed to users based on this IP range. When users connect from Building-A network, they\'ll automatically receive Building-A printers.',
      ],
      followUp: 'What else can I help with?',
    },
    completed: false,
  },
])

const chatMessages = ref<ChatMessage[]>([
  {
    id: 0,
    type: 'ai',
    content: "Hello! I'm your AI assistant for print management. I can help you create folders, add printers, configure IP ranges, and more—all through natural language.\n\nWhat would you like me to do?",
  },
])

const isTypingUser = ref(false)
const isTypingAI = ref(false)
const typingText = ref('')
const chatContainer = ref<HTMLElement | null>(null)

// Automation tasks state
interface AutomationTask {
  id: string
  text: string
  canBeAutomated: boolean
  userAnswer: boolean | null
  explanation: string
}

const automationTasks = ref<AutomationTask[]>([
  {
    id: 'drivers',
    text: 'Automatic driver updates',
    canBeAutomated: true,
    userAnswer: null,
    explanation: 'AI monitors driver versions and automatically updates driver profiles in the repository, pushing updates to all endpoints.',
  },
  {
    id: 'dynamic',
    text: 'Dynamic printer deployment based on location',
    canBeAutomated: true,
    userAnswer: null,
    explanation: 'IP range objects + user location detection = automatic printer deployment/removal.',
  },
  {
    id: 'profiles',
    text: 'Central driver profile management',
    canBeAutomated: true,
    userAnswer: null,
    explanation: 'AI manages driver repository, tracks versions, identifies conflicts, suggests updates.',
  },
  {
    id: 'selfservice',
    text: 'Self-service printer installation for end users',
    canBeAutomated: true,
    userAnswer: null,
    explanation: 'Self-service portal automates what used to require IT help desk tickets.',
  },
  {
    id: 'hardware',
    text: 'Physical printer hardware replacement',
    canBeAutomated: false,
    userAnswer: null,
    explanation: 'Physical hardware tasks still require human hands (but Vasion can alert when hardware needs replacement).',
  },
  {
    id: 'contracts',
    text: 'Negotiating printer vendor contracts',
    canBeAutomated: false,
    userAnswer: null,
    explanation: 'Business negotiations require human judgment (but Vasion can provide usage data to inform negotiations).',
  },
])

// Overall state
const phase = ref<'chat' | 'automation' | 'review'>('chat')
const showSuccess = ref(false)

// Computed
const allCommandsCompleted = computed(() => commands.value.every((c) => c.completed))
const availableCommands = computed(() => commands.value.filter((c) => !c.completed))
const allTasksAnswered = computed(() => automationTasks.value.every((t) => t.userAnswer !== null))
const correctTaskCount = computed(() => automationTasks.value.filter((t) => t.userAnswer === t.canBeAutomated).length)

const baseUrl = import.meta.env.BASE_URL

// Chat methods
async function selectCommand(command: AICommand) {
  if (isTypingUser.value || isTypingAI.value || command.completed) return

  // Simulate typing user message
  isTypingUser.value = true
  typingText.value = ''

  const userMsg = command.userMessage
  for (let i = 0; i < userMsg.length; i++) {
    typingText.value += userMsg[i]
    await delay(30)
  }

  // Add user message to chat
  chatMessages.value.push({
    id: chatMessages.value.length,
    type: 'user',
    content: userMsg,
  })

  isTypingUser.value = false
  typingText.value = ''
  await scrollToBottom()

  // AI typing delay
  await delay(500)

  // Show AI typing indicator
  isTypingAI.value = true
  await delay(1000)

  // Add AI response
  const aiContent = `🤖 ${command.aiResponse.intro}\n\n[████████████████] 100%\n\n${command.aiResponse.details.join('\n')}\n\n${command.aiResponse.followUp}`

  chatMessages.value.push({
    id: chatMessages.value.length,
    type: 'ai',
    content: aiContent,
  })

  isTypingAI.value = false
  command.completed = true
  playSound('bling1.mp3')
  await scrollToBottom()

  // Check if all commands completed
  if (allCommandsCompleted.value) {
    await delay(1500)
    phase.value = 'automation'
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Automation methods
function answerTask(task: AutomationTask, answer: boolean) {
  if (task.userAnswer !== null) return
  task.userAnswer = answer
  playSound('bling1.mp3')

  if (allTasksAnswered.value) {
    setTimeout(() => {
      phase.value = 'review'
      setTimeout(() => {
        showSuccess.value = true
      }, 2000)
    }, 1000)
  }
}

function playSound(filename: string) {
  try {
    const audio = new Audio(`${baseUrl}sounds/${filename}`)
    audio.volume = 0.4
    audio.play().catch(() => {})
  } catch {
    // Audio not available
  }
}

function proceed() {
  gameStore.completeLevel(8)
  router.push({ name: 'level', params: { id: '9' } })
}
</script>

<template>
  <div class="level8-puzzle">
    <!-- Mission briefing -->
    <div class="mission-briefing">
      <div class="briefing-header">
        <span class="location-tag">LOCATION: Apex Industries IT Operations Center</span>
        <span class="difficulty-tag">DIFFICULTY: ⭐⭐⭐ Advanced</span>
      </div>

      <div class="ticket-analysis">
        <div class="analysis-header">IT HELP DESK TICKET ANALYSIS</div>
        <div class="analysis-content">
          <div class="stat-row">
            <span>Total tickets this month:</span>
            <span class="stat-value">847</span>
          </div>
          <div class="stat-row highlight">
            <span>Print-related tickets:</span>
            <span class="stat-value warning">412 (49%)</span>
          </div>
          <div class="stat-row">
            <span>Average resolution time:</span>
            <span class="stat-value">3.2 hours</span>
          </div>
          <div class="stat-row">
            <span>IT hours spent on print:</span>
            <span class="stat-value warning">1,318 hours/month</span>
          </div>
        </div>
        <p class="mission-task">Your mission: Deploy <strong>AI-powered management</strong> to automate these tasks.</p>
      </div>
    </div>

    <!-- Part A: AI Chat Interface -->
    <div v-if="phase === 'chat'" class="chat-section">
      <div class="part-header">
        <span class="part-label">PART A</span>
        <h3 class="part-title">AI AGENT INTERACTION</h3>
        <span class="part-progress">{{ commands.filter(c => c.completed).length }}/{{ commands.length }}</span>
      </div>

      <div class="chat-container">
        <div ref="chatContainer" class="chat-messages">
          <div v-for="msg in chatMessages" :key="msg.id" class="chat-message" :class="msg.type">
            <div class="message-avatar">
              {{ msg.type === 'ai' ? '🤖' : '👤' }}
            </div>
            <div class="message-content">
              <pre class="message-text">{{ msg.content }}</pre>
            </div>
          </div>

          <!-- User typing indicator -->
          <div v-if="isTypingUser" class="chat-message user">
            <div class="message-avatar">👤</div>
            <div class="message-content">
              <pre class="message-text typing">{{ typingText }}<span class="cursor">|</span></pre>
            </div>
          </div>

          <!-- AI typing indicator -->
          <div v-if="isTypingAI" class="chat-message ai">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Command buttons -->
        <div class="command-panel">
          <div class="command-label">Select a command:</div>
          <div class="command-buttons">
            <button
              v-for="cmd in availableCommands"
              :key="cmd.id"
              class="command-btn"
              :disabled="isTypingUser || isTypingAI"
              @click="selectCommand(cmd)"
            >
              <span class="cmd-icon">▶</span>
              <span class="cmd-text">{{ cmd.displayText }}</span>
            </button>
          </div>

          <div v-if="allCommandsCompleted" class="commands-complete">
            <span class="complete-icon">✓</span>
            <span class="complete-text">All commands executed successfully!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Part E: Automation Assessment -->
    <div v-else-if="phase === 'automation' || phase === 'review'" class="automation-section">
      <div class="part-header">
        <span class="part-label">PART B</span>
        <h3 class="part-title">AI AUTOMATION ASSESSMENT</h3>
        <span class="part-progress">{{ automationTasks.filter(t => t.userAnswer !== null).length }}/{{ automationTasks.length }}</span>
      </div>

      <p class="automation-instruction">Which tasks can be automated by AI? Select for each:</p>

      <div class="tasks-list">
        <div v-for="task in automationTasks" :key="task.id" class="task-card" :class="{ answered: task.userAnswer !== null }">
          <div class="task-text">{{ task.text }}</div>

          <div v-if="task.userAnswer === null" class="task-buttons">
            <button class="task-btn can" @click="answerTask(task, true)">✓ Can be automated</button>
            <button class="task-btn cannot" @click="answerTask(task, false)">✗ Cannot be automated</button>
          </div>

          <div v-else class="task-result" :class="{ correct: task.userAnswer === task.canBeAutomated }">
            <div class="result-header">
              <span class="result-icon">{{ task.userAnswer === task.canBeAutomated ? '✓' : '✗' }}</span>
              <span class="result-label">
                {{ task.canBeAutomated ? 'CAN be automated' : 'CANNOT be automated' }}
              </span>
            </div>
            <p class="result-explanation">{{ task.explanation }}</p>
          </div>
        </div>
      </div>

      <div v-if="phase === 'review'" class="review-summary">
        <div class="summary-header">Assessment Complete</div>
        <div class="summary-score">{{ correctTaskCount }}/{{ automationTasks.length }} correct</div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-modal">
          <div class="success-header">
            <h2>🎯 OBJECTIVE 8: COMPLETE</h2>
          </div>

          <div class="success-content">
            <div class="success-message">AI-POWERED MANAGEMENT ACTIVATED</div>

            <div class="success-checklist">
              <div class="check-item">✓ Interacted with AI agent for configuration</div>
              <div class="check-item">✓ Created folder structure via AI</div>
              <div class="check-item">✓ Added printer with AI assistance</div>
              <div class="check-item">✓ Configured dynamic IP-based deployments</div>
              <div class="check-item">✓ Identified automation opportunities</div>
            </div>

            <div class="transformation-section">
              <div class="transform-col before">
                <h4>BEFORE (Manual)</h4>
                <ul>
                  <li>412 print tickets/month</li>
                  <li>1,318 IT hours/month</li>
                  <li>3.2 hours avg resolution</li>
                  <li>Manual driver updates</li>
                  <li>Users can't self-install</li>
                </ul>
              </div>
              <div class="transform-col after">
                <h4>AFTER (AI-Powered)</h4>
                <ul>
                  <li>~120 tickets/month (-70%)</li>
                  <li>~400 IT hours/month (-70%)</li>
                  <li>0.5 hours avg resolution</li>
                  <li>One-click driver updates</li>
                  <li>Self-service portal</li>
                </ul>
              </div>
            </div>

            <div class="savings-highlight">
              <div class="savings-item">
                <span class="savings-icon">💰</span>
                <span class="savings-text">TIME SAVINGS: 918 IT hours/month</span>
              </div>
              <div class="savings-item">
                <span class="savings-icon">💵</span>
                <span class="savings-text">COST SAVINGS: ~$50,000/month</span>
              </div>
            </div>

            <div class="learnings-box">
              <h4>KEY LEARNINGS:</h4>
              <ul>
                <li>AI agent assists with folders, printers, IP ranges via natural language</li>
                <li>Central driver repository: update once, push to all printers</li>
                <li>Dynamic deployment via IP ranges: printers appear based on location</li>
                <li>Self-service portal: users install without admin rights</li>
                <li>AI automates: driver updates, dynamic deployment, profile management</li>
              </ul>
            </div>
          </div>

          <div class="success-actions">
            <button class="btn btn-primary btn-lg" @click="proceed">PROCEED TO OBJECTIVE 9 →</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.level8-puzzle {
  width: 100%;
}

/* Mission briefing */
.mission-briefing {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.briefing-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  font-size: 0.75rem;
}

.location-tag {
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.difficulty-tag {
  color: var(--color-warning);
}

.ticket-analysis {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.analysis-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-secondary);
  margin-bottom: var(--space-md);
  letter-spacing: 0.1em;
}

.analysis-content {
  margin-bottom: var(--space-md);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.stat-row.highlight {
  background: var(--color-surface);
  margin: var(--space-xs) calc(-1 * var(--space-md));
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
}

.stat-value {
  font-family: var(--font-display);
  color: var(--color-text);
}

.stat-value.warning {
  color: var(--color-accent);
}

.mission-task {
  color: var(--color-primary);
  font-size: 0.9rem;
  margin: 0;
  margin-top: var(--space-md);
}

/* Part headers */
.part-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.part-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--color-secondary);
  padding: 2px 8px;
  background: var(--color-secondary-dim);
  border-radius: 2px;
}

.part-title {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
}

.part-progress {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
}

/* Chat section */
.chat-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.chat-container {
  background: linear-gradient(180deg, #0d1117, #161b22);
  border: 2px solid #333;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: var(--space-lg);
}

.chat-message {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.chat-message.user .message-content {
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
}

.message-text {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text);
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.5;
}

.message-text.typing {
  color: var(--color-primary);
}

.cursor {
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-sm);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--color-text-dim);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Command panel */
.command-panel {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-md);
}

.command-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.command-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.command-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.command-btn:hover:not(:disabled) {
  background: var(--color-primary-glow);
}

.command-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cmd-icon {
  font-size: 0.8rem;
}

.cmd-text {
  font-size: 0.85rem;
}

.commands-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-primary-glow);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  margin-top: var(--space-md);
}

.complete-icon {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.complete-text {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-primary);
}

/* Automation section */
.automation-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.automation-instruction {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  margin-bottom: var(--space-lg);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.task-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.task-card.answered {
  border-color: var(--color-text-dim);
}

.task-text {
  font-size: 0.95rem;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.task-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.task-btn {
  padding: var(--space-md);
  font-size: 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.task-btn.can {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.task-btn.can:hover {
  background: var(--color-primary-glow);
}

.task-btn.cannot {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
}

.task-btn.cannot:hover {
  background: rgba(255, 0, 102, 0.1);
}

.task-result {
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.task-result.correct {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--color-primary);
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.result-icon {
  font-size: 1.25rem;
}

.task-result.correct .result-icon,
.task-result.correct .result-label {
  color: var(--color-primary);
}

.task-result:not(.correct) .result-icon,
.task-result:not(.correct) .result-label {
  color: var(--color-accent);
}

.result-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
}

.result-explanation {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin: 0;
  line-height: 1.4;
}

.review-summary {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  text-align: center;
}

.summary-header {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: var(--space-sm);
}

.summary-score {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--color-primary);
}

/* Success modal */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: 1000;
  overflow-y: auto;
}

.success-modal {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.success-header {
  padding: var(--space-lg);
  text-align: center;
  background: var(--color-primary-glow);
  border-bottom: 1px solid var(--color-border);
}

.success-header h2 {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin: 0;
}

.success-content {
  padding: var(--space-lg);
}

.success-message {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: var(--space-lg);
}

.success-checklist {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.check-item {
  color: var(--color-primary);
  font-size: 0.85rem;
  padding: var(--space-xs) 0;
}

.transformation-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.transform-col {
  padding: var(--space-md);
  border-radius: var(--radius-sm);
}

.transform-col.before {
  background: rgba(255, 0, 102, 0.1);
  border: 1px solid var(--color-accent);
}

.transform-col.after {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--color-primary);
}

.transform-col h4 {
  font-size: 0.75rem;
  margin-bottom: var(--space-sm);
}

.transform-col.before h4 {
  color: var(--color-accent);
}

.transform-col.after h4 {
  color: var(--color-primary);
}

.transform-col ul {
  list-style: none;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.transform-col li {
  margin-bottom: 2px;
}

.savings-highlight {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.savings-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

.savings-icon {
  font-size: 1.5rem;
}

.savings-text {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary);
}

.learnings-box {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

.learnings-box h4 {
  font-size: 0.75rem;
  color: var(--color-warning);
  margin-bottom: var(--space-sm);
}

.learnings-box ul {
  list-style: none;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.learnings-box li {
  margin-bottom: var(--space-xs);
}

.success-actions {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .transformation-section {
    grid-template-columns: 1fr;
  }

  .savings-highlight {
    grid-template-columns: 1fr;
  }

  .task-buttons {
    grid-template-columns: 1fr;
  }
}
</style>

