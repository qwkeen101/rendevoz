import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import { ILayoutTab, TabData } from '..'

export interface WebpageInstance {
  transformToNote: () => Promise<CustomEditor>
  editor?: CustomEditor
  changeUrl: (url: string) => void
  webview?: WebpageInnerRef
}

export interface IWhiteboardInstance {
  // if true, opened, if false, not opened
  openTabInSidebar?: (tab: ILayoutTab) => ILayoutTab | undefined
}
