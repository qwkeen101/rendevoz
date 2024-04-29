import { atomWithStorage } from 'jotai/utils'
import { useGlobalAtom, useGlobalAtomValue } from '@/hooks'

export const sidebarStateAtom = atomWithStorage('sidebarState', {
  leftOpen: false,
  leftWidth: 240,
  leftVisible: 'database'
})
export default () => {
  return useGlobalAtomValue(sidebarStateAtom)
}
