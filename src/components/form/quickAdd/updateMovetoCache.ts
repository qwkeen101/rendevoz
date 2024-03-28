import { WritableDraft } from 'immer/dist/types/types-external'
import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import produce from 'immer'

export default async (updater: (c: WritableDraft<Required<CurrentKeyValues>['moveToCache'][0]>) => void) => {
  const curr = KeyvalueStore.getOne('moveToCache') || {}
  const workspace = KeyvalueStore.getOne('currentWorkspace')
  if (workspace) {
    const n = produce(curr, draft => {
      const n = draft[workspace.id] || {}
      updater(n)
      draft[workspace.id] = n
    })
    KeyvalueStore.updateOne('moveToCache', n)
  }
}
