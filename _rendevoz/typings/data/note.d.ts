import { IBase } from './base'
import { ILabelContainerProps } from '~/typings'

export interface INote extends IBase, ILabelContainerProps {
  name: string
  metaId?: number
  contentId: number
  labels?: number[]
  width?: 'default' | 'full' | 'wider'
  // synced blocks meta ids
  syncedBlocks?: number[]
  lastSavedAt?: number
  // meta id => block id arr
  insideMetas?: Record<number, number[]>
}
