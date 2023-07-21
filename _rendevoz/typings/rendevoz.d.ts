/**
 * Core Api of Rendevoz
 */

import { ReactElement } from 'react'
import { IEditorInstance } from '.'
import { GlobalInstances } from './globalInstances'
import { ILayoutTab, TabData } from './layout'
import { IPdfInstance } from './pdf'
import { IVideoInstance } from './video'
import { IWebpageInstance } from './webpage'
import { EditorEventMap, GlobalEventMap, IEventEmitter, IEventHandler, PdfEventMap } from './event'
import { NoteStore } from './stores'
import { SearchStore } from './stores/search.store'
import { MetaObject } from './data'
import { InnerComponents, InnerHooks } from './inner'

export type IRendevoz = {
  Actions: typeof Action
  Utils: typeof Utils
  Events: typeof Events
  InnerHooks: typeof InnerHooks
  InnerComponents: typeof InnerComponents
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
    openWhiteboard: (id: number) => Promise<void>
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
  uploadFile: () => Promise<File[]>
  /**
   * Return local image path of saved image
   */
  saveImage: (
    imageData: string | Blob,
    options?: {
      imgName?: string
      compress: boolean
    }
  ) => Promise<string | undefined>
  /**
   * Return local image path of saved file
   */
  saveFile: (blob: Blob, name?: string, path?: string, saveAt?: 'files' | 'imgs' | 'backup') => Promise<string | undefined>
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
}

declare const ObjectUtils: {
  getMetaObjectIcon: (type?: MetaObject['type'], metaObject?: MetaObject) => string
}

declare const MetaUtils: {
  findPathsBetweenTwoMetaObjects: (sourceMetaId: number, targetMetaId: number) => number[][]
  getTypeName: (type: MetaObject['type']) => string
}

declare const Store: {
  NoteStore: () => NoteStore
  SearchStore: () => SearchStore
}
