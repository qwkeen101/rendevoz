import { IBase } from '../../data/base'
import { ICollectionItem } from '../../data/collection'
import { IWhiteboardInstance } from '~/typings'

export type IWhiteboardEdge = {
  id: number
  sourceId: number
  targetId: number
  sourcePosition: EdgePosition
  targetPosition: EdgePosition
  metaLinkId?: number
  label?: string
  color?: string
  // tight curve: straight -> curve -> straight
  lineType?: 'straight' | 'polyline' | 'curve' | 'tightCurve'
  lineStyle?: 'straight' | 'regular' | 'thick' | 'dash' | 'animatedDash'
}

export type IWhiteboardProps = {
  id: number
  enableMiniMap?: boolean
  onInstanceInitialized?: (i: IWhiteboardInstance) => void
  readOnly?: boolean
  layout?: {
    showControlBar?: boolean
    showPencilToolbar?: boolean
    showLeftToolbar?: boolean
    showObjectSidebar?: boolean
    showSetting?: boolean
  }
}

export type EdgePosition = 'top' | 'right' | 'left' | 'bottom'
// [x,y,pressure]
export type FreehandPoint = [number, number, number]
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
  // collapse by node
  collapse?: number | false
  borderType?: 'rect' | 'roundRect' | 'round' | 'underline'
  // border color
  border?: string
  collapseChildren?: boolean
  // mindmap root id
  rootId?: number
  // mindmap side
  side?: 'left' | 'right'
  z: number
} & (
  | {
      type: 'metaObject'
      metaObjectId: number
      expanded?: boolean
    }
  | {
      type: 'image'
      imageUrl: string
    }
  | {
      type: 'video'
      videoUrl: string
    }
  | {
      type: 'mindmap'
      // default node type: 'text'
      nodeType?: IWhiteboardNode['type']
      rightChildren?: IWhiteboardMindmap[]
      leftChildren?: IWhiteboardMindmap[]
      rightCollapse?: boolean
      leftCollapse?: boolean
      edgeColor?: string
      edgeType?: IWhiteboardEdge['lineType']
    }
  | {
      type: 'webpage'
      url: string
      webpageId: number
    }
  | {
      type: 'audio'
      audioUrl: string
    }
  | {
      type: 'note'
      noteId: number
      isCard: boolean
    }
  | {
      type: 'pdf'
      documentId: number
    }
  | {
      type: 'group'
    }
  | {
      type: 'text'
      fontSize?: 'middle' | 'large' | 'small' | 'super large'
      content: string | any[]
    }
  | {
      type: 'freehand'
      points: FreehandPoint[] | FreehandPoint[][]
      // default: 16
      strokeWidth?: number
      // default: 1
      opacity?: number
      // default: theme(dark: white, light: black)
      fillColor?: string
      penType: 'pen' | 'ballpen' | 'marker'
      mode: 'pencil' | 'marker' | 'dash'
      style?: IPenStyle
    }
)

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

export type IWhiteboardMindmap = {
  root: number
  label?: string
  children: IWhiteboardMindmap[]
}
export interface IWhiteboard extends IBase {
  name?: string
  nodes?: Map<number, IWhiteboardNode>
  edges?: Map<number, IWhiteboardEdge>
  items?: ICollectionItem[]
  color?: string
  icon?: string
  backgroundType?: 'dot' | 'line' | 'none'
  lineType: 'straight' | 'polyline' | 'curve'
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

export type IWhiteboardOutline = {
  nodeId: number
  name: string
  children?: IWhiteboardOutline[]
}

export type IWhiteboardAlignment = 'left' | 'top' | 'right' | 'bottom' | 'horizontallyCenter' | 'verticallyCenter'
export type IWhiteboardLayout = 'horizontallySpacing' | 'verticallySpacing' | 'auto' | 'byType'

export * from './instance'
