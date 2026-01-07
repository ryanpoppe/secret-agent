import { createRouter, createWebHashHistory } from 'vue-router'
import IntroView from '@/views/IntroView.vue'
import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game'

const router = createRouter({
  // Use hash mode for GitHub Pages compatibility (URLs like /#/level/1)
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'intro',
      component: IntroView,
    },
    {
      path: '/level/:id',
      name: 'level',
      component: () => import('@/views/LevelView.vue'),
      props: true,
      beforeEnter: (to, _from, next) => {
        const playerStore = usePlayerStore()
        const gameStore = useGameStore()

        // Ensure player is registered
        if (!playerStore.isRegistered) {
          next({ name: 'intro' })
          return
        }

        // Validate level ID
        const levelId = parseInt(to.params.id as string)
        if (isNaN(levelId) || levelId < 1 || levelId > 11) {
          next({ name: 'intro' })
          return
        }

        // Check if trying to skip ahead
        if (levelId > 1 && !gameStore.levelsCompleted.includes(levelId - 1)) {
          // Redirect to current level
          next({ name: 'level', params: { id: gameStore.currentLevel.toString() } })
          return
        }

        next()
      },
    },
    {
      path: '/debrief',
      name: 'debrief',
      component: () => import('@/views/DebriefView.vue'),
      beforeEnter: (_to, _from, next) => {
        const gameStore = useGameStore()

        // Ensure game is complete
        if (!gameStore.isComplete) {
          const playerStore = usePlayerStore()
          if (!playerStore.isRegistered) {
            next({ name: 'intro' })
          } else {
            next({ name: 'level', params: { id: gameStore.currentLevel.toString() } })
          }
          return
        }

        next()
      },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      // No guard - leaderboard is publicly accessible
    },
    {
      path: '/tv',
      name: 'leaderboard-tv',
      component: () => import('@/views/LeaderboardTVView.vue'),
      // TV display for 1080p HDTV - publicly accessible
    },
    // Catch-all redirect to intro
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
