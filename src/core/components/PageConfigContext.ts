import { createContext } from 'react'

export type IPageConfig = Partial<{
  editorHeader: boolean
  pdfHeader: boolean
  editorAdd: boolean
  whiteboardHeader: boolean
  messageTitle: boolean
  defaultOpenSidebar: boolean
  isInContentDisplayer: boolean
  chatHeader: boolean
}>

const PageConfigContext = createContext<IPageConfig>({
  editorHeader: true,
  pdfHeader: true,
  messageTitle: true,
  editorAdd: true,
  whiteboardHeader: true,
  defaultOpenSidebar: true,
  isInContentDisplayer: false
})
export default PageConfigContext
