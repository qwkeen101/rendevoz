import { atomWithStorage } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks'
import { globalStore } from '@/api/stores'

export const sidebarStateAtom = atomWithStorage('sidebarState', {
  leftOpen: false,
  leftWidth: 300,
  leftVisible: 'application'
})
export default () => {
  return useGlobalAtomValue(sidebarStateAtom)
}

export const getSidebarState = () => {
  return globalStore.get(sidebarStateAtom)
}