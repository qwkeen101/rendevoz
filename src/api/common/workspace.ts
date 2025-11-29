import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import produce from 'immer'
import { Id } from '@/utils'

export default {
  hasWorkspace: async (id: number) => {
    const allWorkspaces = KeyvalueStore.getOne('allWorkspaces')
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
    const allWorkspaces = KeyvalueStore.getOne('allWorkspaces')
    const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
    if (allWorkspaces && currentWorkspace) {
      const curr = produce(allWorkspaces, s => {
        s.splice(
          s.findIndex(o => o.id === currentWorkspace.id),
          1
        )
      })
      KeyvalueStore.updateOne('allWorkspaces', curr)
      if (curr.length) {
        KeyvalueStore.updateOne('currentWorkspace', curr[0])
      }
    }
  },
  addWorkspace: async (name = '') => {
    const id = Id.getId()
    await KeyvalueStore.updateOne('allWorkspaces', [
      ...(KeyvalueStore.getOne('allWorkspaces') || []),
      {
        createdAt: Date.now(),
        name,
        id
      }
    ])
    return id
  },
  switchWorkspace: async (targetWorkspaceId: number) => {
    const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
    if (currentWorkspace?.id === targetWorkspaceId) return
    const targetWorkspace = KeyvalueStore.getOne('allWorkspaces')?.find(i => i.id === targetWorkspaceId)
    if (targetWorkspace) {
      Global.layoutOps?.closeAllTabs(true)
      KeyvalueStore.updateOne('currentWorkspace', targetWorkspace)
      await MetaStore.switchWorkspace()
      await ObjectStore('tag').getAll()
    }
  }
}
