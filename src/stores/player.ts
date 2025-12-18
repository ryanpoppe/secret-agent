import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { PlayerState } from '@/types/player'
import { STORAGE_KEYS } from '@/types/game'

export const usePlayerStore = defineStore('player', () => {
  // State
  const name = ref('')
  const email = ref('')
  const company = ref('')
  const role = ref('')
  const phone = ref<string | null>(null)
  const submittedAt = ref<Date | null>(null)

  // Getters
  const isRegistered = computed(() => {
    return !!(name.value && email.value && company.value)
  })

  const playerData = computed<PlayerState>(() => ({
    name: name.value,
    email: email.value,
    company: company.value,
    role: role.value,
    phone: phone.value,
    submittedAt: submittedAt.value,
  }))

  // Actions
  function setPlayer(data: Partial<PlayerState>) {
    if (data.name !== undefined) name.value = data.name
    if (data.email !== undefined) email.value = data.email
    if (data.company !== undefined) company.value = data.company
    if (data.role !== undefined) role.value = data.role
    if (data.phone !== undefined) phone.value = data.phone
    if (data.submittedAt !== undefined) submittedAt.value = data.submittedAt
  }

  function registerPlayer(data: { name: string; email: string; company: string; role?: string; phone?: string }) {
    name.value = data.name
    email.value = data.email
    company.value = data.company
    role.value = data.role || ''
    phone.value = data.phone || null
    submittedAt.value = new Date()
    saveToStorage()
  }

  function saveToStorage() {
    const data = {
      name: name.value,
      email: email.value,
      company: company.value,
      role: role.value,
      phone: phone.value,
      submittedAt: submittedAt.value?.toISOString() || null,
    }
    localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(data))
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYER)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        name.value = data.name || ''
        email.value = data.email || ''
        company.value = data.company || ''
        role.value = data.role || ''
        phone.value = data.phone || null
        submittedAt.value = data.submittedAt ? new Date(data.submittedAt) : null
      } catch (e) {
        console.error('Failed to parse player data from storage:', e)
      }
    }
  }

  function clearPlayer() {
    name.value = ''
    email.value = ''
    company.value = ''
    role.value = ''
    phone.value = null
    submittedAt.value = null
    localStorage.removeItem(STORAGE_KEYS.PLAYER)
  }

  return {
    // State
    name,
    email,
    company,
    role,
    phone,
    submittedAt,
    // Getters
    isRegistered,
    playerData,
    // Actions
    setPlayer,
    registerPlayer,
    saveToStorage,
    loadFromStorage,
    clearPlayer,
  }
})

