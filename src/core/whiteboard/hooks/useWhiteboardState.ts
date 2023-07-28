import { atom, useAtom } from 'jotai'

type IWhiteboardState = {
  zoom: number
  dragMode: 'select' | 'drag'
}
export const WhiteboardStateAtom = atom<IWhiteboardState>({
  zoom: 1,
  dragMode: 'drag'
})

export const useWhiteboardState = () => useAtom(WhiteboardStateAtom)
