import { atom, useAtom } from 'jotai'
import { Box } from '~/typings'

export const GroupStateAtom = atom<{
  isSelecting: boolean
  unToggledValueCount: number
  selectedCount: number
}>({
  isSelecting: false,
  unToggledValueCount: 0,
  selectedCount: 0
})

const useGroupState = () => useAtom(GroupStateAtom)

export default useGroupState
