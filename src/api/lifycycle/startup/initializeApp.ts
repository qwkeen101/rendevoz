import initializeWorkspace from '@/api/lifycycle/startup/initializeWorkspace'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ipcInstance } from '@/plugins'
import initializeFolder from '@/api/lifycycle/startup/initializeFolder'
import { initializeSearch } from '@/api/textSearch/SearchHelper'
import initializeUnnamedLabel from '@/api/lifycycle/startup/initializeUnnamedLabel'
import initializeUrlProp from '@/api/lifycycle/startup/initializeUrlProp'
import initializeSettings from '@/api/lifycycle/startup/initializeSettings'
import initializeDefaultKeyvalues from '@/api/lifycycle/startup/initializeDefaultKeyvalues'

export default async () => {
  await initializeDefaultKeyvalues()
  await KeyvalueStore.getAll()
  await initializeSettings()
  await initializeFolder()
  await initializeUnnamedLabel()
  await initializeUrlProp()
  await initializeWorkspace()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await CollectionStore.getAllCollections()
  await ObjectStore('metaProp').getAll()
  await ObjectStore('metaPropSelectOption').getAll()
  await ObjectStore('tag').getAll()
  await initializeSearch()
  ipcInstance.send('appOk')
}
