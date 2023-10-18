import { IEditorInstance } from '../editor'

export type IWebpageInstance = Partial<{
  editorInstance: IEditorInstance
  changeUrl: (url: string) => void
}>
