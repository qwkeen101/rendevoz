import { Patch } from 'immer'
import { WhiteboardDropPayload, WhiteboardPastePayload, WhiteboardSelection, WhiteboardState, WhiteboardToolbarContext, IWhiteboardOutline } from './whiteboard'
import { Box, XYPosition } from './geometry'
import { IWhiteboard, IWhiteboardEdge, IWhiteboardNode } from './whiteboard'

export type IWhiteboardTransform = { x: number; y: number; scale: number }

export type INodeInnerState = Partial<{
  selected: boolean
  focused: boolean
  isDragging: boolean
  name?: string
}>

export type IEdgeOverlayState = {
  isAdding?: boolean
  currentEdgeId?: number
  targetNodeId?: number
  sourceNodeId?: number
  targetPosition?: ReturnType<typeof getEdgePosition>
  sourcePosition?: ReturnType<typeof getEdgePosition>
  currentMousePosition?: XYPosition
  isReposition?: boolean
  repositionDirection?: 'source' | 'target'
}

const getEdgePosition = () => 'left' as const

export type WhiteboardEvent =
  | {
    type: 'drop'
    payload: WhiteboardDropPayload
  }
  | {
    type: 'nodeResized'
    resized: IWhiteboardNode[]
  }
  | {
    type: 'closeToolbar'
  }
  | {
    type: 'nodeDragStart'
    draggingNode: IWhiteboardNode
  }
  | {
    type: 'nodeDrag'
    draggingNode: IWhiteboardNode
    nodeElement?: HTMLElement
    ignoreSnap?: boolean
    delta: XYPosition
  }
  | {
    type: 'nodeResize'
    pointerBox: Box
    resizingNode: IWhiteboardNode
    nodeElement?: HTMLElement
    resizeDir: 'top' | 'bottom' | 'left' | 'right'
    ignoreSnap?: boolean
    realtimeBox: Box
  }
  | {
    type: 'nodeResizeEnd'
  }
  | {
    type: 'nodeDragEnd'
    draggingNode: IWhiteboardNode
  }
  | {
    type: 'nodeResizeStart'
    resizingNode: IWhiteboardNode
  }
  | {
    type: 'nodeSizeChange'
    changed: IWhiteboardNode[]
  }
  | {
    type: 'nodeDeleted'
    deleted: number[]
  }
  | {
    type: 'whiteboardUpdated'
    updated: IWhiteboardNode[]
    withUndo: boolean
  }
  | {
    type: 'nodeClick'
    node: IWhiteboardNode
  }
  | {
    type: 'panChange'
  }
  | {
    type: 'zoomChange'
  }
  | {
    type: 'keydown'
    e: KeyboardEvent
  }
  | {
    type: 'keyup'
    e: KeyboardEvent
  }
  | {
    type: 'pointerdown'
    e: PointerEvent
  }
  | {
    type: 'pointermove'
    e: PointerEvent
  }
  | {
    type: 'pointerup'
    e: PointerEvent
  }
  | {
    type: 'dataContainerClick'
    e: MouseEvent
  }
  | {
    type: 'edgeAdded'
    edge: IWhiteboardEdge
  }
  | {
    type: 'viewportChange'
    viewport: IWhiteboardTransform
  }

export type WhiteboardHistoryOps = {
  pushUpdates?: (opts: { patches: Patch[]; inversePatches: Patch[] }) => void
  _pushInternal?: (opts: { patches: Patch[]; inversePatches: Patch[] }) => void
  undo?: () => void
  redo?: () => void
  canUndo?: () => boolean
  canRedo?: () => boolean
}

export type WhiteboardLayoutOps = {
  packNodes?: (nodes?: IWhiteboardNode[]) => void
  align?: (type: string, nodes: IWhiteboardNode[]) => void
  distributeSpacing?: (direction: 'horizontal' | 'vertical', nodes?: IWhiteboardNode[]) => void
}

export type WhiteboardClipboardOps = {
  copy?: (selection: WhiteboardSelection) => void
  paste?: (payload?: WhiteboardPastePayload) => void
  cut?: (selection: WhiteboardSelection) => void
}

export type WhiteboardToolbarOps = {
  openContextMenuToolbar?: (pos: XYPosition) => void
  closeToolbar?: () => void
  setToolbar?: (ctx: WhiteboardToolbarContext) => void
}

export type WhiteboardNodeOps = {
  selectNode?: (id: number) => void
  deselectAll?: () => void
  hitTest?: (point: { x: number; y: number }) => IWhiteboardNode | undefined
  open?: (id: number, mode?: 'newTab' | 'sidePeek') => void
  expand?: (id: number) => void
  canExpand?: (node: IWhiteboardNode) => boolean
  updateAfterZ?: (id: number) => void
  updateRelatedEdges?: (ids: number[]) => void
  deleteNodes?: (ids: number[] | number) => void
  getMaxZindex?: () => number
  extendNodes?: (nodes: number[] | IWhiteboardNode[] | number | IWhiteboardNode) => IWhiteboardNode[]
  intersectWith?: (id: number, box: Box) => boolean
  fitContent?: (ids: number[] | number) => void
  getNodeFuncs?: (id: number) => any
  getNodeDOM?: (id: number) => HTMLElement | null
  getDOMBoxOfNodes?: (ids: number[]) => Box | null
}

export type WhiteboardEdgeOps = {
  addEdge?: (sourceId: number, targetId: number, overrides?: Partial<IWhiteboardEdge>) => void
  deleteEdge?: (id: number) => void
  updateEdge?: (
    id: number,
    updater:
      | Partial<IWhiteboardEdge>
      | ((origin: IWhiteboardEdge) => IWhiteboardEdge | (IWhiteboardEdge & Partial<Pick<IWhiteboardEdge, 'tempTarget'>>)),
    withUndo?: boolean
  ) => void
}

export type WhiteboardCoordOps = {
  transformWhiteboardRectToWindowRect?: (rect: Box) => Box | undefined
  transformWhiteboardPositionToWindowPosition?: (pos: XYPosition) => XYPosition | undefined
  transformWindowPositionToPosition?: (pos: XYPosition) => XYPosition | undefined
  setTransform?: (transform: IWhiteboardTransform) => void
  getTransform?: () => IWhiteboardTransform
  getViewportBox?: () => Box | undefined
}

export type WhiteboardContainerOps = {
  fitToNode?: (id: number) => void
  fitToSelection?: () => void
  fitToViewBox?: (box: Box) => void
  fitTo?: (box: Box, opts?: { changeScale?: boolean; maxScale?: number; skipAnimation?: boolean }) => void
  getViewBox?: () => Box | undefined
  getInViewNodes?: (fullyInView?: boolean) => IWhiteboardNode[]
  setTransform?: (transform: IWhiteboardTransform, skipAnimation?: boolean) => void
  moveBy?: (x: number, y: number) => void
}

export type WhiteboardGroupOps = {
  getParentGroupsOfNode?: (nodeId: number, mindmapChildUseRoot?: boolean) => IWhiteboardNode[]
  getNodesInGroup?: (groupId: number, includeSelf?: boolean, mindmapChildUseRoot?: boolean) => IWhiteboardNode[]
  groupNodes?: (nodeIds: number[] | number) => void
}

export type WhiteboardMindmapOps = {
  updateMindmapEdges?: (nodeId: number) => void
  expandMindmap?: (node: IWhiteboardNode & { type: 'mindmap' }) => IWhiteboardNode[]
}

export type WhiteboardContentOps = {
  transformToOutline?: () => Record<string, IWhiteboardOutline[]> | undefined
}

export type IWhiteboardInstance = {
  values: {
    id?: number
    isFocused?: boolean
    copiedElements?: unknown[]
    store?: unknown
    ID_TO_NODE_MAP?: Map<number, IWhiteboardNode>
    ID_TO_EDGE_MAP?: Map<number, IWhiteboardEdge>
    NODE_TO_EDGE_MAP?: Map<number, Set<number>>
    NODE_DOM_MAP?: Map<number, HTMLElement>
  }
  historyOps?: WhiteboardHistoryOps
  layoutOps?: WhiteboardLayoutOps
  selectOps?: {
    getSelection?: () => WhiteboardSelection
    setSelection?: (sel: WhiteboardSelection) => void
    selectNode?: (id: number, append?: boolean) => void
    selectEdge?: (id: number, append?: boolean) => void
    clear?: () => void
    resetSelectionBox?: () => void
    getSelectedNodes?: () => number[]
    getSelectedEdges?: () => number[]
  }
  clipboardOps?: WhiteboardClipboardOps
  toolbarOps?: WhiteboardToolbarOps
  nodeOps?: WhiteboardNodeOps
  edgeOps?: WhiteboardEdgeOps
  coordOps?: WhiteboardCoordOps
  containerOps?: WhiteboardContainerOps
  groupOps?: WhiteboardGroupOps
  mindmapOps?: WhiteboardMindmapOps
  contentOps?: WhiteboardContentOps
  getOutestContainerNode?: () => HTMLElement | null | undefined
  emit?: (event: WhiteboardEvent) => void
  addEventListener?: (type: WhiteboardEvent['type'], listener: (event: WhiteboardEvent) => void) => void
  removeEventListener?: (type: WhiteboardEvent['type'], listener: (event: WhiteboardEvent) => void) => void
  updateWhiteboard?: (updater: (draft: IWhiteboard) => void, withUndo?: boolean) => Promise<void>
  insertNode?: (node: Partial<IWhiteboardNode> | Partial<IWhiteboardNode>[], withUndo?: boolean) => Promise<IWhiteboardNode[] | void>
  getNode?: (id: number) => IWhiteboardNode | undefined
  getEdge?: (id: number) => IWhiteboardEdge | undefined
  getAllNode?: () => IWhiteboardNode[]
  getAllEdge?: () => IWhiteboardEdge[]
  setFocused?: (focused: boolean) => void
  isFocused?: (includeInner?: boolean) => boolean
  setState?: (updater: (state: WhiteboardState) => WhiteboardState) => void
  getState?: () => WhiteboardState
}
