import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLocations } from '../api'

export const useAppStore = defineStore('app', () => {
  const locations = ref([])
  const currentLocation = ref('')
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  function applyTheme() {
    const root = document.documentElement
    const body = document.body
    if (isDark.value) {
      root.setAttribute('data-theme', 'dark')
      body?.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
      body?.removeAttribute('data-theme')
      localStorage.removeItem('theme')
    }
  }

  function toggleDark() {
    const domIsDark = document.documentElement.getAttribute('data-theme') === 'dark'
    isDark.value = !domIsDark
    applyTheme()
  }

  // Init theme on load
  applyTheme()

  async function fetchLocations() {
    const { data } = await getLocations()
    locations.value = data
  }

  return { locations, currentLocation, fetchLocations, isDark, toggleDark }
})
