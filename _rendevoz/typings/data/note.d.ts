import { IBase, ISidebarDefaultProps } from './base'
import { IEditorAISummary, ILabelContainerProps, ISubChat } from '~/typings'

export interface INote extends IBase, ILabelContainerProps, ISidebarDefaultProps {
  name: string
  metaId?: number
  contentId: number
  labels?: number[]
  width?: 'default' | 'full' | 'wider'
  // synced blocks meta ids
  syncedBlocks?: number[]
  lastSavedAt?: number
  aiChat?: ISubChat
  exam?: number
  aiSummary?: IEditorAISummary
  // meta id => block id arr
  insideMetas?: Record<number, number[]>
}
