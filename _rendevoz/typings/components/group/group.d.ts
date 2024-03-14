import { IBase, IMetaProperty, MetaFilterGroup } from '~/typings'
import { SorterGroup } from '../../../../src/core/object/filter/BetterSorter'
import { DateGroupRule, IGroupRule, StringGroupRule } from '~/typings/components/group/property-group'

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

export type IGroupGrouper = {
  id: number
  values: MetaGroupChild[]
  // toggled
  visible?: boolean
  name: string
  // visible in view
  hidden?: boolean
}

export type MetaGroupChild = {
  rowId: number
  children?: MetaGroupChild[]
  syncVersion?: number
  toggled?: boolean
  // when have grouper, there maybe two same rowId item appear at the same time
  tempRowId?: number
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

export type IMetaGroupGrouper = {
  propertyId: number
  propertyGroupType: 'basic' | 'custom'
} & IGroupRule

export interface MetaGroup extends IBase {
  belongsTo?: number
  // value id - index dict
  values: MetaGroupChild[]
  properties?: MetaGroupProperty[]
  views: ((
    | {
        type: 'kanban'
        options: {
          wrapColumns?: boolean
          properties?: Record<number, MetaGroupViewProperty>
        }
      }
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
          cardSize?: 'small' | 'medium' | 'large'
          fitImage?: boolean
          cardCover?: 'cover' | 'none' | 'content'
          hideCoverIfEmpty?: boolean
        }
      }
    | {
        type: 'list'
        options: {
          wrapColumns?: boolean
          properties?: Record<number, MetaGroupViewProperty>
        }
      }
    | {
        type: 'calendar'
        options: {
          wrapColumns?: boolean
          calendarSize?: 'standard' | 'large'
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
    group?: IMetaGroupGrouper
    storedGroups?: IGroupGrouper[]
  })[]
  rootFilterGroup: MetaFilterGroup
  autoAddto: 'first' | 'last'
  openIn?: 'center' | 'newTab' | 'sidePeek'
  syncVersion: number
  lastViewId?: number
  hideGroupsInside?: boolean
  hideObjectsInside?: boolean
  onlyShowCustomProperties?: boolean
  enableReview?: boolean
}
