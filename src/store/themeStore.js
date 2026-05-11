import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark
        set({ dark: next })
        applyTheme(next)
      },
      init: () => applyTheme(get().dark),
    }),
    { name: 'theme' }
  )
)

export default useThemeStore
