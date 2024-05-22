import commit from './commit'
import pull from './pull'
import listNeedUpload from './listNeedUpload'
import uploadModifiedLocalFiles from './uploadModifiedLocalFiles'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import SyncAPI from '@/api/sync'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import { throttle } from 'lodash'

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
    res.filesToDownload.length && (await client.downloadFile(res.filesToDownload))
    res.filesToUpload.length && (await client.uploadFile(res.filesToUpload))
  }
}
const syncLocalFiles = async () => {
  const client = SyncAPI.cloudClient()
  if (!client) return
  syncFolder('backup', client)
  await Promise.all([syncFolder('imgs', client), syncFolder('files', client)])
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
