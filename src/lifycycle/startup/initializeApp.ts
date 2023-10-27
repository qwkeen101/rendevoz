import initializeWorkspace from '@/lifycycle/startup/initializeWorkspace'
import { CollectionStore, MetaStore, ObjectStore } from '@/stores'
import KeyvalueStore from '@/stores/keyvalue.store'
import { ipcInstance } from '@/plugins'
import initializeFolder from '@/lifycycle/startup/initializeFolder'
import { initializeSearch } from '@/textSearch/SearchHelper'

export default async () => {
  await initializeFolder()
  await initializeWorkspace()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await CollectionStore.getAllCollections()
  await KeyvalueStore.getAll()
  await ObjectStore('tag').getAll()
  await initializeSearch()
  ipcInstance.send('appOk')
}
