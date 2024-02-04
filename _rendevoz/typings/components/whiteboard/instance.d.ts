import {
  Box,
  EdgePosition,
  IEventEmitter,
  IWhiteboard,
  IWhiteboardAlignment,
  IWhiteboardEdge,
  IWhiteboardLayout,
  IWhiteboardNode,
  PartialWithId,
  XYPosition,
  IWhiteboardOutline
} from '~/typings'
import { CSSProperties, Dispatch, SetStateAction } from 'react'

export type IWhiteboardToolbarState = {
  // originX and originY is whiteboard coord, for scroll and move
  originX?: number
  originY?: number
  visible?: boolean
} & (
  | {
      type?: 'select'
    }
  | {
      type: 'edge'
      edgeId: number
    }
  | {
      type?: 'node'
      node: IWhiteboardNode
      openBy?: 'click' | 'contextMenu'
    }
  | {
      type: 'contextMenu'
    }
)

export type IWhiteboardTransform = { x: number; y: number; scale: number }

export type INodeInnerState = Partial<{
  popoverVisible: boolean
  expanded: boolean
  selected: boolean
  focused: boolean
  isEditingName: boolean
  locked: boolean
  keepRatioResize: boolean
  isDragging: boolean
  isUpdatingName: boolean
}>
export type IEdgeOverlayState = {
  isAdding?: boolean
  currentEdgeId?: number
  targetNodeId?: number
  sourceNodeId?: number
  targetPosition?: EdgePosition
  sourcePosition?: EdgePosition
  currentMousePosition?: XYPosition
  isReposition?: boolean
  repositionDirection?: 'source' | 'target'
}

export type IWhiteboardRightbarState = {
  visible: boolean
  // content is opened in sidebar
  active?: 'outline' | 'content'
  width: string
  currentTab?: {
    type: string
    objectId: number
  }
}

export type ISetNodeInnerState = Dispatch<SetStateAction<INodeInnerState>>
export type INodeInnerFuncs = {
  // realtime box when being dragged / resized
  getRealtimeBox: () => Box | undefined
  select: VoidFunction
  deselect: VoidFunction
  setStyle: (newStyle: CSSProperties) => void
  getNodeState: () => INodeInnerState
  sizeAlreadyDefined: () => boolean
  // update node box when multi resizing node
  updateNodeBox: (newBox: Box) => void
  getNodeDOM: () => HTMLElement
  setNodeState: Dispatch<SetStateAction<INodeInnerState>>
}
export type IEdgeInnerFuncs = {
  edit: VoidFunction
  drawPath: VoidFunction
}

export type IWhiteboardInstance = Partial<{
  openTabInSidebar?: (type: string, objectId?: number) => void
  getNode: (nodeId: number) => IWhiteboardNode
  getAllNode: () => IWhiteboardNode[]
  getAllEdge: () => IWhiteboardEdge[]
  getEdge: (edgeId: number) => IWhiteboardEdge
  deleteNode: (nodeId: number) => void
  deleteEdge: (edgeId: number) => void
  deleteNodes: (nodeIds: number[]) => void
  insertMetasAtPointer: (e: PointerEvent, metas: number[]) => void
  updateWhiteboard: (updater: (curr: IWhiteboard) => void, withUndo?: boolean) => Promise<void>
  insertNode: (node: Partial<IWhiteboardNode> | Partial<IWhiteboardNode>[]) => Promise<IWhiteboardNode[]>
  getContainerNode: () => HTMLElement
  getOutestContainerNode: () => HTMLElement | null | undefined
  buildNodeToEdgeIndex: VoidFunction
  getTransform: () => {
    x: number
    y: number
    scale: number
  }
  isFocused: () => boolean
  edgeOps: {
    endAction: VoidFunction
    getEdgeFuncs: (edgeId: number) => IEdgeInnerFuncs | undefined
    insertEdge: (e: Partial<IWhiteboardEdge>) => void
    startDrawEdge: (sourceNodeId: number) => void
    repositionEdge: (edgeId: number, direction: 'source' | 'target', mousePos: XYPosition) => void
    getEdgeOverlayState: () => IEdgeOverlayState
    setEdgeOverlayState: Dispatch<SetStateAction<IEdgeOverlayState>>
    hasEdge: (sourceNodeId: number, sourcePosition: EdgePosition, targetNodeId: number, targetPosition: EdgePosition) => boolean
  }
  sidebarOps: {
    openRightBar: (active?: IWhiteboardRightbarState['active']) => void
    closeRightBar: VoidFunction
    openNodeAtSidebar: (nodeId: number) => void
  }
  containerOps: {
    getViewBox: () => Box
    fitToNode: (nodeId: number) => void
    getInViewNodes: (fullyInView?: boolean) => IWhiteboardNode[]
    zoomTo: () => void
    // fit container to box
    fitTo: (
      box: Box,
      opts?: {
        changeScale?: boolean
        maxScale?: number
      }
    ) => void
    fitToSelected: VoidFunction
    setTransform: (t: { x: number; y: number; scale: number }) => void
    undoTransform: VoidFunction
    redoTransform: VoidFunction
  }
  floatOps: {
    openNode: (nodeId: number) => void
  }
  contentOps: {
    transformToOutline: () => IWhiteboardOutline[]
  }
  nodeOps: {
    getMaxZindex: () => number
    updateAfterZ: (currentNodeId: number) => void
    // return related nodes
    highlightRelatedEdgesAndNodes: (nodeId: number | number[]) => IWhiteboardNode[]
    getNodeFuncs: (nodeId: number) => INodeInnerFuncs | undefined
    deleteNode: (nodeId: number | number[], redo?: boolean) => void
    getNodeDOM: (nodeId: number) => HTMLElement
    fitContent: (nodeId: number | number[]) => void
    copy: (nodeId: number | number[]) => void
    // extend nodes like node inside group
    extendNodes: (currentNodes: number | number[] | IWhiteboardNode | IWhiteboardNode[]) => IWhiteboardNode[]
    paste: (position: XYPosition) => void
    // check if node intersect with another box
    intersectWith: (nodeId: number, box: Box) => boolean
    updateRelatedEdges: (nodeId: number | number[]) => void
    expand: (nodeId: number | number[]) => void
    fold: (nodeId: number | number[]) => void
    canExpand: (node: IWhiteboardNode) => node is IWhiteboardNode & { type: 'metaObject' }
    canOpenInSidePeekOrCenter: (nodeId: number) => boolean
    open: (nodeId: number, type: 'center' | 'sidePeek' | 'newTab' | 'float') => void
  }
  updateEdge: (
    obj: PartialWithId<IWhiteboardEdge> | number,
    updater?: (curr: IWhiteboardEdge) => IWhiteboardEdge,
    withUndo?: boolean
  ) => Promise<void>
  updateNode: (
    obj: PartialWithId<IWhiteboardNode> | number,
    updater?: (curr: IWhiteboardNode) => IWhiteboardNode,
    withUndo?: boolean
  ) => Promise<void>
  // default spacing is 15, maybe to small?
  layoutOps: {
    alignNodes: (nodes: IWhiteboardNode[], alignment: IWhiteboardAlignment) => void
    layoutNodes: (nodes: IWhiteboardNode[], layout: IWhiteboardLayout, spacing?: number) => void
    packNodes: (nodes: IWhiteboardNode[], spacing?: number) => void
  }
  coordOps: {
    transformWindowPositionToPosition: (winPosition: XYPosition) => XYPosition
    transformWhiteboardPositionToWindowPosition: (position: XYPosition) => XYPosition
  }
  toolbarOps: {
    getToolbarState: () => IWhiteboardToolbarState
    closeToolbar: VoidFunction
    // pos are all whiteboard coord
    openNodeToolbar: (nodeId: number, position: XYPosition, openBy?: 'click' | 'contextMenu') => void
    openSelectToolbar: (position: XYPosition) => void
    openEdgeToolbar: (edgeId: number, position: XYPosition) => void
    openContextMenuToolbar: (position: XYPosition) => void
  }
  groupOps: {
    // fit into view and rename
    renameGroup: (groupNodeId: number) => void
    getParentGroupsOfNode: (nodeId: number) => IWhiteboardNode[]
    getNodesInGroup: (groupNodeId: number, includeSelf?: boolean) => IWhiteboardNode[]
    groupNodes: (nodeId: number | number[]) => void
  }
  groupNodes: (nodes: IWhiteboardNode[]) => void
  selectOps: {
    // reset selection box after align or distribute spacing
    resetSelectionBox: VoidFunction
    getSelectedNodes: () => IWhiteboardNode[]
    selectNode: (nodeId: number | number[], setState?: boolean) => void
    deselectNode: (nodeId: number | number[]) => void
    hasSelectedNodes: () => boolean
    // remove pointer draw selection box, but do not deselect all
    removeSelectionBox: VoidFunction
    // remove selection box, and deselect all nodes
    deselectAll: (skip?: number | number[]) => void
    isSelecting: () => boolean
  }
}> & {
  eventEmitter: IEventEmitter
  values: {
    id?: number
    // need this to prevent resizeobserver update height loop.
    isResizingSelectionBox?: boolean
    currentDraggingNodeId?: number
    copiedElements: IWhiteboardNode[]
    transformHistory: {
      redos: IWhiteboardTransform[]
      undos: IWhiteboardTransform[]
    }
    // select box when use pointer
    selectBox?: Box
    // inner node to related edge set map
    NODE_TO_EDGE_MAP: Map<number, Set<number>>
    // inner edge id to function map
    ID_TO_EDGE_MAP: Map<number, IEdgeInnerFuncs>
    // inner node id to function map
    ID_TO_NODE_MAP: Map<number, INodeInnerFuncs>
  }
}
