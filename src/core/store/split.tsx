import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useSplitStore = create(
    persist<{
        splitSpace: boolean
        toggleSplit: () => void
    }>(
        (set) => ({
            splitSpace: false,
            toggleSplit: () => set((state) => ({ splitSpace: !state.splitSpace })),
        }),
        {
            name: 'typeSplit-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
