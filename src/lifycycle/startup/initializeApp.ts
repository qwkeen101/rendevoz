import initializeWorkspace from '@/lifycycle/startup/initializeWorkspace'
import { CollectionStore, MetaStore, ObjectStore } from '@/stores'
import KeyvalueStore from '@/stores/keyvalue.store'
import { ipcInstance } from '@/plugins'

export default async () => {
  await initializeWorkspace()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await CollectionStore.getAllCollections()
  await KeyvalueStore.getAll()
  await ObjectStore('tag').getAll()
  ipcInstance.send('appOk')
}
