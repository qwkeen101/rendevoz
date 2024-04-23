import { ICollectionItem } from '~/typings'

export type ISidebarItem = {
  id: number
  onlyCollection?: boolean
  selectMode?: boolean
  displayPinned?: boolean
  onClick?: (e: MouseEvent, item: ICollectionItem) => void
} & (
  | {
      draggable?: true | undefined
      parentId: number
      parentType: 'whiteboard' | 'collection'
    }
  | {
      draggable?: false | undefined
      parentId: never
      parentType: never
    }
)
