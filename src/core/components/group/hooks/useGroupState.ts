import { atom, useAtom } from 'jotai'
import { Box, MetaGroup, MetaGroupChild, MetaGroupProperty } from '~/typings'

export const GroupStateAtom = atom<
  {
    isSelecting: boolean
    unToggledValueCount: number
    selectedCount: number
    unToggledSelectedCount: number
    triggered: number
    headerColumn?: string
    tableWidth?: number
    sidebarWidth: number
    sidebarVisible: boolean
    shiftPressed: boolean
    visibleTypes: string[]
    unToggledIdSet: Set<number>
    sidebarState?:
      | {
          type: 'preview'
          metaId: number
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
    visibleHeaders: MetaGroupProperty[]
    horizontallyScrolled: boolean
  } & {
    data?: MetaGroup
  }
>({
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
  visibleHeaders: [],
  shiftPressed: false
})

const useGroupState = () => useAtom(GroupStateAtom)

export default useGroupState
