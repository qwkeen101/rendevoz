import { atom } from 'jotai'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
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
    const cache = {
      current: new Set<string>()
    }
    globalStore.sub(store.objectMapAtom, () => {
      const v = globalStore.get(store.objectMapAtom)
      const m = new Map(globalStore.get(urlToIdMap))
      const prev = cache.current
      const now = new Set<string>()
      Array.from(v.values()).forEach(i => {
        if ('url' in i && i.url) {
          prev.delete(i.url)
          now.add(i.url)
          if (m.has(i.url)) {
            if (type === 'webpage') {
              m.set(i.url, i.id)
              return
            }
          }
          m.set(i.url, i.id)
        }
      })
      if (prev.size) {
        Array.from(prev.values()).forEach(url => {
          m.delete(url)
        })
      }
      cache.current = now
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
export const getMetaObjectByURL = (url: string) => {
  const o = globalStore.get(urlToIdMap).get(url)
  if (o) {
    const meta = MetaStore.getMetaObjectByObjectId(o)
    if (meta) {
      return meta
    }
  }
}
export default function useURLToId(url?: string, maybeId?: number) {
  const m = useSelectGlobalAtomValue(urlToIdMap, s => s.get(url || ''), [url])
  return url ? m || maybeId : maybeId
}
