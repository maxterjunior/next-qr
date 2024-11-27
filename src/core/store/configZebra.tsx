import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// itemsLabel: 4,
// yAlign: 3.6,
// xAlignBase: 1,
// xAlignFactor: 26.1,
// fontSize: '0,2',
// qrSize: 0.9
export interface ConfigZebra {
    uuid: string
    label: string
    itemsLabel: number
    yAlign: number
    xAlignBase: number
    xAlignFactor: number
    fontSize: string
    qrSize: number,
    qrYAlign: number,
    maxLength: number
}

const defaultValues: ConfigZebra[] = [
    {
        uuid: '1',
        label: 'ZT411 (300 dpi)',
        itemsLabel: 4,
        yAlign: 3.6,
        xAlignBase: 1,
        xAlignFactor: 26.1,
        fontSize: '0,2',
        qrSize: 0.9,
        qrYAlign: 0,
        maxLength: 23
    }
]

export const useConfigZebraStore = create(
    persist<{
        configs: ConfigZebra[]
        addConfig: (color: ConfigZebra) => void
        removeConfig: (color: ConfigZebra) => void
        updateConfig: (color: ConfigZebra) => void
        forceUpdate: () => void
    }>(
        (set) => ({
            configs: defaultValues,
            addConfig: (color) => set((state) => ({ configs: [...state.configs, color] })),
            removeConfig: (color) => set((state) => ({ configs: state.configs.filter((c) => c.uuid !== color.uuid) })),
            updateConfig: (color) => set((state) => ({ configs: state.configs.map((c) => c.uuid === color.uuid ? color : c) })),
            forceUpdate: () => set((state) => ({ configs: state.configs })),
        }),
        {
            name: 'configZebra-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            version: 1, // (optional) by default, 0 is used
        },
    ),
)
