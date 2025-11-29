import initializeWorkspace from './initializeWorkspace'
import initializeDefaultKeyvalues from './initializeDefaultKeyvalues'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import initializeLegacyProperties from '@/api/lifycycle/initializeApp/initializeLegacyProperties'
import initializeLegacyCollections from '@/api/lifycycle/initializeApp/initializeLegacyCollections'

export default async () => {
  KeyvalueStore.clearAtomData()
  await initializeWorkspace()
  await initializeDefaultKeyvalues()
  await initializeLegacyCollections()
  await initializeLegacyProperties()
  await KeyvalueStore.getAll()
}
