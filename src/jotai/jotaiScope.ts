import { globalStore } from '@/stores'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

export const GlobalScope = Symbol('global')

export const GraphScope = Symbol('graph')

export const useGlobalAtom: typeof useAtom = (atom: Parameters<typeof useAtom>[0]) => useAtom(atom, { store: globalStore })

export const useGlobalAtomValue: typeof useAtomValue = (atom: Parameters<typeof useAtomValue>[0]) =>
  useAtomValue(atom, { store: globalStore })

export const useGlobalSetAtom: typeof useSetAtom = (atom: Parameters<typeof useSetAtom>[0]) => useSetAtom(atom, { store: globalStore })
