import { atom } from 'jotai'
import { globalStore, ObjectStore } from '@/api/stores'
import { useSelectGlobalAtomValue } from '@/hooks'

export const urlToIdMap = atom(new Map<string, number>())
const subs = new Set<string>()
const processAtom = async (type: 'video' | 'audio' | 'tweet' | 'webpage') => {
  const store = ObjectStore(type)
  const all = await store.fetchAll()
  const map = new Map(globalStore.get(urlToIdMap))
  all.forEach(i => {
    if ('url' in i && i.url) {
      map.set(i.url, i.id)
    }
  })
  globalStore.set(urlToIdMap, map)
  if (!subs.has(type)) {
    subs.add(type)
    globalStore.sub(store.objectMapAtom, () => {
      const v = globalStore.get(store.objectMapAtom)
      const m = new Map(globalStore.get(urlToIdMap))
      Array.from(v.values()).forEach(i => {
        if ('url' in i && i.url) {
          if (m.has(i.url)) {
            if (type === 'webpage') {
              m.set(i.url, i.id)
              return
            }
          }
          m.set(i.url, i.id)
        }
      })
      globalStore.set(urlToIdMap, m)
    })
  }
}

export const processURLIndex = async () => {
  globalStore.set(urlToIdMap, new Map())
  await processAtom('video')
  await processAtom('audio')
  await processAtom('tweet')
  await processAtom('webpage')
}

export default function useURLToId(url?: string, maybeId?: number) {
  const m = useSelectGlobalAtomValue(urlToIdMap, s => s.get(url || ''), [url])
  return url ? m || maybeId : maybeId
}
