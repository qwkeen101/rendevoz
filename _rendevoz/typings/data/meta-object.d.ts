import { Box } from '../common'
import { CustomTypes } from '../custom'
import { IBase } from './base'
import { ObjectFamily } from 'rendevoz'
import { MetaFormLayoutItem } from '~/typings'
import { Dispatch, SetStateAction } from 'react'

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

export type RegisteredMetaObject<T = MetaObject['type']> = {
  type: T
  onNavigate?: (metaObject: MetaObject & { type: T }) => void
  icon: string
  /**
   * Default name for created meta-object
   */
  defaultName?: string | (() => string)
  i18nKey: string
  /**
   * If set true, will be visible in homepage
   * Default: true
   */
  visibleInHomepage?: boolean
  /**
   * If set true, will be visible in create menu like homepage menu or collection menu
   * Default: false
   */
  visibleInCreateMenu?: boolean
  filterSettings: {
    /**
     * TODO: Custom object type
     */
    objectType: 'record' | 'file' | 'label'
  }
  graphSettings?: {
    collisionRadius?: number
    /**
     * Default radius: 45
     */
    radius?: number
  }
  /**
   * Customize your meta-object edit details form
   */
  customEditForm?: (
    metaObject: MetaObject & { type: T },
    setMetaObject: Dispatch<SetStateAction<MetaObject>>,
    object?: ObjectFamily[T]
  ) => MetaFormLayoutItem[]
  /**
   * Difference between onCreate and onAdd:
   * onCreate is only triggered when meta-object is created in menus like homepage menu, collection menu
   * onAdd will always be triggered when meta-object is added
   * So if meta-object is created, onCreate and onAdd will all be triggered
   * You can do works like navigating or toasting onCreate
   * @param object corresponding object
   */
  onCreate?: (metaObject: MetaObject & { type: T }, object: ObjectFamily[T]) => void
  onAdd?: (metaObject: MetaObject & { type: T }) => void
  onDelete?: (metaObject: MetaObject & { type: T }) => void
  onUpdate?: (
    currMetaObject: MetaObject & { type: T },
    prevMetaObject: MetaObject & { type: T },
    changedProps?: { propName: string; prevProp: any; currProp: any }[]
  ) => void
}

export interface MetaLink extends IBase {
  sourceId: number
  sourceType: string
  targetId: number
  targetType: string
  label: string
  color?: string
}
