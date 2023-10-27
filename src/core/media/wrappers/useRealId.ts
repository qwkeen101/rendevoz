import { atom } from 'jotai'
import { globalStore, ObjectStore } from '@/stores'
import { useSelectGlobalAtomValue } from '@/hooks'

export const urlToAudioMapAtom = atom(new Map<string, number>())
export const urlToVideoMapAtom = atom(new Map<string, number>())

document.addEventListener('DOMContentLoaded', () => {
  ObjectStore('video').getAll()
  ObjectStore('audio').getAll()
  globalStore.sub(ObjectStore('video').objectMapAtom, () => {
    const v = globalStore.get(ObjectStore('video').objectMapAtom)
    const m = new Map(Array.from(v.values()).map(i => [i.url, i.id]))
    globalStore.set(urlToVideoMapAtom, m)
  })
  globalStore.sub(ObjectStore('audio').objectMapAtom, () => {
    const v = globalStore.get(ObjectStore('audio').objectMapAtom)
    const m = new Map(Array.from(v.values()).map(i => [i.url, i.id]))
    globalStore.set(urlToAudioMapAtom, m)
  })
})
export default (type: 'audio' | 'video', url?: string, maybeId?: number) => {
  const m = useSelectGlobalAtomValue(type === 'video' ? urlToVideoMapAtom : urlToAudioMapAtom, s => s.get(url || ''), [url])
  return m || maybeId
}
