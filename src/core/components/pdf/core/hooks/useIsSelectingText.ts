import { atom, useAtom } from 'jotai'
import { Point } from '~/typings'

const isSelectingTextAtom = atom<{
  isSelecting: boolean
  startPage?: number
  startPagePoint?: Point
  endPagePoint?: Point
  endPage?: number
  emptyAll: number
}>({
  isSelecting: false,
  emptyAll: 0
})

const useSelectingText = () => useAtom(isSelectingTextAtom)

export default useSelectingText
