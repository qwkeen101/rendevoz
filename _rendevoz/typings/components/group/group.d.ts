import { IBase, IMetaProperty, MetaFilterGroup } from '~/typings'
import { SorterGroup } from '../../../../src/core/object/filter/BetterSorter'

export type MetaGroupProperty = (
  | {
      type: 'basic'
      // translation key
      display: string
    }
  | {
      type: 'custom'
      propType: IMetaProperty['propType']
    }
) & {
  editable: boolean
  name: string
  icon: string
  visible: boolean
  id: number
  width?: number
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

export type MetaGroupViewProperty = {
  visible: boolean
  order: number
  width?: number
}
export interface MetaGroup extends IBase {
  belongsTo?: number
  // value id - index dict
  values: MetaGroupChild[]
  properties?: MetaGroupProperty[]
  views: ((
    | {
        type: 'table'
        options: {
          wrapColumns?: boolean
          properties?: Record<
            number,
            MetaGroupViewProperty & {
              width: number
            }
          >
        }
      }
    | {
        type: 'gallery'
        options: {
          wrapColumns?: boolean
          properties?: Record<number, MetaGroupViewProperty>
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
  onlyShowCustomProperties?: boolean
}
