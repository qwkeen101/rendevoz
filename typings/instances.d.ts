import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'

export interface WebpageInstance {
  transformToNote: () => Promise<CustomEditor>
  editor?: CustomEditor
  changeUrl: (url: string) => void
  webview?: WebpageInnerRef
}
