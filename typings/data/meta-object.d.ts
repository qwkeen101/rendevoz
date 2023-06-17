import { Box } from '../common'
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

// sourceType: note / metaObject / pdf document
interface MetaObject extends IBase {
  type:
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

interface MetaLink extends IBase {
  sourceId: number
  sourceType: string
  targetId: number
  targetType: string
  label: string
  color?: string
}
