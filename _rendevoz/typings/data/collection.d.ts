import { IBase } from './base'

export interface ICollection extends IBase {
  name?: string
  description?: string
  items?: ICollectionItem[]
  parentId?: number | 0
  color?: string
  icon?: string
  toggled?: boolean
  workspace?: number
}

export interface ICollectionItem {
  type?: 'note' | 'document' | 'collection' | 'whiteboard' | 'image' | 'video' | 'audio' | 'meta'
  id?: number
}
