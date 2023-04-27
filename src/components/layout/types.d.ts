import { IPdfViewer, CustomEditor, WebpageInstance } from '~/typings'

type AddTabOptions =
  | {
      type: 'pdf'
      pdfId: number
      onViewerInitialized: (viewer: IPdfViewer) => void
    }
  | {
      type: 'note'
      noteId: number
      onEditorInitalized: (editor: CustomEditor) => void
    }
  | {
      type: 'whiteboard'
      whiteboardId: number
    }
  | {
      type: 'home'
    }
  | {
      type: 'database'
    }
  | {
      type: 'webpage'
      webpageId: number
      onWebpageInitialized?: (instance: WebpageInstance) => void
      onWebpageChange?: (newWebpageDetails: { webpageId: number }) => void
    }
  | {
      type: 'image'
      imageId: number
    }

export type LayoutTab = (
  | {
      type: 'pdf'
      objectId: number
      viewer?: IPdfViewer
    }
  | {
      type: 'note'
      objectId: number
      editor?: CustomEditor
    }
  | {
      type: 'home'
    }
  | {
      type: 'database'
    }
  | {
      type: 'whiteboard'
      objectId: number
    }
  | {
      type: 'webpage'
      objectId: number
      instance?: WebpageInstance
    }
  | {
      type: 'image'
      objectId: number
    }
) & {
  tabElement?: HTMLElement
}
