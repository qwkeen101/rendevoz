import { CustomEditor } from './editor'

export interface EditorInstance {
  editor: CustomEditor
  goToBlock: (blockId: number) => void
  goToHighlight: (highlightId: number) => void
}
export interface WebpageInstance {
  transformToNote: () => Promise<EditorInstance>
  editorInstance?: EditorInstance
}
