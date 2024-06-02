import commit from './commit'
import pull from './pull'
import listNeedUpload from './listNeedUpload'
import uploadModifiedLocalFiles from './uploadModifiedLocalFiles'
import { globalStore } from '@/api/stores'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import SyncAPI from '@/api/sync'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'

const changeState = (
  type: 'downloading' | 'uploading',
  name: string,
  opts?: {
    progress?: number
    size?: number
    skiped?: boolean
    error?: boolean
  }
) => {
  const currState = globalStore.get(SyncAPI.stateAtom)
  globalStore.set(SyncAPI.stateAtom, {
    ...currState,
    [type]: {
      ...currState[type],
      [name]: {
        progress: opts?.progress,
        skiped: opts?.skiped,
        name: name,
        error: opts?.error,
        size: opts?.size ?? currState[type][name]?.size ?? 0
      }
    }
  })
}
const clearTasks = () => {
  const currState = globalStore.get(SyncAPI.stateAtom)
  globalStore.set(SyncAPI.stateAtom, {
    ...currState,
    downloading: Object.fromEntries(Object.entries(currState.downloading).filter(i => i[1].progress === 1)),
    uploading: Object.fromEntries(Object.entries(currState.uploading).filter(i => i[1].progress === 1))
  })
}
const syncFolder = async (dirName: string, client: ICloudSyncClient) => {
  const res = await syncBetweenLocalFolderAndCloudFolder(dirName)
  if (res) {
    await Promise.all([
      res.filesToDownload.length && client.queueFiles(res.filesToDownload, 'download'),
      res.filesToUpload.length && client.queueFiles(res.filesToUpload, 'upload')
    ])
  }
}
const syncLocalFiles = async () => {
  const client = SyncAPI.cloudClient()
  if (!client) return
  syncFolder('backup', client)
  await Promise.all([syncFolder('imgs', client), syncFolder('files', client)])
  globalStore.set(SyncAPI.stateAtom, { ...globalStore.get(SyncAPI.stateAtom), lastSynced: Date.now() })
}
const FileSync = {
  commit,
  pull,
  changeState,
  syncLocalFiles,
  listNeedUpload,
  uploadModifiedLocalFiles,
  clearTasks
}

export default FileSync
