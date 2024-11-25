import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ColorQr {
    uuid: string
    label: string
    color: string
}

const defaultColors: ColorQr[] = [
    { uuid: '1', label: 'Rojo', color: '#ff0000' },
    { uuid: '2', label: 'Verde', color: '#00ff00' },
    { uuid: '3', label: 'Azul', color: '#0000ff' },
]

export const useColorsQrStore = create(
    persist<{
        colors: ColorQr[]
        addColor: (color: ColorQr) => void
        removeColor: (color: ColorQr) => void
        updateColor: (color: ColorQr) => void
        forceUpdate: () => void
    }>(
        (set) => ({
            colors: defaultColors,
            addColor: (color) => set((state) => ({ colors: [...state.colors, color] })),
            removeColor: (color) => set((state) => ({ colors: state.colors.filter((c) => c.uuid !== color.uuid) })),
            updateColor: (color) => set((state) => ({ colors: state.colors.map((c) => c.uuid === color.uuid ? color : c) })),
            forceUpdate: () => set((state) => ({ colors: state.colors })),
        }),
        {
            name: 'colorsQr-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
