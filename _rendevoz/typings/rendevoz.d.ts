/**
 * Core Api of Rendevoz
 */

import { ReactElement } from 'react'
import { GlobalInstances } from './globalInstances'
import { ILayoutTab, TabData } from './layout'
import { IWebpageInstance, IVideoInstance, IPdfInstance, IEditorInstance, IWhiteboardInstance } from './components'
import { EditorEventMap, GlobalEventMap, IEventEmitter, IEventHandler, PdfEventMap } from './event'
import { NoteStore } from './stores'
import { SearchStore } from './stores/search.store'
import { MetaObject } from './data'
import { InnerComponents, InnerHooks } from './inner'
import { Descendant } from 'slate'

export type IRendevoz = {
  Actions: typeof Action
  Utils: typeof Utils
  Events: typeof Events
  InnerHooks: typeof InnerHooks
  InnerComponents: typeof InnerComponents
  Consts: typeof Consts
}

export type OpenTabOptions<K extends ILayoutTab['type']> = {
  data: { objectId?: number; onInstanceInitialized?: (instance: Extract<ILayoutTab, { type: K }>['instance']) => void } & Omit<
    TabData[K],
    'content'
  >
}

/**
 * Layout actions Api
 */
declare const Layout: {
  registerTabData: <K extends ILayoutTab['type']>(data: TabData[K]) => void
  getRegisteredTabContent: <K extends ILayoutTab['type']>(type: K) => TabData[K]['content'] | undefined
  openNewTab: <T extends ILayoutTab['type']>({ data }: OpenTabOptions<T>) => void
  /**
   * get layoutTab from tabData and openTabData
   */
  initializeOneTab: <T extends ILayoutTab['type']>(
    tabData: TabData[T],
    openTabData: OpenTabOptions<T>['data']
  ) => { layoutTab: ILayoutTab } | undefined
  /**
   * Return tab id or undefined
   */
  hasTargetTab: <T extends ILayoutTab['type']>(tabData: OpenTabOptions<T>['data']) => string | undefined
  getTab: <T extends ILayoutTab['type']>(opts: { objectId?: number; type: T }) => ILayoutTab | undefined
  /**
   * get all tabs whose content visiblity is not hidden
   */
  getVisibleTabs: () => ILayoutTab[]
  makeTabActive: (tabId: string) => void
  getTabById: (id: string) => ILayoutTab | undefined
}

/**
 * State actions Api
 */
declare const State: {
  Translate: {
    translate: GlobalInstances.TranslateInstance['translate']
  }
  Drag: {
    startDrag: GlobalInstances.DragDropInstance['startDrag']
    endDrag: GlobalInstances.DragDropInstance['endDrag']
    setDraggingDetails: GlobalInstances.DragDropInstance['setDraggingDetails']
    getDraggingDetails: GlobalInstances.DragDropInstance['getDraggingDetails']
    addDragElements: GlobalInstances.DragDropInstance['addDragElements']
  }
}

/**
 * Open tab/objects/metaObjects Api
 */
declare const Open: {
  openHome: VoidFunction
  openDatabase: VoidFunction
  openImage: (id: number) => void
  openSidebarObjectDetails: (metaId: number) => void
  Pdf: {
    openPdf: (id: number) => Promise<IPdfInstance>
    openPdfLabel: (id: number) => Promise<void>
    openPdfPage: (pageIndex: number, id: number) => Promise<void>
    openPdfSearchedText: (text: string, pageIndex: number, pdfId: number) => Promise<void>
  }
  Editor: {
    openEditor: (id: number) => Promise<IEditorInstance>
    openNoteBlock: (id: number) => Promise<void>
    openNoteLabel: (id: number) => Promise<void>
  }
  Whiteboard: {
    openWhiteboard: (id: number) => Promise<IWhiteboardInstance>
  }
  Meta: {
    openMetaObject: (id: number) => Promise<unknown>
    openEditMetaDialog: (id: number) => void
  }
  Webpage: {
    openWebpage: (id: number) => Promise<IWebpageInstance>
    openWebpageLabel: (id: number) => Promise<void>
    openWebpageSelectedText: (webpageId: number, text: string) => Promise<void>
  }
  Video: {
    openVideo: (id: number) => Promise<IVideoInstance>
    openVideoLabel: (id: number) => Promise<void>
    openVideoAtTime: (id: number, time: number) => Promise<void>
  }
  Search: {
    openTextSearch: (opts?: Parameters<GlobalInstances.TextSearchInstance['open']>[0]) => void
    openWebSearch: (opts: Parameters<GlobalInstances.WebSearchInstance['open']>[0]) => void
  }
  Translate: {
    openTranslate: (opts: Parameters<GlobalInstances.TranslateInstance['open']>[0]) => void
  }
}

declare const Notification: {
  success: (data: { message: string | ReactElement }) => void
  info: (data: { message: string | ReactElement }) => void
  error: (data: { message: string | ReactElement }) => void
}

declare const ActionUtils: {
  uploadFile: (options?: { accept?: string; multiple?: boolean; dir?: boolean }) => Promise<File | File[]>
}
/**
 * Actions Api
 */
declare const Action: {
  Layout: typeof Layout
  State: typeof State
  Open: typeof Open
  Notification: typeof Notification
  Utils: typeof ActionUtils
  Store: typeof Store
}

type TypeToEventMap = {
  editor: EditorEventMap
  global: GlobalEventMap
  pdf: PdfEventMap
}

/**
 *
 */

declare const EmitEvents: {
  emitEventGlobally: (...params: Parameters<IEventEmitter['emit']>) => void
  GlobalEventEmitter: IEventEmitter
  useScopedEventEmitter: () => IEventEmitter
  /**
   * Context scoped event emitter
   */
  useEventHandler: <T extends keyof TypeToEventMap>(type: T) => IEventHandler<TypeToEventMap[T]>
}

type DOMPointerEvent =
  | MouseEvent
  | PointerEvent
  | TouchEvent
  | MouseEvent<Element, MouseEvent>
  | MouseEvent<Element, PointerEvent>
  | MouseEvent<Element, TouchEvent>

declare const DOMEvents: {
  hasButton: (e: DOMPointerEvent) => boolean
}

declare const Events: {
  Emit: typeof EmitEvents
  DOM: typeof DOMEvents
}

/**
 * Utils Api for inner states like object and meta-object
 */
declare const Utils: {
  Object: typeof ObjectUtils
  Meta: typeof MetaUtils
  Web: typeof WebUtils
  File: typeof FileUtils
}

declare const Consts: {
  Errors: {
    NotSupportedFile: () => string
  }
}
declare const ObjectUtils: {
  getMetaObjectIcon: (type?: MetaObject['type'], metaObject?: MetaObject) => string
}

export type IImportResult<T> = {
  object: Partial<T>
  meta: Partial<MetaObject>
}

declare const MetaUtils: {
  normalizeLocalFileToMeta: (
    file: File,
    options?: {
      limitType?: boolean
    }
  ) => Promise<IImportResult>
  normalizeBaiduDiskFileToMeta: () => IImportResult
  normalizeWebFileToMeta: (url: string, type: string) => IImportResult
  findPathsBetweenTwoMetaObjects: (sourceMetaId: number, targetMetaId: number) => number[][]
  getTypeName: (type: MetaObject['type']) => string
  getTypeRadius: (type: MetaObject['type']) => number
  fetchWebpageAndParseAsMeta: (url: string) => void
}

declare const FileUtils: {}

declare const WebUtils: {
  fetchDetails: (url: string) => Promise<{
    title: string
    description?: string
    image?: string
  }>
  // parse webpage as editor content
  parseWebpage: (
    url: string,
    html?: string
  ) => Promise<{
    title: string
    description?: string
    image?: string
    content: Descendant[]
    author?: string
    domain?: string
    favicon?: string
  }>
}

declare const Store: {
  NoteStore: () => NoteStore
  SearchStore: () => SearchStore
}
