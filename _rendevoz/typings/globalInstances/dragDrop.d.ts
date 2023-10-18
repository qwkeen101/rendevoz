import { ReactElement } from 'react'
import { Path } from 'slate'
import { CustomElement, CustomTypes, IVideoLabel, MetaGroupChild } from '..'

export type BuiltInDraggableElement =
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
      type: 'metaElement'
      metaId: number
    }
  // pdf itself
  | {
      type: 'pdf'
      pdfId: number
    }
  | {
      type: 'collection'
      collectionId: number
    }
  | {
      type: 'note'
      noteId: number
      // for whiteboard card
      isCard?: boolean
    }
  | {
      type: 'image'
      url: string
    }
  | {
      type: 'whiteboard'
      whiteboardId: number
    }
  | {
      type: 'webpageLabel' | 'videoLabel' | 'noteLabel' | 'pdfLabel'
      labelId: number
    }
export type IDraggableElement = CustomTypes['DraggableElement']

export interface IGlobalDragDropInstance {
  addDragElements: (nodes: HTMLElement | HTMLElement[] | ReactElement | ReactElement[]) => void
  startDrag: () => void
  endDrag: () => void
  removeDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  removeAllDragElement: () => void
  getDraggingDetails: () => Partial<IDraggableElement> | undefined
  setDraggingDetails: (draggingDetails: Partial<BuiltInDraggableElement>) => void
  draggingDetails?: Partial<IDraggableElement>
}
