import { atom, useAtom } from 'jotai'
import { createStore } from 'jotai/vanilla'

type Listener<T = any> = (payload: T) => void

const listeners = new Map<string, Set<Listener>>()
const defaultStore = createStore()

export const globalDraggingAtom = atom(false)

export const useGlobalIsDragging = () => useAtom(globalDraggingAtom)

export const isGlobalDragging = () => defaultStore.get(globalDraggingAtom)

export const setGlobalDragging = (value: boolean) => {
  defaultStore.set(globalDraggingAtom, value)
}

export const Global = {
  values: {
    draggingDetails: undefined as any
  },
  metaOps: {} as any,
  layoutOps: {} as any,
  utils: {
    normalizeDragEvent: async (event: any) => ({ event }),
    getTypeName: (type?: string) => (type === undefined ? '' : String(type))
  } as any,
  commonOps: {} as any,
  goBackOps: {} as any,
  addEventListener: (event: string, listener: Listener) => {
    const set = listeners.get(event) ?? new Set()
    set.add(listener)
    listeners.set(event, set)
  },
  removeEventListener: (event: string, listener: Listener) => {
    listeners.get(event)?.delete(listener)
  },
  emitEvent: (event: string, payload?: any) => {
    listeners.get(event)?.forEach(fn => fn(payload))
  }
}

export type GlobalType = typeof Global
