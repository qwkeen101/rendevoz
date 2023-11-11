import { ReactElement } from 'react'
import { CustomTypes, IEditorInstance, IPdfInstance, IMediaInstance, IWebpageInstance } from '.'

export type IVideoTab = {
  type: 'video'
  instance: IMediaInstance
  objectId: number
}

export type IWhiteboardTab = {
  type: 'whiteboard'
  instance: never
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
  instance: IPdfInstance
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

export type IDatabaseTab = {
  type: 'database'
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
export type BuiltInTabTypes =
  | IVideoTab
  | IWhiteboardTab
  | INoteTab
  | IImageTab
  | IPDFTab
  | IWebpageTab
  | IDatabaseTab
  | IHomeTab
  | IGraphTab
  | IGroupTab

export type ILayoutTab = CustomTypes['Tab'] & {
  tabContent: ReactElement
  tabElement: HTMLElement
}

export type TabData = {
  [K in ILayoutTab['type']]: {
    type: K
    content: (options: {
      tab?: ILayoutTab
      objectId?: number
      onInstanceInitialized?: (instance: Extract<ILayoutTab, { type: K }>['instance']) => void
    }) => ReactElement | undefined | false | 0
    onTabActive?: () => void
  }
}
