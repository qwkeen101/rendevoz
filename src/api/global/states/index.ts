import { atom } from 'jotai'
import { globalStore } from '@/api/stores'
import { useGlobalAtomValue } from '@/hooks'

type IGlobalStates = {
  loading: {
    currentState?: 'initializing' | 'loading remote data' | 'recovering from backup' | 'indexing data'
  }
  initialized: boolean
  remoteDataFetched: boolean
}

const GlobalStates = {
  loading: atom<IGlobalStates['loading']>({}),
  initialized: atom<IGlobalStates['initialized']>(false),
  remoteDataFetched: atom<IGlobalStates['remoteDataFetched']>(false),
  useValue: <K extends keyof IGlobalStates>(a: K): IGlobalStates[K] => {
    return useGlobalAtomValue(GlobalStates[a])
  },
  setState: <K extends keyof IGlobalStates, V extends IGlobalStates[K]>(a: K, updater: ((curr: V) => V) | V) => {
    const v = globalStore.get(GlobalStates[a])
    const next = typeof updater === 'function' ? updater(v) : updater
    globalStore.set(GlobalStates[a], next)
  },
  getValue: <K extends keyof IGlobalStates>(a: K): IGlobalStates[K] => {
    return globalStore.get(GlobalStates[a])
  }
}

export default GlobalStates
