import { atom, useAtom } from 'jotai'
import { Colors } from '@/consts'
import { IPenStyle } from '@/core/components/whiteboard/toolbars/WhiteboardToolsBar'
import { Transform } from 'panzoom'

type IWhiteboardState = {
  zoom: number
  dragMode: 'select' | 'drag'
  freeDrawing: boolean
  // pan with space button or middle button
  isPanning: boolean
  isSelecting: boolean
  isDraggingNode: boolean
  hasSelectedNodes: boolean
  panStartTransform?: Transform
  currentTool?: 'erase' | 'freehand'
  openMinimap?: boolean
  erasing: boolean
  highlightedIds?: {
    currentFocusCenterNodeId: number[]
    nodeIds: Set<number>
    edgeIds: Set<number>
  }
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
  isDraggingNode: false,
  erasing: false,
  isPanning: false,
  isSelecting: false,
  hasSelectedNodes: false,
  freeHandConfig: {
    type: 'ballpen',
    color: Colors.Font.Primary
  }
})

export const useWhiteboardState = () => useAtom(WhiteboardStateAtom)
