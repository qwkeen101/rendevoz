import { createContext } from 'react'

export const LabelDetailsContext = createContext<
  Partial<{
    showSource?: boolean
    showAddNote?: boolean
    sidebarMode?: boolean
  }>
>({
  showSource: true,
  showAddNote: true
})
