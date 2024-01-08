import { CollectionStore, MetaStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import produce from 'immer'
import { toast } from 'react-hot-toast'

export default {
  hasWorkspace: async (name: string) => {
    const allWorkspaces = await KeyvalueStore.getOne('allWorkspaces')
    if (allWorkspaces?.some(o => o.name === name)) {
      return true
    }
    return false
  },
  deleteCurrentWorkspace: async () => {
    const allMetaIds = Array.from(MetaStore.getMetaObjectsMap().keys())
    allMetaIds.forEach(id => MetaStore.deleteMetaObject(id, true, true))
    const allWorkspaces = await KeyvalueStore.getOne('allWorkspaces')
    const currentWorkspace = await KeyvalueStore.getOne('currentWorkspace')
    if (allWorkspaces && currentWorkspace) {
      KeyvalueStore.updateOne(
        'allWorkspaces',
        produce(allWorkspaces, s => {
          s.splice(
            s.findIndex(o => o.name === currentWorkspace),
            1
          )
        })
      )
    }
  },
  switchWorkspace: async (targetWorkspace: string) => {
    await KeyvalueStore.updateOne('currentWorkspace', targetWorkspace)
    await MetaStore.switchWorkspace()
    await CollectionStore.switchWorkspace()
  }
}
