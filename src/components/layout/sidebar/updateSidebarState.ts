import { ISidebarState } from '@/components/layout/sidebar/index'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import produce from 'immer'

export default async (updater: (curr: ISidebarState) => void) => {
  const currState = KeyvalueStore.getOne('sidebarState') || {}
  const next = produce(currState, draft => {
    updater(draft)
  })
  await KeyvalueStore.updateOne('sidebarState', next)
}
