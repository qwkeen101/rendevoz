import {
  BuiltInDraggableElement,
  BuiltInTabTypes,
  IAIMessage,
  IChatInstance,
  ICollection,
  IEditorInstance,
  IGlobalEvents,
  IGroupInstance,
  ILayoutTab,
  IMediaInstance,
  IPDFInstance,
  IPDFLabel,
  IWebpageInstance,
  IWhiteboardInstance,
  IWhiteboardNode,
  MetaObject,
  OpenTabOptions,
  TabData,
  TextSelectRect,
  XYPosition,
  IFolder,
  BaiduFile,
  IFeedInstance,
  IYoutubeInstance,
  IMetaVisibleConditions,
  MetaFilterGroup,
  IExamInstance
} from '..'
import { BaseSelection, Descendant } from 'slate'
import { ReactElement, ReactNode } from 'react'
import { IPodcastInstance } from '../../src/core/components/podcast/hooks/usePodcastInstance'
import { IImportResult } from '~/typings/rendevoz'
import { CoreMessage } from 'ai'

export type IBaidudiskInstance = Partial<{
  // choose file, return file path or undefined
  chooseFile: (category?: number, closeAfterChoose?: boolean) => Promise<any | undefined>
  onChooseFile: (file: any) => void
  onCreateMeta: (m: MetaObject) => void
}>

export type IGeneralSource =
  | {
      type: 'pdf'
      objectId: number
      page?: number
      selectedText?: string
      labelId?: number
      rects?: TextSelectRect[]
      wholePage?: boolean
      cropLabel?: Partial<IPDFLabel & { type: 'crop' }>
    }
  | {
      type: 'note' | 'webpage'
      objectId: number
      labelId?: number
      blockId?: number | number[]
      feedId?: number
      selectedText: string
      selection: BaseSelection
    }
  | {
      type: 'audio' | 'video'
      objectId: number
      youtubeId?: number
      episodeId?: number
      selectedText: string
      time: number
    }
  | {
      type: 'question'
      objectId: number
      metaId?: number
      name: string
    }

export type InstanceRecord = {
  whiteboard: IWhiteboardInstance
  editor: IEditorInstance
  chat: IChatInstance
  webpage: IWebpageInstance
  pdf: IPDFInstance
  group: IGroupInstance
  video: IMediaInstance
  audio: IMediaInstance
  feed: IFeedInstance
  youtube: IYoutubeInstance
  podcast: IPodcastInstance
  exam: IExamInstance
}

export type IAppState = {
  sidebarCollapsed: boolean
  lastBackupDate?: number
}

export type IParsedWebpage = {
  title: string
  description?: string
  image?: string
  content: Descendant[]
  author?: string
  domain?: string
  favicon?: string
}

export type IGlobalInstance = Partial<{
  collectionOps: {
    selectCollection: () => Promise<ICollection | 0>
    addMetaIntoCollection: (metaId: number) => Promise<void>
  }
  objectOps: {
    isLabel: (o?: any) => boolean
  }
  dialogOps: {
    confirm: (message: string) => Promise<boolean>
    createOrEditFolder: <T>(type: string | 'collection' | 'custom', initial?: Partial<T>) => Promise<T>
  }
  aiOps: {
    chat?: (opts?: {
      messages?: Partial<IAIMessage>[]
      pos?: XYPosition
      source?: IGeneralSource
      e?: PointerEvent | MouseEvent
      initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
      getResponse?: boolean
      createNewChat?: boolean
      openSidebar?: boolean
      contextCount?: number
      targetChatId?: number
    }) => void
    isChatOpen?: () => boolean
    getChatBySource?: (source: IGeneralSource) => Promise<number | undefined>
    explain?: (opts: {
      query?: string
      image?: string
      pos?: XYPosition
      source?: IGeneralSource
      initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
      e?: PointerEvent | MouseEvent
      targetChatId?: number
    }) => void
    toggleExplainer: (visible: boolean) => void
  }
  commonOps: {
    startDrag: VoidFunction
    importFromLibrary: (visibleMetas?: number[]) => Promise<MetaObject[]>
    setDraggingElements: (eles: HTMLElement | HTMLElement[] | ReactElement | ReactElement[]) => void
    addExtraSvgArrows?: (color: string) => void
    previewMedia?: (path: string) => void
    previewImage?: (url: string) => void
    screenshot?: VoidFunction
    upload: (options?: { accept?: string; multiple?: boolean; dir?: boolean }) => Promise<File | File[]>
    importURLs?: (
      urls: string | string[],
      opts?: {
        parentCollectionId?: number
        onImport?: (meta: MetaObject) => void
      }
    ) => void
    importFiles?: (
      files: File[] | File,
      opts?: {
        isDir?: boolean
        dirName?: string
        onImport?: (meta: MetaObject) => void
        // auto import into collection
        parentCollectionId?: number
        // if import whole dir, result with a collection
        onEnd?: (result?: { collectionId?: number }) => void
      }
    ) => Promise<void>
    importFolder?: (
      folder: IFolder | IFolder[],
      opts?: {
        onImport?: (m: MetaObject) => void
        parentCollectionId?: number
      }
    ) => Promise<void>
    importBaidu?: (
      file: string | BaiduFile | string[] | BaiduFile[] | (string | BaiduFile)[],
      opts?: {
        onImport?: (m: MetaObject) => void
        parentCollectionId?: number
      }
    ) => void
    translate?: (opts: {
      query?: string
      pos?: XYPosition
      source?: IGeneralSource
      e?: PointerEvent | MouseEvent
      image?: string
      targetChatId?: number
    }) => void
    toggleTranslator: (visible: boolean) => void
  }
  layoutOps: {
    useExtraPage: () => boolean
    closeExtraPage: VoidFunction
    openExtraPage: (page: 'feed' | 'youtube' | 'podcast', onInstanceInitialized: (i: any) => void) => void
    registerTabIcon: (
      event:
        | {
            type: 'add'
            icons: { id: number; renderer: ReactNode }[]
          }
        | {
            type: 'delete'
          }
    ) => void
    closeFloatSidebar: VoidFunction
    openFloatSidebar: VoidFunction
    closeObjectTab: (metaId: number) => void
    openDeekLink: (link: string) => void
    openPage: <
      K extends keyof InstanceRecord | 'home' | 'graph' | 'library' | 'trash' | 'collectionGroup' | 'typeGroup' | 'propGroup' | 'tagGroup'
    >(
      type: K,
      opts?: {
        id: number | string
      }
    ) => Promise<InstanceRecord[K]>
    openObject: <K extends keyof InstanceRecord>(metaId: number) => Promise<InstanceRecord[K] | undefined>
    getCurrentFocusedTab: () => string | undefined
    switchToTab: (direction: 'next' | 'prev') => void
    registerTabData: (tabData: BuiltInTabTypes) => void
    closeTabs: (type: 'left' | 'right' | 'others', currTabId?: string) => void
    closeCurrentFocusedTab: VoidFunction
    closeCurrentFocusedPanel: VoidFunction
    closeAllTabs: (keepHome?: boolean) => void
    closeTab: (tabId: string) => void
    makeTabActive: (tabId: string) => void
    getRegisteredTabData: (type: BuiltInTabTypes['type']) => BuiltInTabTypes | undefined
    initializeOneTab: (
      registeredData: TabData[BuiltInTabTypes['type']],
      options: OpenTabOptions<BuiltInTabTypes['type']>
    ) => ILayoutTab | undefined
    getTab: (id: string) => BuiltInTabTypes | undefined
    // return tab id or undefined
    hasTargetTab: (tabData: Partial<Omit<BuiltInTabTypes, 'instance'>>) => string | undefined
    openNewTab: (tabData: OpenTabOptions<BuiltInTabTypes['type']>) => void
  }
  searchOps: {
    openSearchPanel: (query?: string) => void
    closeSearchPanel: VoidFunction
    getSearchResults: (query: string) => Promise<string>
  }
}> & {
  values: {
    copiedWhiteboardData?: IWhiteboardNode[]
    keydownHandlers: ((e: KeyboardEvent) => void)[]
    registeredKeynavigationHandlers: ((e: KeyboardEvent) => void)[]
    draggingDetails?: BuiltInDraggableElement
  }
} & {
  addEventListener: <K extends keyof IGlobalEvents>(key: K, listener: (args: IGlobalEvents[K]) => void) => void
  removeEventListener: <K extends keyof IGlobalEvents>(key: K, listener: (args: IGlobalEvents[K]) => void) => void
  emitEvent: <K extends keyof IGlobalEvents>(key: K, args?: IGlobalEvents[K]) => void
  goBackOps: {
    goBackToSyncBlock: (syncBlockMetaId: number, targetMetaId: number) => Promise<void>
  }
  metaOps: {
    viewContains: (metaId: number) => void
    canViewContains: (metaId: number) => boolean
    canCreateDirectly: (type: MetaObject['type']) => boolean
    getLink: (nodeId: number) => Promise<{
      link: string
      htmlLink: string
      markdown: string
      html: string
      name: string
    }>
    edit?: (id: number) => Promise<MetaObject>
    openCreateForm?: (current: Partial<MetaObject>) => Promise<MetaObject>
    closeDetails?: VoidFunction
    quickAdd?: (metaId: number | number[], target?: 'tags' | 'whiteboard' | 'groups' | 'note' | 'collections') => void
    canPreview: (metaObject: MetaObject | number) => boolean
    openDetails?: (id?: number) => void
    toggleDetails?: (id?: number, visible?: boolean) => void
    openGraph?: (id: number) => void
    openUploaderTab?: (tab: 'file' | 'url') => void
    createObjects?: (
      type?: MetaObject['type'],
      onMetaCreated?: (meta: MetaObject) => void,
      opts?: {
        parentCollectionId?: number
        openAfterTriggerOnce?: boolean
      }
    ) => void
    getMetaName: (m?: MetaObject) => string
    hasTag: (id: number | MetaObject | undefined) => boolean
    copyLink: (id: number | number[]) => void
    addDraggableAsMeta: (
      d: BuiltInDraggableElement | undefined,
      opts?: {
        temp?: boolean
        dropOn?: {
          metaId: number
          type: 'meta'
        }
        event?: DragEvent | PointerEvent
      }
    ) => Promise<MetaObject[]>
    getCopiedMetaObjects: () => Promise<MetaObject[] | undefined>
    getCopiedMetaObjectsSync: (html: string) => MetaObject[] | undefined
    search: (
      search: string,
      objects?: (number | MetaObject)[],
      opts?: IMetaVisibleConditions & {
        onlyName?: boolean
      }
    ) => Promise<MetaObject[]>
    filter: (filter: MetaFilterGroup, objects?: (number | MetaObject)[], opts?: IMetaVisibleConditions) => Promise<MetaObject[]>
    sort: (sort: keyof MetaObject, type: 'desc' | 'asc', objects?: (number | MetaObject)[]) => MetaObject[]
  }
  utils: {
    getIcon: (type?: MetaObject['type']) => string
    getTypeName: (type?: MetaObject['type']) => string
    fetchDetails: (url: string) => Promise<{
      title: string
      description?: string
      sitename?: string
      image?: string
      author?: string
      audio?: string
      icon?: string
      html?: string
      dom?: HTMLElement
      appIcon?: string
    }>
    // fetch target url's html content
    fetchURL: (url: string, html?: string) => Promise<string>
    // extract html's main content
    extractHTML: (
      url: string,
      html: string
    ) => {
      original: Document
      extracted: Document
      title: string
      text: string
    }
    // parse webpage as editor content
    parseWebpage: (url: string, html?: string) => Promise<IParsedWebpage>
    normalizeFile: (file: File) => Promise<IImportResult<any>>
    normalizeURL: (url: string, type?: string) => Promise<IImportResult<any>>
    normalizeDragEvent: (e: DragEvent) => Promise<
      | {
          type: 'images'
          imgs: {
            path: string
            name: string
          }[]
        }
      | {
          type: 'link'
          url: string
        }
      | {
          type: 'text'
          text: string
        }
      | {
          type: 'files'
          files: File[]
        }
      | undefined
    >
    formatURL: (url: string) => string
    openSpecificURL: (url: string) => void
  }
  appState: {
    getState: () => IAppState
    setState: (state: Partial<IAppState>) => void
  }
}
