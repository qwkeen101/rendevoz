import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import {
  BuiltInDraggableElement,
  BuiltInTabTypes,
  ICollection,
  ILabel,
  ILayoutTab,
  IWhiteboardEdge,
  IWhiteboardNode,
  MetaObject, OpenTabOptions,
  PartialWithId, TabData
} from '..'
import { ITabData } from '~/typings/rendevoz'

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
  onCreateMeta: (m: MetaObject) => void
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
    addExtraSvgArrows?: (color: string) => void
    previewMedia?: (path: string) => void
  }
  goBackOps: {
    goBackToSyncBlock: (syncBlockMetaId: number, targetMetaId: number) => Promise<void>
  }
  layoutOps: {
    getCurrentFocusedTab: () => string | undefined
    switchToTab: (direction: 'next' | 'prev') => void
    registerTabData: (tabData: BuiltInTabTypes) => void
    closeCurrentFocusedTab: VoidFunction
    closeCurrentFocusedPanel: VoidFunction
    closeAllTabs: (keepHome?: boolean) => void
    makeTabActive: (tabId: string) => void
    getRegisteredTabData: (type: BuiltInTabTypes['type']) => BuiltInTabTypes | undefined
    initializeOneTab: (
      registeredData: TabData[BuiltInTabTypes['type']],
      options: OpenTabOptions<BuiltInTabTypes['type']>
    ) => ILayoutTab | undefined
    // return tab id or undefined
    hasTargetTab: (tabData: Partial<Omit<BuiltInTabTypes, 'instance'>>) => string | undefined
    openNewTab: (tabData: OpenTabOptions<BuiltInTabTypes['type']>) => void
  }
  metaOps: {
    canCreateDirectly: (type: MetaObject['type']) => boolean
    getLink: (nodeId: number) => Promise<{
      link: string
      htmlLink: string
      markdown: string
      html: string
      name: string
    }>
    closeDetails: VoidFunction
    quickAdd: (metaId: number | number[]) => void
    canPreview: (metaObject: MetaObject) => boolean
    openDetails: (id: number) => void
    openGraph: (id: number) => void
    preview: (id: number) => void
    // bad api design, alternative for create object
    // TODO: replace all create object with this api
    createObjects: (
      type?: MetaObject['type'],
      onMetaCreated?: (meta: MetaObject) => void,
      opts?: {
        parentCollectionId?: number
      }
    ) => void
    createObject: (type?: MetaObject['type']) => Promise<MetaObject>
    copyLink: (id: number | number[]) => void
    addDraggableAsMeta: (d: BuiltInDraggableElement, temp?: boolean) => Promise<MetaObject>
  }
}>
