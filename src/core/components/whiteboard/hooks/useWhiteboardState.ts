import { atom, useAtom } from 'jotai'
import { Colors } from '@/consts'
import { IPenStyle } from '@/core/components/whiteboard/toolbars/WhiteboardToolsBar'

type IWhiteboardState = {
  zoom: number
  dragMode: 'select' | 'drag'
  freeDrawing: boolean
  // pan with space button or middle button
  isPanning: boolean
  isSelecting: boolean
  currentTool?: 'erase' | 'freehand'
  openMinimap?: boolean
  erasing: boolean
  // pointer mode maybe different from toolbar pointer mode, because it can be changed by shortcuts
  pointerMode?: 'pan' | 'select'
  toolbarPointerMode?: 'pan' | 'select'
  freeHandConfig: {
    type: 'pen' | 'marker' | 'ballpen'
    color: string
    style?: IPenStyle
  }
}
export const WhiteboardStateAtom = atom<IWhiteboardState>({
  zoom: 1,
  dragMode: 'drag',
  freeDrawing: false,
  toolbarPointerMode: 'select',
  pointerMode: 'select',
  erasing: false,
  isPanning: false,
  isSelecting: false,
  freeHandConfig: {
    type: 'ballpen',
    color: Colors.Font.Primary
  }
})

export const useWhiteboardState = () => useAtom(WhiteboardStateAtom)
