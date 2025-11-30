import { useAtomValue } from 'jotai/react'
import {
  WhiteboardAtom,
  WhiteboardInstanceAtom,
  WhiteboardStateAtom,
  WhiteboardSelectionAtom,
  useSelectWhiteboardState,
  useSelectWhiteboardValue
} from './core/store'
import { WhiteboardState } from './types/whiteboard'
import { IWhiteboard, IWhiteboardInstance, WhiteboardSelection } from './types'

export const useWhiteboardInstance = (): IWhiteboardInstance => useAtomValue(WhiteboardInstanceAtom)
export const useWhiteboard = (): IWhiteboard => useAtomValue(WhiteboardAtom)
export const useWhiteboardState = (): WhiteboardState => useAtomValue(WhiteboardStateAtom)
export const useSelectWhiteboard = useSelectWhiteboardValue
export const useSelectWhiteboardStateSlice = useSelectWhiteboardState
export const useWhiteboardSelection = (): WhiteboardSelection => useAtomValue(WhiteboardSelectionAtom)
