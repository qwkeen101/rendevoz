import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import { BuiltInDraggableElement, ICollection, ILabel, ILayoutTab, IWhiteboardEdge, IWhiteboardNode, MetaObject, PartialWithId } from '..'

export interface WebpageInstance {
  transformToNote: () => Promise<CustomEditor>
  editor?: CustomEditor
  changeUrl: (url: string) => void
  webview?: WebpageInnerRef
}

export type IReviewInstance = Partial<{
  createCard?: (rating: number) => void
  reviewCard?: () => void
  deleteCard?: () => void
}>

export type IBaidudiskInstance = Partial<{
  // choose file, return file path or undefined
  chooseFile: (category?: number, closeAfterChoose?: boolean) => Promise<any | undefined>
  onChooseFile: (file: any) => void
}>

export type IGlobalInstance = Partial<{
  collectionOps: {
    selectCollection: () => Promise<ICollection>
    addMetaIntoCollection: (metaId: number) => Promise<void>
  }
  objectOps: {
    isLabel: (o?: any) => boolean
  }
  aiOps: {
    // open sidebar ai panel
    // from: meta id
    askQuestion: (query: string, from?: number) => void
  }
  dialogOps: {
    confirm: (message: string) => Promise<boolean>
  }
  commonOps: {
    addExtraSvgArrows: (color: string) => void
  }
  metaOps: {
    canCreateDirectly: (type: MetaObject['type']) => boolean
    getLink: (nodeId: number) => Promise<{
      link: string
      htmlLink: string
      markdown: string
      html: string
    }>
    closeDetails: VoidFunction
    quickAdd: (metaId: number) => void
    canPreview: (metaObject: MetaObject) => boolean
    openDetails: (id: number) => void
    openGraph: (id: number) => void
    preview: (id: number) => void
    // bad api design, alternative for create object
    // TODO: replace all create object with this api
    createObjects: (type?: MetaObject['type'], onMetaCreated?: (meta: MetaObject) => void) => void
    createObject: (type?: MetaObject['type']) => Promise<MetaObject>
    copyLink: (id: number | number[]) => void
    addDraggableAsMeta: (d: BuiltInDraggableElement, hidden?: boolean) => Promise<MetaObject>
  }
}>
