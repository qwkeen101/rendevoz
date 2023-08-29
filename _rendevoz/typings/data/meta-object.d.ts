import { Box } from '../common'
import { CustomTypes } from '../custom'
import { IBase } from './base'
import { ObjectFamily } from 'rendevoz'
import { MetaFormLayoutItem } from '~/typings'
import { Dispatch, SetStateAction } from 'react'
import { MetaSorter, SorterGroup } from '../../../src/core/database/filter/BetterSorter'

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
  | 'group'

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

export type MetaTableHeader = {
  name: string
  width: number
  display: () => string
  icon: string
}
export type MetaGroupChild = {
  type: 'metaObject'
  id: number
  rowId: number
  children?: MetaGroupChild[]
  toggled?: boolean
}
export interface MetaGroup extends IBase {
  childrenMetaIds: number[]
  value?: MetaGroupChild[]
  hideInnerTypes?: string[]
  renderMode: 'table' | 'list'
  rootFilterGroup: MetaFilterGroup
  filter?: MetaFilterGroup
  sort?: SorterGroup
  search?: string
  afterFilterValue?: MetaGroupChild[]
  tableProperties?: {
    headers?: MetaTableHeader[]
    visibleProperties: string[]
    hiddenProperties: string[]
    wrapColumns?: boolean
  }
}

export type StringFieldFilterRule = {
  type: 'contains' | 'not contains' | 'is' | 'is not' | 'starts with' | 'ends with' | 'empty' | 'not empty'
  value: string
}
export type DateFieldFilterRule = {
  type: 'is' | 'before' | 'after' | 'empty' | 'not empty' | 'on and before' | 'on and after'
  value: 'today' | 'yesterday' | 'one week ago' | 'one month ago' | 'three month ago' | 'specific'
  specDate: number
}
type TagFieldFilterRule = {
  type: 'contains' | 'not contains' | 'empty' | 'not empty' | 'is' | 'is not'
  tagIds?: number[]
}

type TypeFieldFilterRule = {
  type: 'is' | 'is not'
  filterType: 'rule'
  value: string
}

export type MetaFilterer =
  | {
      metaType: 'spec'
      metaId: number
    }
  | {
      metaType: 'rule'
      group: MetaFilterGroup
    }
export type FromFieldFilterRule = {
  type: 'is'
} & MetaFilterer

export type MetaFilterGroup = {
  groupType: 'and' | 'or'
  rules: MetaFilterRule[]
  filterType: 'group'
}
export type LinkFilterRule = {
  filterType: 'link'
  type: 'source' | 'target' | 'related'
  ruleType: 'contains' | 'not contains' | 'is' | 'is not'
} & MetaFilterer

export type MetaFilterRule = (
  | ({
      filterType: 'rule'
      field: 'name'
    } & StringFieldFilterRule)
  | ({
      filterType: 'rule'
      field: 'description'
    } & StringFieldFilterRule)
  | ({
      filterType: 'rule'
      field: 'createdAt' | 'viewAt' | 'updatedAt'
    } & DateFieldFilterRule)
  | ({
      filterType: 'rule'
      field: 'tags'
    } & TagFieldFilterRule)
  | ({
      filterType: 'rule'
      field: 'fromObject'
    } & FromFieldFilterRule)
  | ({ filterType: 'rule'; field: 'type' } & TypeFieldFilterRule)
  | LinkFilterRule
  | MetaFilterGroup
) & {
  id: number
}

export interface MetaLink extends IBase {
  sourceId: number
  sourceType: string
  targetId: number
  targetType: string
  label: string
  color?: string
}
