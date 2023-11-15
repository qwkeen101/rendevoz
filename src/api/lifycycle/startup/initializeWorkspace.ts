import { useDb } from '@/hooks'
import { ICollection, MetaObject } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const initializeWorkspace = async () => {
  const keyvalueDb = useDb('keypairs')
  await KeyvalueStore.getAll()
  const currentWorkspace = (await keyvalueDb.get('currentWorkspace')) || 'default'
  const allWorkspace = (await keyvalueDb.get('allWorkspaces')) || [
    {
      createdAt: Date.now(),
      name: 'default'
    }
  ]
  if (!(await keyvalueDb.get('currentWorkspace'))) {
    await keyvalueDb.put(currentWorkspace, 'currentWorkspace')
  }
  if (!(await keyvalueDb.get('allWorkspaces'))) {
    await keyvalueDb.put(allWorkspace, 'allWorkspaces')
  }
  const metaObjectDb = useDb('metaObjects')
  const collectionDb = useDb('collections')
  const allCollections = (await collectionDb.filter(i => !i.workspace).toArray()) as ICollection[]
  const all = (await metaObjectDb.filter(i => !i.workspace).toArray()) as MetaObject[]
  const update = all.map(i => ({ ...i, workspace: currentWorkspace }))
  const updateCollection = allCollections.map(i => ({ ...i, workspace: currentWorkspace }))
  if (update.length) {
    await metaObjectDb.bulkPut(update)
  }
  if (updateCollection.length) {
    await collectionDb.bulkPut(updateCollection)
  }
}

export default initializeWorkspace
