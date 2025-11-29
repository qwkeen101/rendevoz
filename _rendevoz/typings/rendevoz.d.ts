/**
 * Core Api of Rendevoz
 */

import { ReactElement } from 'react'
import { ILayoutTab, OpenTabOptions, TabData } from './layout'
import {
  IWebpageInstance,
  IVideoInstance,
  IPDFInstance,
  IEditorInstance,
  IWhiteboardInstance,
  IFeedInstance,
  IYoutubeInstance
} from './components'
import { NoteStore } from './stores'
import { SearchStore } from './stores/search.store'
import { IChatInstance, MetaObject } from './data'
import { Descendant } from 'slate'
import { IPodcastInstance } from '../../src/core/components/podcast/hooks/usePodcastInstance'

export type IRendevoz = {
  Actions: typeof Action
  Utils: typeof Utils
  Events: typeof Events
  Consts: typeof Consts
}
export type ITabData = {
  id: string
}
/**
 * Layout actions Api
 */
declare const Layout: {
  closeAllTabs: (keepHome?: boolean) => void
  openNewTab: <T extends ILayoutTab['type']>({ data }: { data: OpenTabOptions<T> }) => void
  closeTab: (tabId: string) => void
  getFocusedTab: () => ITabData | undefined
  /**
   * Return tab id or undefined
   */
  hasTargetTab: <T extends ILayoutTab['type']>(tabData: OpenTabOptions<T>) => string | undefined
  getTab: <T extends ILayoutTab['type']>(opts: { objectId?: number; type: T }) => ILayoutTab | undefined
  /**
   * get all tabs whose content visiblity is not hidden
   */
  getVisibleTabs: () => ILayoutTab[]
  makeTabActive: (tabId: string) => void
  getRegisteredTabContent: <K extends ILayoutTab['type']>(type: K) => TabData[K]['content'] | undefined
  getTabById: (id: string) => ILayoutTab | undefined
}

/**
 * State actions Api
 */
declare const State: {
}

/**
 * Open tab/objects/metaObjects Api
 */
declare const Open: {
  openHome: VoidFunction
  openDatabase: VoidFunction
  openImage: (id: number) => void
  openChat: (id: number) => Promise<IChatInstance>
  openRecycleBin: VoidFunction
  openPodcast: () => Promise<IPodcastInstance>
  openFeed: () => Promise<IFeedInstance>
  openYoutube: () => Promise<IYoutubeInstance>
  Group: {
    openTypeGroup: (type: MetaObject['type']) => void
    openTagGroup: (tag: number) => void
    openCollectionGroup: (collection: number) => void
    openPropGroup: (propId: number) => void
  }
  openSidebarObjectDetails: (metaId: number) => void
  Pdf: {
    openPdf: (id: number) => Promise<IPDFInstance>
    openPdfLabel: (id: number) => Promise<void>
    openPdfPage: (pageIndex: number, id: number) => Promise<void>
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
}

declare const Notification: {
  success: (data: { message: string | ReactElement }) => void
  info: (data: { message: string | ReactElement }) => void
  error: (data: { message: string | ReactElement }) => void
}

/**
 * Actions Api
 */
declare const Action: {
  Layout: typeof Layout
  State: typeof State
  Open: typeof Open
  Notification: typeof Notification
  Store: typeof Store
}

/**
 *
 */

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
  getTypeName: (type: MetaObject['type']) => string
}

declare const FileUtils: {}

declare const WebUtils: {
  fetchDetails: (url: string) => Promise<{
    title: string
    description?: string
    image?: string
    author?: string
    audio?: string
    icon?: string
    html?: string
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
