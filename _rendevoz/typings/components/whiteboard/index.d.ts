import { IBase } from '../../data/base'
import { ICollectionItem } from '../../data/collection'

export type IWhiteboardEdge = {
  id: number
  sourceId: number
  targetId: number
  sourcePosition?: EdgePosition
  targetPosition?: EdgePosition
  metaLinkId?: number
  label?: string
  color?: string
}

export type EdgePosition = 'top' | 'right' | 'left' | 'bottom'

export type IWhiteboardNode = {
  id: number
  x: number
  y: number
  name?: string
  background?: string
  width?: number
  height?: number
} & (
  | {
      type: 'metaObject'
      metaObjectId?: number
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
      content: string
    }
)

export interface IWhiteboard extends IBase {
  name?: string
  nodes?: Map<number, IWhiteboardNode>
  edges?: Map<number, IWhiteboardEdge>
  items?: ICollectionItem[]
  color?: string
  icon?: string
  groups?: any[]
  lastViewport?: {
    x: number
    y: number
    scale: number
  }
}
