import { Path } from 'slate'
import { CustomElement } from '.'

export type GlobalDraggingDetails =
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
      type: 'webpage label'
      highlightId: number
      noteId: number
      webpageId: number
      textContent?: string
    }
  | {
      type: 'note label'
      highlightId: number
      noteId: number
      textContent?: string
    }
