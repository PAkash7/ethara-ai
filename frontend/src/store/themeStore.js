import { create } from 'zustand'

const saved = localStorage.getItem('theme') || 'night'

const useThemeStore = create((set) => ({
  theme: saved, // 'night' | 'day'

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'night' ? 'day' : 'night'
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    })
  },

  initTheme: () => {
    document.documentElement.setAttribute('data-theme', saved)
  },
}))

export default useThemeStore
