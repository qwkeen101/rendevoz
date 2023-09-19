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
      type: 'pdfLabel'
      labelId: number
      pdfId: number
      content?: string
      page?: number
    }
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
  | ({
      type: 'pendingPdfElement'
      labelType: ILabel['type']
    } & {
      labelType: 'shape'
      shapeType: IShapeLabel['shape']
    })
  | {
      type: 'webpageLabel'
      highlightId: number
      noteId: number
      webpageId: number
      textContent?: string
    }
  | {
      type: 'noteLabel'
      highlightId: number
      noteId: number
      textContent?: string
    }
  | ({
      type: 'videoLabel'
      textContent?: string
    } & Partial<IVideoLabel>)

export type IDraggableElement = CustomTypes['DraggableElement']

export interface IGlobalDragDropInstance {
  addDragElements: (nodes: HTMLElement | HTMLElement[] | ReactElement | ReactElement[]) => void
  startDrag: () => void
  endDrag: () => void
  removeDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  removeAllDragElement: () => void
  getDraggingDetails: () => Partial<IDraggableElement> | undefined
  setDraggingDetails: (draggingDetails: Partial<IDraggableElement>) => void
  draggingDetails?: Partial<IDraggableElement>
}
