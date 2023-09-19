import { atom } from 'jotai'
import { useDb, useSelectGlobalAtomValue } from '@/hooks'
import { initializeLocalStore } from '@/stores/base.store'
import { globalStore } from '@/stores/index'
import { useEffect } from 'react'

export type CurrentKeyValues = {
  currentWorkspace: string
  allWorkspaces: {
    name: string
    createdAt: number
  }[]
}
const keyvalueAtom = atom<Map<string, any>>(new Map())

const createKeyvalueStore = () => {
  const keyvalueDb = useDb('keypairs')
  return {
    getAll: async () => {
      const map = new Map(globalStore.get(keyvalueAtom))
      keyvalueDb.each((obj, key) => {
        map.set(key.key, obj)
      })
      globalStore.set(keyvalueAtom, map)
    },
    updateOne: <T extends keyof CurrentKeyValues>(key: T, value: CurrentKeyValues[T]) => {
      const map = new Map(globalStore.get(keyvalueAtom))
      const newValue = value
      map.set(key, newValue)
      globalStore.set(keyvalueAtom, map)
      keyvalueDb.put(newValue, key)
    },
    useValue: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      const v = useSelectGlobalAtomValue(keyvalueAtom, s => s.get(key))
      useEffect(() => {
        if (!v) {
          keyvalueDb.get(key).then(one => {
            console.log(one)
            const newMap = new Map(globalStore.get(keyvalueAtom))
            newMap.set(key, one)
            globalStore.set(keyvalueAtom, newMap)
          })
        }
      }, [v])
      return v
    }
  }
}

const KeyvalueStore = createKeyvalueStore()
export default KeyvalueStore
