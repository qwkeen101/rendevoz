import { Box } from '../common'
import { CustomTypes } from '../custom'
import { IBase } from './base'

export type IMetaAttachment =
  | {
      type: MetaObject['type']
      id: MetaObject['id']
      createdAt: number
    }
  | {
      type: 'attachmentText'
      id: number
      createdAt: number
      text: string
    }

export type BuiltInMetaObjectTypes =
  | 'note'
  | 'pdf'
  | 'pdfLabel'
  | 'normal'
  | 'image'
  | 'whiteboard'
  | 'video'
  | 'audio'
  | 'webpage'
  | 'noteLabel'
  | 'noteBlock'
  | 'webpageLabel'
  | 'localFile'
  | 'videoLabel'

// sourceType: note / metaObject / pdf document
export interface MetaObject extends IBase {
  type: CustomTypes['MetaObject']

  name?: string
  description?: string
  coverImgSrc?: string
  objectId?: number
  objectUrl?: string
  tags?: number[]
  icon?: string
  color?: string
  attachments?: IMetaAttachment[]
  from?: {
    icon?: string
    metaId?: number
    type?: MetaObject['type']
    name?: string
  }
  fromObject?:
    | {
        type: 'pdf'
        metaId: number
        pages?: number[]
        rect?: Box
        selectedText?: string
      }
    | {
        type: 'note'
        metaId: number
        blockId?: number
        selectedText?: string
      }
    | {
        type: 'webpage'
        metaId: number
        blockId?: number
        selectedText?: string
      }
    | {
        type: 'whiteboard'
        metaId: number
      }
    | {
        type: 'video'
        metaId: number
        time?: number
      }
  temp?: boolean
}

export type RegisteredMetaObject = {
  type: string
  onNavigate?: (metaObject: MetaObject) => void
  icon: string
  i18nKey: string
  graphSettings?: {
    collisionRadius?: number
    /**
     * Default radius: 45
     */
    radius?: number
  }
}

export interface MetaLink extends IBase {
  sourceId: number
  sourceType: string
  targetId: number
  targetType: string
  label: string
  color?: string
}
