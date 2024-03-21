import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import {
  BuiltInDraggableElement,
  BuiltInTabTypes,
  ICollection,
  IEditorInstance,
  IGroupInstance,
  ILabel,
  ILayoutTab,
  IMediaInstance,
  IPdfInstance,
  IWebpageInstance,
  IWhiteboardEdge,
  IWhiteboardInstance,
  IWhiteboardNode,
  MetaObject,
  OpenTabOptions,
  PartialWithId,
  TabData
} from '..'
import { ITabData } from '~/typings/rendevoz'

export type IBaidudiskInstance = Partial<{
  // choose file, return file path or undefined
  chooseFile: (category?: number, closeAfterChoose?: boolean) => Promise<any | undefined>
  onChooseFile: (file: any) => void
  onCreateMeta: (m: MetaObject) => void
}>

export type InstanceRecord = {
  whiteboard: IWhiteboardInstance
  editor: IEditorInstance
  webpage: IWebpageInstance
  pdf: IPdfInstance
  group: IGroupInstance
  video: IMediaInstance
  audio: IMediaInstance
}

export type IGlobalInstance = Partial<{
  collectionOps: {
    selectCollection: () => Promise<ICollection>
    addMetaIntoCollection: (metaId: number) => Promise<void>
  }
  objectOps: {
    isLabel: (o?: any) => boolean
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
    openObject: <K extends keyof InstanceRecord>(metaId: number) => Promise<InstanceRecord[K] | undefined>
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
  searchOps: {
    openSearchPanel: (query?: string) => void
    closeSearchPanel: VoidFunction
    getSearchResults: (query: string) => Promise<string>
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
    openDetails: (id?: number) => void
    toggleDetails: (id?: number, visible?: boolean) => void
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
