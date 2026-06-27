import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  accent: string
  setTheme: (theme: Theme) => void
  setAccent: (accent: string) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      accent: '#6366f1',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      setAccent: (accent) => {
        document.documentElement.style.setProperty('--accent', accent)
        set({ accent })
      },
    }),
    { name: 'changeos-theme' },
  ),
)
