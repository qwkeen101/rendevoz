import { createContext } from 'react'

export type EditorPageConfig = {
  editorHeader?: boolean
  editorAdd?: boolean
  defaultOpenSidebar?: boolean
  isInContentDisplayer?: boolean
}

export const defaultPageConfig: Required<EditorPageConfig> = {
  editorHeader: true,
  editorAdd: true,
  defaultOpenSidebar: true,
  isInContentDisplayer: false
}

const PageConfigContext = createContext<EditorPageConfig>(defaultPageConfig)

export default PageConfigContext
