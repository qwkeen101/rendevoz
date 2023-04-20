import { CustomEditor } from './editor'

export interface WebpageInstance {
  transformToNote: () => Promise<CustomEditor>
  editor?: CustomEditor
}
