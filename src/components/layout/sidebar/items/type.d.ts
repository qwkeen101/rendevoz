import { ICollectionItem } from '~/typings'

export type ISidebarItem = {
  id: number
  pin?: boolean
  onClick?: (e: MouseEvent, item: ICollectionItem) => void
} & (
  | {
      draggable?: true | undefined
      parentId: number
    }
  | {
      draggable?: false | undefined
      parentId: never
      parentType: never
    }
)
