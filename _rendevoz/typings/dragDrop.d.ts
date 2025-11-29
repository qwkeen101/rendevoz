import { Path } from 'slate'
import { CustomElement, CustomTypes, MetaGroupChild } from '.'

export type BuiltInDraggableElement =
  | {
      type: 'metaObjects'
      ids: number[]
    }
  | {
      type: 'tab'
      id: number
    }
  | {
      type: 'noteBlock'
      blockId: number
      element: CustomElement
      path: Path
      elements: CustomElement[]
      content: string
      noteId: number
      editorId: string
      metaId?: number
    }
  // something inside pdf, not pdf itself
  | ({
      type: 'groupItem'
      groupId: number
    } & {
      value: MetaGroupChild[]
    })
  | {
      type: 'collection'
      collectionId: number
    }
  | {
      type: 'label'
      labelId: number
    }
  | {
      type: 'question'
      objectId: number
    }
  | {
      type: 'message'
      objectId: number
      prevMessageId?: number
    }
export type IDraggableElement = BuiltInDraggableElement
