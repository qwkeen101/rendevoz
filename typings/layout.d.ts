import { ReactElement } from 'react'
import { MetaObject } from './data'
import { IVideoInstance } from './video'
import { IEditorInstance } from './editor'
import { IPdfViewer } from './pdf/core/viewer'

export type IVideoTab = {
  type: 'video'
  instance: IVideoInstance
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

export type ILayoutTab = (IVideoTab | IWhiteboardTab | INoteTab | IImageTab | IPDFTab | IWebpageTab | IDatabaseTab | IHomeTab) & {
  tabContent: ReactElement
  tabElement: HTMLElement
}
