import { useDb } from '@/hooks'
import { ICollection, MetaObject } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import Id from '@/utils/id'

const initializeWorkspace = async () => {
  // v0.7.4
  const keyvalueDb = useDb('keypairs')
  const defaultWorkspaceId = Id.getId()
  let currentWorkspace = await keyvalueDb.get('currentWorkspace')
  const defaultWorkspace = {
    name: 'default',
    createdAt: Date.now(),
    id: defaultWorkspaceId
  }
  const workspaceNameToId: Record<string, number> = {}
  const allWorkspace = (await keyvalueDb.get('allWorkspaces')) || [defaultWorkspace]
  allWorkspace.forEach(i => {
    if (!i.id) {
      i.id = Id.getId()
      workspaceNameToId[i.name] = i.id
    }
  })

  if (typeof currentWorkspace === 'string') {
    currentWorkspace = allWorkspace.find(i => i.name === currentWorkspace) || defaultWorkspace
  } else if (currentWorkspace === undefined) {
    currentWorkspace = defaultWorkspace
  }

  await keyvalueDb.put(currentWorkspace, 'currentWorkspace')
  await keyvalueDb.put(allWorkspace, 'allWorkspaces')
  const metaObjectDb = useDb('metaObjects')
  const collectionDb = useDb('collections')
  const allCollections = (await collectionDb.filter(i => !i.workspace || typeof i.workspace !== 'number').toArray()) as ICollection[]
  const all = (await metaObjectDb.filter(i => !i.workspace || typeof i.workspace !== 'number').toArray()) as MetaObject[]
  const update = all.map(i => ({ ...i, workspace: workspaceNameToId[i.workspace] || currentWorkspace.id }))
  const updateCollection = allCollections.map(i => ({ ...i, workspace: workspaceNameToId[i.workspace] || currentWorkspace.id }))
  if (update.length) {
    await metaObjectDb.bulkPut(update)
  }
  if (updateCollection.length) {
    await collectionDb.bulkPut(updateCollection)
  }
}

export default initializeWorkspace
