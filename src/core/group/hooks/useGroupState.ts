import { atom, useAtom } from 'jotai'
import { Box } from '~/typings'

export const GroupStateAtom = atom<{
  isSelecting: boolean
  unToggledValueCount: number
  selectedCount: number
  unToggledSelectedCount: number
  triggered: number
}>({
  isSelecting: false,
  unToggledValueCount: 0,
  selectedCount: 0,
  triggered: 0,
  unToggledSelectedCount: 0
})

const useGroupState = () => useAtom(GroupStateAtom)

export default useGroupState
