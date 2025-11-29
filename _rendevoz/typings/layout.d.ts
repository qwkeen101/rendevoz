import { ReactElement } from 'react'
import {
  CustomTypes,
  IEditorInstance,
  IPDFInstance,
  IMediaInstance,
  IWebpageInstance,
  IWhiteboardInstance,
  IYoutubeInstance,
  IFeedInstance,
  IChatInstance
} from '.'
import { MetaObject } from '.'
import { IPodcastInstance } from '../../src/core/components/podcast/hooks/usePodcastInstance'

export type IVideoTab = {
  type: 'video'
  instance: IMediaInstance
  objectId: number
}

export type IWhiteboardTab = {
  type: 'whiteboard'
  instance: IWhiteboardInstance
  objectId: number
}

export type INoteTab = {
  type: 'note'
  instance: IEditorInstance
  objectId: number
}

export type IImageTab = {
  type: 'image'
  instance: never
  objectId: number
}

export type IPDFTab = {
  type: 'pdf'
  instance: IPDFInstance
  objectId: number
}

export type IWebpageTab = {
  type: 'webpage'
  instance: IWebpageInstance
  objectId: number
}

export type IHomeTab = {
  type: 'home'
  instance: never
  objectId: never
}

export type ILibraryTab = {
  type: 'library'
  instance: never
  objectId: never
}

export type IGraphTab = {
  type: 'graph'
  instance: never
  objectId: never
}
export type IGroupTab = {
  type: 'group'
  instance: never
  objectId: number
}
export type IChatTab = {
  type: 'chat'
  instance: IChatInstance
  objectId: number
}
export type ICodeTab = {
  type: 'code'
  instance: never
  objectId: number
}
export type IYoutubeTab = {
  type: 'youtube'
  instance: IYoutubeInstance
  objectId: never
}
export type ITrashTab = {
  type: 'trash'
}
export type ITypeGroupTab = {
  type: 'typeGroup'
}

export type IPodcastTab = {
  type: 'podcast'
  instance: IPodcastInstance
  objectId: never
}

export type IFeedTab = {
  type: 'feed'
  instance: IFeedInstance
  objectId: never
}

export type IExamTab = {
  type: 'exam'
  objectId: number
}

export type IExamQuestionTab = {
  type: 'examQuestion'
  objectId: number
}

export type BuiltInTabTypes =
  | IVideoTab
  | IWhiteboardTab
  | INoteTab
  | IImageTab
  | IPDFTab
  | IWebpageTab
  | ILibraryTab
  | IHomeTab
  | IGraphTab
  | IGroupTab
  | ITypeGroupTab
  | ICodeTab
  | ITrashTab
  | IYoutubeTab
  | IPodcastTab
  | IFeedTab
  | IChatTab
  | IExamTab
  | IExamQuestionTab
export type ILayoutTab = BuiltInTabTypes & {
  tabContent: ReactElement
  tabElement: HTMLElement
  metaType?: MetaObject['type']
}

export type OpenTabOptions<K> = {
  objectId?: number
  metaId?: number
  type: K
  onInstanceInitialized?: (instance: BuiltInTabTypes[K]['instance']) => void
}
export type TabData = {
  [K in ILayoutTab['type']]: {
    type: K
    content: (options: {
      tab?: ILayoutTab
      objectId?: number | string
      metaId?: number
      onInstanceInitialized?: (instance: Extract<ILayoutTab, { type: K }>['instance']) => void
    }) => ReactElement | undefined | false | 0 | ''
    onTabActive?: () => void
  }
}
