import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import produce from 'immer'
import { toast } from 'react-hot-toast'

export default {
  hasWorkspace: async (id: number) => {
    const allWorkspaces = await KeyvalueStore.getOne('allWorkspaces')
    if (allWorkspaces?.some(o => o.id === id)) {
      return true
    }
    return false
  },
  deleteCurrentWorkspace: async () => {
    const allMetaIds = Array.from(MetaStore.getMetaObjectsMap().keys())
    allMetaIds.forEach(id =>
      MetaStore.deleteMetaObject(id, {
        silent: true,
        force: true
      })
    )
    const allWorkspaces = await KeyvalueStore.getOne('allWorkspaces')
    const currentWorkspace = await KeyvalueStore.getOne('currentWorkspace')
    if (allWorkspaces && currentWorkspace) {
      KeyvalueStore.updateOne(
        'allWorkspaces',
        produce(allWorkspaces, s => {
          s.splice(
            s.findIndex(o => o.id === currentWorkspace.id),
            1
          )
        })
      )
    }
  },
  switchWorkspace: async (targetWorkspaceId: number) => {
    const targetWorkspace = (await KeyvalueStore.getOne('allWorkspaces'))?.find(i => i.id === targetWorkspaceId)
    if (targetWorkspace) {
      await KeyvalueStore.updateOne('currentWorkspace', targetWorkspace)
      await MetaStore.switchWorkspace()
      await ObjectStore('tag').getAll()
      await CollectionStore.switchWorkspace()
    }
  }
}
