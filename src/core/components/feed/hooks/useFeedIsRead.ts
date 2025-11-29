import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { selectAtom } from 'jotai/utils'
import { useLocation } from 'react-router-dom'

const atomRef: {
  current?: any
} = {}
export default (feedItemId: number) => {
  if (!atomRef.current) {
    const selected = selectAtom(KeyvalueStore.atom, s => s.get('feedData'))
    atomRef.current = atom(get => {
      const h = get(selected)?.history ?? []
      return new Set<number>(h.map(i => i.id))
    })
  }
  const a = atomRef.current
  const location = useLocation()
  const v = useAtomValue(a)
  if (location.pathname.startsWith('/feed/history')) {
    return false
  }
  return v.has(feedItemId)
}
