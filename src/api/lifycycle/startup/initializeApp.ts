import initializeWorkspace from '@/api/lifycycle/startup/initializeWorkspace'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ipcInstance } from '@/electron'
import initializeFolder from '@/api/lifycycle/startup/initializeFolder'
import { initializeSearch } from '@/api/textSearch/SearchHelper'
import initializeUnnamedLabel from '@/api/lifycycle/startup/initializeUnnamedLabel'
import initializeUrlProp from '@/api/lifycycle/startup/initializeUrlProp'
import initializeSettings from '@/api/lifycycle/startup/initializeSettings'
import initializeDefaultKeyvalues from '@/api/lifycycle/startup/initializeDefaultKeyvalues'
import FileSystem from '@/api/fileSystem'
import recoverFromBackup from '@/api/lifycycle/startup/recoverFromBackup'
import initializeFilePath from './initializeFilePath'
import getNoteContainsMeta from '@/api/lifycycle/startup/getNoteContainsMeta'

export default async () => {
  await initializeFilePath()
  await initializeFolder()
  await recoverFromBackup()
  await initializeDefaultKeyvalues()
  await initializeWorkspace()
  await KeyvalueStore.getAll()
  await initializeSettings()
  await initializeUnnamedLabel()
  await initializeUrlProp()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await CollectionStore.getAllCollections()
  await ObjectStore('metaProp').getAll()
  await ObjectStore('metaPropSelectOption').getAll()
  await ObjectStore('tag').getAll()
  await initializeSearch()
  ipcInstance.send('appOk')
  getNoteContainsMeta()
}
