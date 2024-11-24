import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useThemeStore = create(
    persist<{
        isDark: boolean
        toggleTheme: () => void
    }>(
        (set) => ({
            isDark: false,
            toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
        }),
        {
            name: 'darkMode-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
