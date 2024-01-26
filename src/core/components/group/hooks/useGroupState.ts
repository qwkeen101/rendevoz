import { atom, useAtom } from 'jotai'
import { Box, IMetaProp, MetaGroup, MetaGroupChild, MetaGroupProperty } from '~/typings'
import { IMetaGroupProps } from '@/core/components/group/MetaGroup'

export type IGroupGrouper = {
  id: number
  values: MetaGroupChild[]
  // toggled
  visible?: boolean
  name: string
  // visible in view
  hidden?: boolean
}
export type IGroupState = {
  isSelecting: boolean
  unToggledValueCount: number
  selectedCount: number
  unToggledSelectedCount: number
  triggered: number
  popoverVisible?: boolean
  headerColumn?: string
  tableWidth?: number
  sidebarWidth: number
  sidebarVisible: boolean
  shiftPressed: boolean
  visibleTypes: string[]
  unToggledIdSet: Set<number>
  isScrollingBody?: boolean
  availableNewProps?: IMetaProp[]
  layout?: IMetaGroupProps['layout']
  title?: IMetaGroupProps['title']
  state?: IMetaGroupProps['state']
  groups?: IGroupGrouper[]
  sidebarState?:
    | {
        type: 'preview'
        metaId: number
        rowId: number
      }
    | {
        type: 'labels'
        objectId: number
        objectType: string
      }
  pagePadding: number
  currentView?: MetaGroup['views'][0]
  // value index sorted value
  viewValues?: MetaGroupChild[]
  // after filter/sort values
  filterValues?: MetaGroupChild[]
  // after grouper values
  groupedValues?: MetaGroupChild[]
  unToggledSelectedRowIds?: Set<number>
  visibleProperties: MetaGroupProperty[]
  showOriginalText?: boolean
  currentViewProperties?: MetaGroupProperty[]
  horizontallyScrolled: boolean
  metaChanged?: number
} & {
  data?: MetaGroup
}
export const GroupStateAtom = atom<IGroupState>({
  horizontallyScrolled: false,
  isSelecting: false,
  sidebarWidth: 400,
  unToggledValueCount: 0,
  selectedCount: 0,
  visibleTypes: [],
  sidebarVisible: false,
  triggered: 0,
  unToggledSelectedCount: 0,
  unToggledIdSet: new Set<number>(),
  pagePadding: 60,
  visibleProperties: [],
  shiftPressed: false
})

const useGroupState = () => useAtom(GroupStateAtom)

export default useGroupState
