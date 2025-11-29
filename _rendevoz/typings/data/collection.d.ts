import { IBase } from './base'

export interface ICollection extends IBase {
  name?: string
  description?: string
  items: ICollectionItem[]
  parentId: number | 0
  color?: string
  icon?: string
  workspace: number
  image?: string
  viewAt?: number
  specType: 'collection'
}

export interface ICollectionItem {
  type: 'collection' | 'meta'
  id: number
}
