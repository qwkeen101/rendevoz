import { IBase, MetaFilterGroup } from '~/typings'
import { SorterGroup } from '../../../../src/core/object/filter/BetterSorter'

export type MetaGroupProperty = {
  type: 'basic' | 'custom'
  editable: boolean
  name: string
  // translation key
  display: string
  icon: string
  visible: boolean
}
export type MetaGroupChild = {
  rowId: number
  children?: MetaGroupChild[]
  syncVersion?: number
  toggled?: boolean
} & { type: 'metaObject'; id: number }

export type MetaGroupPropertyOption = {
  // property name key
  name: string
  // header width
  width: string
}

export interface MetaGroup extends IBase {
  belongsTo?: number
  // value id - index dict
  values: MetaGroupChild[]
  views: ((
    | {
        type: 'table'
        options: {
          wrapColumns?: boolean
          properties?: (MetaGroupProperty & {
            width: number
          })[]
        }
      }
    | {
        type: 'gallery'
        options: {
          properties?: MetaGroupProperty[]
        }
      }
  ) & {
    // view id
    id: number
    name: string
    icon?: string
    // view specific value index
    valueIndex: number[]
    // store view specific untoggled row ids
    unToggledIds: number[]
    filter?: MetaFilterGroup
    sort?: SorterGroup
    search?: string
  })[]
  rootFilterGroup: MetaFilterGroup
  autoAddto: 'first' | 'last'
  openIn?: 'center' | 'newTab' | 'sidePeek'
  syncVersion: number
  lastViewId?: number
  hideGroupsInside?: boolean
  hideObjectsInside?: boolean
}
