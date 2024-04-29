import { ISidebarState } from '@/components/layout/sidebar/index'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import produce from 'immer'
import { globalStore } from '@/api/stores'
import { sidebarStateAtom } from '@/components/layout/sidebar/useSidebarState'

export default async (updater: (curr: ISidebarState) => void) => {
  globalStore.set(
    sidebarStateAtom,
    produce(globalStore.get(sidebarStateAtom), d => updater(d))
  )
}
