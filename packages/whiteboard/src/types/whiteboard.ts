import { Descendant } from 'slate'
import type { ReactNode, MouseEvent } from 'react'
import { WhiteboardAdapter } from '../adapters/types'
import { Box, PartialWithId, XYPosition } from './geometry'

export type EdgePosition = 'top' | 'right' | 'left' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type SnapMode = 'center-4' | 'center-8' | 'edge' | 'mixed-4' | 'mixed-8'

// [x, y, pressure]
export type FreehandPoint = [number, number, number]

export type IPenStyle = {
  width: number
  opacity: number
  color: string
}

type MultiplePenStyles = {
  first: IPenStyle
  second: IPenStyle
  third: IPenStyle
}

export type IWhiteboardEdge = {
  id: number
  sourceId: number
  targetId: number
  sourcePosition?: EdgePosition
  targetPosition?: EdgePosition
  tempTarget?: { x: number; y: number }
  metaLinkId?: number
  label?: string
  color?: string
  lineType?: 'straight' | 'polyline' | 'curve' | 'tightCurve'
  lineStyle?: 'straight' | 'regular' | 'thick' | 'dash' | 'animatedDash'
  marker?: 'arrow' | 'none'
}

export type WhiteboardEdgeStyle = {
  color?: string
  width?: number
  lineStyle?: 'regular' | 'dash' | 'animatedDash'
  marker?: 'arrow' | 'none'
}

export type IWhiteboardMindmap = {
  root: number
  label?: string
  children: IWhiteboardMindmap[]
}

export type IWhiteboardNode = {
  id: number
  x: number
  y: number
  name?: string
  background?: string
  width?: number
  height?: number
  resized?: boolean
  widthResized?: boolean
  collapse?: number | false
  fixedExpanded?: boolean
  borderType?: 'rect' | 'roundRect' | 'round' | 'underline'
  border?: string
  collapseChildren?: boolean
  rootId?: number
  side?: 'left' | 'right'
  z: number
  expanded?: boolean
} & (
    | {
      type: 'metaObject'
      metaObjectId: number
    }
    | {
      type: 'image'
      imageUrl: string
    }
    | {
      type: 'mindmap'
      nodeType?: IWhiteboardNode['type']
      rightChildren?: IWhiteboardMindmap[]
      leftChildren?: IWhiteboardMindmap[]
      rightCollapse?: boolean
      leftCollapse?: boolean
      edgeColor?: string
      edgeType?: IWhiteboardEdge['lineType']
    }
    | {
      type: 'group'
    }
    | {
      type: 'text'
      fontSize?: 'middle' | 'large' | 'small' | 'super large'
      content: Descendant[]
    }
    | {
      type: 'freehand'
      points: FreehandPoint[] | FreehandPoint[][]
      strokeWidth?: number
      opacity?: number
      fillColor?: string
      penType: 'pen' | 'ballpen' | 'marker'
      mode: 'pencil' | 'marker' | 'dash'
      style?: IPenStyle
    }
  )

export type IWhiteboardAlignment = 'left' | 'top' | 'right' | 'bottom' | 'horizontallyCenter' | 'verticallyCenter'
export type IWhiteboardLayout = 'horizontallySpacing' | 'verticallySpacing' | 'auto' | 'byType'

export type IWhiteboardOutline = {
  nodeId: number
  name: string
  icon?: string
  children?: IWhiteboardOutline[]
  type: string | 'whiteboard mindmap' | 'whiteboard group' | 'whiteboard text'
}

export type IWhiteboard = {
  id?: number
  name?: string
  nodes?: Map<number, IWhiteboardNode>
  edges?: Map<number, IWhiteboardEdge>
  color?: string
  icon?: string
  backgroundType?: 'dot' | 'line' | 'none'
  lineType?: 'straight' | 'polyline' | 'curve'
  hideObjects?: boolean
  lastViewport?: {
    x: number
    y: number
    scale: number
  }
  penStyles?: {
    ballpen: MultiplePenStyles
    pen: MultiplePenStyles
    marker: MultiplePenStyles
  }
}

export type WhiteboardState = {
  zoom: number
  readOnly?: boolean
  dragMode: 'select' | 'drag'
  freeDrawing: boolean
  isPanning: boolean
  isSelecting: boolean
  isDraggingNode: boolean
  currentTool?: 'erase' | 'freehand'
  isErasing: boolean
  loaded: boolean
  history?: {
    undoSteps: number
    redoSteps: number
  }
  edgeSnapRadius?: number
  edgeSnapPrefer?: 'auto' | 'horizontal' | 'vertical'
  edgeHandleOffset?: number
  edgeStyleResolver?: (edge: IWhiteboardEdge) => WhiteboardEdgeStyle | undefined
  nodeRenderers?: NodeRendererRegistry
  erasedNodes?: Set<number>
  highlightedIds?: {
    currentFocusCenterNodeId: number[]
    nodeIds: Set<number>
    edgeIds: Set<number>
  }
  pointerMode?: 'pan' | 'select'
  toolbarPointerMode?: 'pan' | 'select'
  freeHandConfig: {
    type: 'pen' | 'marker' | 'ballpen'
    color: string
    style?: IPenStyle
  }
  layout?: {
    showRename?: boolean
    showControlBar?: boolean
    showPencilToolbar?: boolean
    showLeftToolbar?: boolean
    showObjectSidebar?: boolean
    showSetting?: boolean
    showContents?: boolean
  }
  state?: {
    enableClickNodeWhenPanning?: boolean
  }
  name?: string
  lastViewport?: {
    x: number
    y: number
    scale: number
  }
  snapMode?: SnapMode
  virtualization?: VirtualizationConfig
}

export type WhiteboardLayoutOptions = WhiteboardState['layout']

// Node renderer types
export type NodeRendererProps<T extends IWhiteboardNode = IWhiteboardNode> = {
  node: T
  selected: boolean
  instance: any // WhiteboardInstance (avoid circular import)
  onChange: (updates: Partial<T>) => void
  onClick?: (e: MouseEvent) => void
}

export type NodeRenderer<T extends IWhiteboardNode = IWhiteboardNode> = (props: NodeRendererProps<T>) => ReactNode

export type NodeRendererRegistry = {
  [K in IWhiteboardNode['type']]?:
  | NodeRenderer<Extract<IWhiteboardNode, { type: K }>>
  | NodeRendererWithConfig<Extract<IWhiteboardNode, { type: K }>>
}

// 节点渲染策略配置
export type NodeRenderConfig = {
  /**
   * 控制节点是否永不 unmount
   * - boolean: true 时永不 unmount，使用 display:none；false 时正常 unmount
   * - () => boolean: 动态判断，每次视口变化时调用
   * - () => Promise<boolean>: 异步判断，支持复杂逻辑（如检查资源加载状态）
   * 
   * 适用于重新挂载成本高的节点（iframe、video 等）
   */
  keepAlive?: boolean | (() => boolean) | (() => Promise<boolean>)

  /**
   * 在节点即将 unmount 前调用（纯副作用回调，不控制是否 unmount）
   * 常用于清理工作：暂停视频、保存状态、记录日志等
   */
  onBeforeUnmount?: (node: IWhiteboardNode, reason: 'viewport' | 'manual') => void

  /**
   * 节点从视口移出时的回调
   * 与 onBeforeUnmount 的区别：
   * - onLeaveViewport: 节点移出视口（可能仍被渲染，如 keepAlive=true）
   * - onBeforeUnmount: 节点即将从 DOM 卸载
   */
  onLeaveViewport?: (node: IWhiteboardNode) => void

  /**
   * 节点进入视口时的回调
   */
  onEnterViewport?: (node: IWhiteboardNode) => void
}

// 扩展 NodeRenderer 以支持配置
export type NodeRendererWithConfig<T extends IWhiteboardNode = IWhiteboardNode> = {
  render: NodeRenderer<T>
  config?: NodeRenderConfig
}

// 虚拟化配置
export type VirtualizationConfig = {
  enabled?: boolean  // 默认 true
  viewportPadding?: number  // 默认 0.2 (20%)
  alwaysRenderSelected?: boolean  // 默认 true
  debounceMs?: number  // 默认 16ms (~60fps)
}

export type WhiteboardProps = {
  value: IWhiteboard
  onChange?: (value: IWhiteboard) => void
  onPatch?: (patches: unknown[], inversePatches: unknown[]) => void
  readOnly?: boolean
  adapter?: WhiteboardAdapter
  name?: string
  state?: WhiteboardState['state']
  layout?: WhiteboardLayoutOptions
  edgeSnapRadius?: number
  snapMode?: SnapMode
  edgeSnapPrefer?: 'auto' | 'horizontal' | 'vertical'
  edgeHandleOffset?: number
  edgeStyleResolver?: (edge: IWhiteboardEdge) => WhiteboardEdgeStyle | undefined
  nodeRenderers?: NodeRendererRegistry
}

export type WhiteboardSelection = {
  nodes: Set<number>
  edges: Set<number>
}

export type WhiteboardViewport = {
  transform: { x: number; y: number; scale: number }
  container: Box
}

export type WhiteboardSearchResult = {
  nodeId: number
  score: number
  label?: string
  meta?: Record<string, unknown>
}

export type WhiteboardPastePayload =
  | { type: 'nodes'; nodes: PartialWithId<IWhiteboardNode>[] }
  | { type: 'edges'; edges: PartialWithId<IWhiteboardEdge>[] }
  | { type: 'mixed'; nodes: PartialWithId<IWhiteboardNode>[]; edges?: PartialWithId<IWhiteboardEdge>[] }

export type WhiteboardDropPayload =
  | {
    type: 'file'
    file: File
  }
  | {
    type: 'object'
    metaId: number | number[]
  }
  | {
    type: 'text'
    text: string
  }
  | {
    type: 'link'
    url: string
  }
  | {
    type: 'image'
    imageUrl: string
    name?: string
  }
  | {
    type: 'custom'
    data: unknown
  }

export type WhiteboardToolbarContext =
  | {
    type?: 'select'
    originX?: number
    originY?: number
  }
  | {
    type?: 'edge'
    edgeId: number
    originX?: number
    originY?: number
  }
  | {
    type?: 'node'
    node: IWhiteboardNode
    originX?: number
    originY?: number
    openBy?: 'click' | 'contextMenu'
  }
  | {
    type: 'contextMenu'
    originX?: number
    originY?: number
  }

export type WhiteboardClipboardContent = {
  nodes?: IWhiteboardNode[]
  edges?: IWhiteboardEdge[]
  metaIds?: number[]
}

export type WhiteboardExportOptions = {
  padding?: number
  background?: string
  area?: 'selection' | 'viewport' | 'all'
  filename?: string
}

export type WhiteboardSearchOptions = {
  query: string
  limit?: number
  signal?: AbortSignal
}

export type WhiteboardOutlineOptions = {
  nodes?: IWhiteboardNode[]
  edges?: IWhiteboardEdge[]
}
