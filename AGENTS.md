# AGENTS.md - Secret Agent Game

## Project Overview

This is a Secret Agent themed puzzle game designed for IT professionals visiting the Vasion/PrinterLogic booth at tradeshows. The game serves as an engaging lead generation tool, providing a fun 10-minute experience while capturing valuable sales leads.

**Key Facts:**
- **Technology**: Vue 3 SPA with TypeScript
- **Target Audience**: IT professionals at tradeshows
- **Purpose**: Lead generation for Vasion/PrinterLogic sales team
- **Duration**: ~10 minutes (approximately 45-60 seconds per level)
- **Platform**: Mobile-friendly web application (online only)
- **Theme**: Secret agent/spy missions with IT-relevant puzzles

## Game Structure

The game consists of 13 stages total:

1. **Intro/Lead Capture Screen** - Player onboarding and information collection
2. **11 Puzzle Levels** - Progressive secret agent themed challenges
3. **Debrief Screen** - Mission completion and next steps

### Flow Diagram
```
[Intro/Lead Capture] → [Level 1] → [Level 2] → ... → [Level 11] → [Debrief]
```

## Lead Generation

### Lead Capture Requirements

**When**: At the intro screen (before gameplay begins)

**Required Fields**:
- Full Name
- Email Address
- Company Name
- Job Title/Role
- Phone Number (optional)

**Validation**:
- All required fields must be completed before starting the game
- Email validation (proper format)
- Form should be mobile-friendly with large touch targets

**Data Storage**:
- Store lead data in Pinia store immediately upon form submission
- Persist to localStorage as backup
- Submit to API endpoint (to be provided later)
- Track additional metrics: completion status, time to complete, levels completed

**API Integration** (Future):
```typescript
// API endpoint will be provided later
POST /api/leads
{
  "name": string,
  "email": string,
  "company": string,
  "role": string,
  "phone": string | null,
  "completedAt": timestamp | null,
  "completionTime": number, // seconds
  "levelsCompleted": number,
  "totalScore": number | null
}
```

## Puzzle Design

### Puzzle Types

The game features IT-friendly puzzles that are:
- Secret agent themed (codes, ciphers, spy missions)
- Relatively easy for IT professionals to solve
- Quick to complete (30-60 seconds each)
- Mobile-friendly (no complex typing required)

**Puzzle Examples**:

1. **Caesar Cipher** - Decode a shifted alphabet message
2. **Morse Code** - Translate dots and dashes to text
3. **Binary Conversion** - Convert binary to ASCII text
4. **Hexadecimal Decoding** - Decode hex values
5. **Network Diagram** - Identify security vulnerabilities or correct path
6. **Pattern Recognition** - Complete sequences or identify patterns
7. **Simple Substitution Cipher** - Letter-for-letter substitution
8. **Port Number Identification** - Match services to port numbers
9. **Logic Puzzles** - Spy-themed deduction problems
10. **Visual Puzzles** - Spot differences in network diagrams or code
11. **Final Challenge** - Combination of multiple puzzle types

### Puzzle Level Structure

Each level should follow this pattern:

```vue
<template>
  <div class="puzzle-level">
    <!-- Mission briefing -->
    <div class="mission-brief">
      <h2>Mission {{ levelNumber }}</h2>
      <p>{{ missionDescription }}</p>
    </div>
    
    <!-- Puzzle content -->
    <div class="puzzle-content">
      <!-- Puzzle-specific UI -->
    </div>
    
    <!-- Answer input -->
    <div class="answer-section">
      <input v-model="answer" @keyup.enter="submitAnswer" />
      <button @click="submitAnswer">Submit</button>
      <button @click="showHint" v-if="!hintShown">Hint</button>
    </div>
    
    <!-- Feedback -->
    <div class="feedback" v-if="feedback">
      {{ feedback }}
    </div>
  </div>
</template>
```

**Level Requirements**:
- Clear mission briefing with spy theme
- Visual puzzle presentation
- Simple answer input (text input, multiple choice, or drag-and-drop)
- Immediate feedback on submission
- Optional hint system (one hint per level)
- Progress indicator showing current level (X of 11)
- Ability to proceed to next level on correct answer

## Technical Architecture

### Tech Stack

- **Framework**: Vue 3.5+ with Composition API
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite 7+
- **State Management**: Pinia 3+
- **Routing**: Vue Router 4+
- **Styling**: CSS with CSS custom properties (no framework needed)

### Component Structure

```
src/
├── components/
│   ├── shared/
│   │   ├── MissionBrief.vue      # Reusable mission briefing component
│   │   ├── ProgressBar.vue       # Level progress indicator
│   │   ├── Timer.vue             # Optional timer display
│   │   └── HintButton.vue        # Hint reveal component
│   ├── puzzles/
│   │   ├── PuzzleBase.vue        # Base puzzle component (composable logic)
│   │   ├── CaesarCipher.vue      # Level 1
│   │   ├── MorseCode.vue         # Level 2
│   │   ├── BinaryPuzzle.vue      # Level 3
│   │   └── ...                   # Levels 4-11
│   └── layouts/
│       ├── GameLayout.vue        # Common layout for all puzzle levels
│       └── SecretAgentTheme.vue  # Theme wrapper
├── views/
│   ├── IntroView.vue             # Lead capture + game intro
│   ├── LevelView.vue             # Dynamic level loader
│   └── DebriefView.vue           # Completion screen
├── stores/
│   ├── player.ts                 # Player/lead information
│   ├── game.ts                   # Game state (current level, progress, timer)
│   └── puzzle.ts                 # Puzzle answers and validation
├── router/
│   └── index.ts                  # Route definitions
├── utils/
│   ├── puzzleValidators.ts       # Answer validation logic
│   ├── puzzleGenerators.ts       # Dynamic puzzle generation (optional)
│   └── api.ts                    # API client for lead submission
└── types/
    ├── player.ts                 # Player/lead type definitions
    └── puzzle.ts                 # Puzzle type definitions
```

### State Management (Pinia Stores)

**Player Store** (`stores/player.ts`):
```typescript
interface PlayerState {
  name: string
  email: string
  company: string
  role: string
  phone: string | null
  submittedAt: Date | null
}
```

**Game Store** (`stores/game.ts`):
```typescript
interface GameState {
  currentLevel: number          // 0 = intro, 1-11 = levels, 12 = debrief
  levelsCompleted: number[]     // Array of completed level IDs
  startTime: Date | null        // Game start timestamp
  endTime: Date | null          // Game completion timestamp
  hintsUsed: number[]           // Levels where hints were used
  isComplete: boolean
}
```

**Puzzle Store** (`stores/puzzle.ts`):
```typescript
interface PuzzleState {
  puzzles: Puzzle[]             // Puzzle configurations
  currentPuzzle: Puzzle | null
  attempts: number              // Attempts for current puzzle
}

interface Puzzle {
  id: number
  type: string                  // 'caesar', 'morse', 'binary', etc.
  question: string
  answer: string
  hint: string
  validationFn: (input: string) => boolean
}
```

### Routing Strategy

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'intro',
    component: IntroView
  },
  {
    path: '/level/:id',
    name: 'level',
    component: LevelView,
    props: true,
    beforeEnter: (to, from, next) => {
      // Ensure lead info is captured before accessing levels
      const playerStore = usePlayerStore()
      if (!playerStore.email) {
        next({ name: 'intro' })
      } else {
        next()
      }
    }
  },
  {
    path: '/debrief',
    name: 'debrief',
    component: DebriefView,
    beforeEnter: (to, from, next) => {
      // Ensure game is complete before accessing debrief
      const gameStore = useGameStore()
      if (!gameStore.isComplete) {
        next({ name: 'intro' })
      } else {
        next()
      }
    }
  }
]
```

### Data Persistence

**localStorage Strategy**:
- Save player info immediately after form submission
- Save game progress after each level completion
- Restore state on page refresh (useful if player accidentally refreshes)
- Clear localStorage on debrief screen (after lead submission)

**Key naming**:
```typescript
const STORAGE_KEYS = {
  PLAYER: 'secret_agent_player',
  GAME: 'secret_agent_game',
  SESSION: 'secret_agent_session'
}
```

## UI/UX Design

### Theme: Secret Agent/Spy Aesthetic

**Visual Style**:
- Dark color scheme (blacks, dark grays, deep blues)
- Accent colors: Electric blue, neon green, or red (for alerts)
- Terminal/console inspired fonts for mission briefings
- Sleek, modern interface with subtle animations
- Mission briefing style text (e.g., "CLASSIFIED", "TOP SECRET")

**Color Palette Example**:
```css
:root {
  --color-background: #0a0e27;
  --color-surface: #1a1f3a;
  --color-primary: #00d9ff;
  --color-accent: #ff0066;
  --color-success: #00ff88;
  --color-text: #e0e6ed;
  --color-text-dim: #8892a6;
}
```

**Typography**:
- Headers: Monospace or tech-style fonts (e.g., "Courier New", "Monaco", "JetBrains Mono")
- Body: Clean sans-serif (e.g., "Inter", "Roboto", "System UI")
- Mission briefings: ALL CAPS for emphasis

**UI Elements**:
- Dossier/file folder style for mission briefs
- Glowing effects on interactive elements
- Scanline or grid background effects (subtle)
- Progress indicators styled as "mission completion percentage"
- Buttons styled as classified document stamps or terminal commands

### Mobile-First Design

**Requirements**:
- Touch-friendly buttons (minimum 44x44px tap targets)
- Responsive layout (works on phones, tablets, and desktop)
- Portrait orientation optimized
- Large, readable text (minimum 16px base font size)
- Simple interactions (tap, swipe, basic text input)
- Avoid complex hover states (use active states instead)
- Test on various screen sizes (320px to 1920px width)

**Breakpoints**:
```css
/* Mobile: 320px - 768px */
/* Tablet: 769px - 1024px */
/* Desktop: 1025px+ */
```

### Animation & Transitions

**Recommended Animations**:
- Level transitions: Fade or slide effects
- Success feedback: Pulse or glow effect
- Mission briefing: Type-writer effect (optional)
- Progress bar: Smooth fill animation
- Incorrect answer: Shake effect

**Performance**:
- Use CSS transforms for animations (hardware accelerated)
- Avoid layout thrashing
- Keep animations under 300ms for snappy feel

## Development Guidelines

### Code Standards

1. **TypeScript Strict Mode**: All code must be typed
2. **Composition API**: Use `<script setup>` syntax
3. **Component Props**: Define with `defineProps<T>()`
4. **Emits**: Define with `defineEmits<T>()`
5. **Composables**: Extract reusable logic into `composables/` directory

### Puzzle Development Pattern

Each puzzle should follow this pattern:

```typescript
// composables/usePuzzle.ts
export function usePuzzle(
  question: string,
  answer: string,
  hint: string,
  validator?: (input: string) => boolean
) {
  const userAnswer = ref('')
  const feedback = ref('')
  const hintShown = ref(false)
  const attempts = ref(0)
  
  const checkAnswer = () => {
    attempts.value++
    const isCorrect = validator 
      ? validator(userAnswer.value)
      : userAnswer.value.toLowerCase().trim() === answer.toLowerCase().trim()
    
    if (isCorrect) {
      feedback.value = 'Mission accomplished!'
      return true
    } else {
      feedback.value = 'Incorrect. Try again, agent.'
      return false
    }
  }
  
  const showHint = () => {
    hintShown.value = true
  }
  
  return {
    userAnswer,
    feedback,
    hintShown,
    attempts,
    checkAnswer,
    showHint,
    hint
  }
}
```

### Adding New Levels

To add a new puzzle level:

1. Create component in `src/components/puzzles/`
2. Define puzzle data (question, answer, hint)
3. Implement validation logic
4. Add to puzzle store configuration
5. Update routing if needed
6. Test on mobile and desktop

### Testing Checklist

- [ ] All puzzles solvable on mobile devices
- [ ] Lead form validation works correctly
- [ ] Progress persists on page refresh
- [ ] Routing guards prevent skipping levels
- [ ] API submission includes all required fields
- [ ] Debrief screen shows completion metrics
- [ ] Timer tracks total completion time
- [ ] Hints display correctly
- [ ] Responsive design works on all screen sizes
- [ ] Accessible (keyboard navigation, screen readers)

## Deployment

### Build Process

```bash
npm run build
```

Outputs to `dist/` directory (configure in `vite.config.ts`)

### Hosting Options

- **GitHub Pages**: Free static hosting
- **Netlify**: Easy deployment with form handling
- **Vercel**: Serverless functions for API
- **Cloudflare Pages**: Global CDN

### Environment Variables

Create `.env` file for API configuration:

```bash
VITE_API_ENDPOINT=https://api.example.com/leads
VITE_API_KEY=your_api_key_here
```

Access in code:
```typescript
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT
```

### GitHub Actions Workflow

The existing workflow (`.github/workflows/static.yml`) needs to be updated:

**Current issue**: Deploys from `./html` but Vite builds to `./dist`

**Fix needed**: Update workflow to build and deploy from correct directory

## API Integration (Future)

### Lead Submission

**Endpoint**: TBD (will be provided later)

**Request Format**:
```typescript
interface LeadSubmission {
  // Player information
  name: string
  email: string
  company: string
  role: string
  phone?: string
  
  // Game metrics
  completedAt: string // ISO timestamp
  completionTime: number // seconds
  levelsCompleted: number
  hintsUsed: number
  totalAttempts: number
  
  // Source tracking
  source: 'tradeshow' | 'web'
  event?: string // Tradeshow name
}
```

**Error Handling**:
```typescript
async function submitLead(data: LeadSubmission) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      // Store in localStorage for retry
      saveFailedSubmission(data)
      throw new Error('Lead submission failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Lead submission error:', error)
    // Queue for retry or manual export
    saveFailedSubmission(data)
  }
}
```

### Retry Logic

- Store failed submissions in localStorage
- Attempt retry on next page load or interaction
- Provide manual export option (CSV download) if API is unavailable

## Game Flow Details

### Intro Screen

**Content**:
- Welcome message with secret agent theme
- Brief game instructions (1-2 sentences)
- Lead capture form
- "Begin Mission" button (disabled until form is valid)

**Example Copy**:
```
CLASSIFIED MISSION BRIEFING

Agent, we need your help.

Complete 11 missions to prove your skills and 
earn your place in our elite team.

Before we begin, we need your credentials...

[Lead Form]

[BEGIN MISSION]
```

### Level Transitions

**After Correct Answer**:
1. Show success feedback (0.5s)
2. Update progress bar
3. Brief pause (0.5s)
4. Transition to next level (0.3s fade)

**Total transition time**: ~1.5 seconds

### Debrief Screen

**Content**:
- Mission accomplished message
- Completion time displayed
- Call-to-action for next steps
- Optional: Social sharing
- Thank you message

**Example Copy**:
```
MISSION ACCOMPLISHED

Excellent work, Agent [Name]!

Completion Time: [XX:XX]
Missions Completed: 11/11

Your skills have been noted. A member of our team 
will contact you at [email] to discuss your next assignment.

[RETURN TO BASE] (restart game button)
```

**Next Steps**:
- Display Vasion/PrinterLogic contact information
- Encourage booth visit or demo scheduling
- Optional: QR code for additional resources

## Future Enhancements (Optional)

### Potential Features

- **Leaderboard**: Track fastest completion times
- **Difficulty Modes**: Easy/Normal/Hard
- **Daily Challenges**: New puzzles each day
- **Achievement Badges**: Unlock achievements for special accomplishments
- **Multi-language Support**: Internationalization
- **Sound Effects**: Spy-themed audio feedback
- **Animations**: More elaborate mission briefing animations
- **Multiplayer**: Team-based puzzle solving
- **Custom Branding**: Easy theme customization per event

### Analytics Tracking

Consider adding analytics to track:
- Completion rate
- Average completion time
- Drop-off points (which level do people quit?)
- Most difficult puzzles (highest attempt count)
- Lead quality scores (completion + time metrics)

**Tools**: Google Analytics, Plausible, or custom event tracking

## Tradeshow Considerations

### Booth Setup

- **Display**: Large tablet or mounted display
- **Input**: Touch screen recommended
- **Network**: Ensure stable internet connection
- **Backup**: Have offline lead capture form ready
- **Demo**: Practice demonstration for booth visitors

### Staff Training

- **Quick Demo**: Show first puzzle (30 seconds)
- **Lead Collection**: Explain why we collect info upfront
- **Assistance**: Know hints for all puzzles
- **Technical Issues**: Have backup plan (paper forms)

### Performance

- **Load Time**: Optimize for fast loading (< 2 seconds)
- **Bundle Size**: Keep JavaScript bundle small
- **Images**: Optimize all assets for web
- **Caching**: Configure aggressive caching for repeat visitors

## Support & Maintenance

### Common Issues

**Issue**: Player refreshes page mid-game
**Solution**: localStorage persistence restores progress

**Issue**: API submission fails
**Solution**: Store leads locally, retry later or manual export

**Issue**: Player stuck on puzzle
**Solution**: Hint system + optional skip after X attempts

**Issue**: Network connectivity issues
**Solution**: Queue submissions, process when online

### Monitoring

- Check API submission success rate
- Monitor completion rates
- Track average completion times
- Review user feedback (if collected)

---

## Quick Start for AI Agents

When working on this project:

1. **Read this entire AGENTS.md file first** to understand context
2. **Check existing code** in `src/` to see current implementation state
3. **Follow the component structure** outlined above
4. **Use TypeScript strictly** - no `any` types
5. **Test on mobile** - this is mobile-first
6. **Maintain the spy theme** - keep it fun and engaging
7. **Keep it simple** - 10-minute game, easy puzzles
8. **Focus on lead generation** - that's the primary goal

### Common Tasks

**Adding a new puzzle level**:
1. Create `src/components/puzzles/YourPuzzle.vue`
2. Use `usePuzzle` composable for common logic
3. Add puzzle config to `src/stores/puzzle.ts`
4. Test answer validation thoroughly

**Modifying the theme**:
1. Update CSS custom properties in `src/assets/main.css`
2. Ensure sufficient contrast for readability
3. Test on various screen sizes

**Integrating API**:
1. Update `src/utils/api.ts` with endpoint
2. Add environment variable to `.env`
3. Implement error handling and retry logic
4. Test with mock API first

---

## Contact & Questions

For questions about this project, refer to:
- This AGENTS.md file (you're reading it!)
- Existing code comments and documentation
- Project README.md for setup instructions

**Remember**: This game is about making lead generation fun for IT professionals while collecting valuable sales leads for Vasion/PrinterLogic. Keep it engaging, professional, and on-theme!
