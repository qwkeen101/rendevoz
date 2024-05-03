import initializeFilePath from './initializeFilePath'
import initializeFolder from './initializeFolder'
import initializeWorkspace from './initializeWorkspace'
import initializeDefaultKeyvalues from './initializeDefaultKeyvalues'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import initializeSettings from '@/api/lifycycle/initializeApp/initializeSettings'

export default async () => {
  KeyvalueStore.clearAtomData()
  await initializeFilePath()
  await initializeFolder()
  await initializeWorkspace()
  await initializeDefaultKeyvalues()
  await KeyvalueStore.getAll()
  await initializeSettings()
}
