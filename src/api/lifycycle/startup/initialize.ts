import { ipcInstance } from '@/electron'
import recoverFromBackup from '@/api/lifycycle/startup/recoverFromBackup'
import GlobalStates from '@/api/global/states'
import indexData from '@/api/lifycycle/indexData'
import initializeApp from '@/api/lifycycle/initializeApp'
import postProcess from '@/api/lifycycle/postProcess'
import startupSync from '@/api/sync/lifecycle/startup'
import autoSync from '@/api/sync/autoSync'
import { subDataChange } from '@/api/stores'
import initializeSettings from '@/api/lifycycle/initializeApp/initializeSettings'

export default async () => {
  await initializeSettings()
  await startupSync()
  await recoverFromBackup()
  GlobalStates.setState('loading', s => ({ ...s, currentState: 'initializing' }))
  await initializeApp()
  GlobalStates.setState('loading', s => ({ ...s, currentState: 'indexing data' }))
  await indexData(false)
  ipcInstance.send('appOk')
  postProcess()
  autoSync()
  subDataChange()
}
